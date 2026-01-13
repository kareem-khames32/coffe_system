const db = require('../config/database');

// Get available batches in FIFO order for a specific material
exports.getAvailableBatches = async (req, res) => {
  try {
    const { material_id, warehouse_id } = req.query;

    let query = `
      SELECT * FROM available_batches_fifo
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      query += ` AND raw_material_id = ?`;
      params.push(material_id);
    }

    if (warehouse_id) {
      query += ` AND warehouse_id = ?`;
      params.push(warehouse_id);
    }

    const [batches] = await db.query(query, params);

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('Error fetching available batches:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الدفعات المتاحة',
      error: error.message,
    });
  }
};

// Auto-consume materials using FIFO logic
exports.autoConsumeMaterial = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      raw_material_id,
      warehouse_id,
      quantity_to_consume,
      consumption_type = 'production',
      reference_id = null,
      reference_type = null,
      notes = null,
    } = req.body;

    // Validation
    if (!raw_material_id || !warehouse_id || !quantity_to_consume) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم معرف المادة، المستودع، والكمية المطلوبة',
      });
    }

    if (quantity_to_consume <= 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية يجب أن تكون أكبر من صفر',
      });
    }

    // Get available batches in FIFO order
    const [availableBatches] = await connection.query(
      `SELECT * FROM available_batches_fifo
       WHERE raw_material_id = ? AND warehouse_id = ?
       ORDER BY production_date ASC, created_at ASC`,
      [raw_material_id, warehouse_id]
    );

    if (availableBatches.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'لا توجد دفعات متاحة لهذه المادة',
      });
    }

    // Calculate total available quantity
    const totalAvailable = availableBatches.reduce(
      (sum, batch) => sum + parseFloat(batch.remaining_quantity),
      0
    );

    if (totalAvailable < quantity_to_consume) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `الكمية المتاحة (${totalAvailable}) غير كافية. الكمية المطلوبة: ${quantity_to_consume}`,
      });
    }

    let remainingToConsume = parseFloat(quantity_to_consume);
    const consumedBatches = [];

    // Consume batches using FIFO
    for (const batch of availableBatches) {
      if (remainingToConsume <= 0) break;

      const batchRemaining = parseFloat(batch.remaining_quantity);
      const consumeFromBatch = Math.min(batchRemaining, remainingToConsume);

      // Record consumption
      await connection.query(
        `INSERT INTO batch_consumption
         (batch_id, raw_material_id, warehouse_id, quantity_consumed,
          consumption_type, reference_id, reference_type, consumed_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batch.id,
          raw_material_id,
          warehouse_id,
          consumeFromBatch,
          consumption_type,
          reference_id,
          reference_type,
          req.user.id,
          notes,
        ]
      );

      // Update batch remaining quantity
      const newRemaining = batchRemaining - consumeFromBatch;
      await connection.query(
        `UPDATE material_batches
         SET remaining_quantity = ?
         WHERE id = ?`,
        [newRemaining, batch.id]
      );

      // If batch is fully consumed, mark as depleted (optional)
      if (newRemaining <= 0) {
        await connection.query(
          `UPDATE material_batches
           SET remaining_quantity = 0
           WHERE id = ?`,
          [batch.id]
        );
      }

      consumedBatches.push({
        batch_number: batch.batch_number,
        consumed: consumeFromBatch,
        remaining: newRemaining,
      });

      remainingToConsume -= consumeFromBatch;
    }

    // Update raw material total stock
    await connection.query(
      `UPDATE raw_materials
       SET current_stock = current_stock - ?
       WHERE id = ?`,
      [quantity_to_consume, raw_material_id]
    );

    // Log inventory transaction
    await connection.query(
      `INSERT INTO inventory_transactions
       (raw_material_id, warehouse_id, transaction_type, quantity,
        transaction_date, notes, user_id)
       VALUES (?, ?, 'consumption', ?, NOW(), ?, ?)`,
      [
        raw_material_id,
        warehouse_id,
        -quantity_to_consume,
        `استهلاك تلقائي FIFO: ${notes || consumption_type}`,
        req.user.id,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'تم استهلاك المواد بنجاح باستخدام FIFO',
      data: {
        total_consumed: quantity_to_consume,
        batches_used: consumedBatches.length,
        details: consumedBatches,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in auto consume:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استهلاك المواد',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Record manual batch consumption
exports.recordConsumption = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      batch_id,
      quantity_consumed,
      consumption_type = 'production',
      reference_id = null,
      reference_type = null,
      notes = null,
    } = req.body;

    // Validation
    if (!batch_id || !quantity_consumed) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم معرف الدفعة والكمية المستهلكة',
      });
    }

    // Get batch details
    const [batches] = await connection.query(
      `SELECT mb.*, rm.warehouse_id
       FROM material_batches mb
       JOIN raw_materials rm ON mb.raw_material_id = rm.id
       WHERE mb.id = ?`,
      [batch_id]
    );

    if (batches.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    const batch = batches[0];

    if (batch.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'لا يمكن الاستهلاك من دفعة غير نشطة',
      });
    }

    const remaining = parseFloat(batch.remaining_quantity);
    if (quantity_consumed > remaining) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `الكمية المتبقية في الدفعة (${remaining}) أقل من الكمية المطلوبة (${quantity_consumed})`,
      });
    }

    // Record consumption
    await connection.query(
      `INSERT INTO batch_consumption
       (batch_id, raw_material_id, warehouse_id, quantity_consumed,
        consumption_type, reference_id, reference_type, consumed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batch_id,
        batch.raw_material_id,
        batch.warehouse_id,
        quantity_consumed,
        consumption_type,
        reference_id,
        reference_type,
        req.user.id,
        notes,
      ]
    );

    // Update batch remaining quantity
    const newRemaining = remaining - parseFloat(quantity_consumed);
    await connection.query(
      `UPDATE material_batches
       SET remaining_quantity = ?
       WHERE id = ?`,
      [newRemaining, batch_id]
    );

    // Update raw material total stock
    await connection.query(
      `UPDATE raw_materials
       SET current_stock = current_stock - ?
       WHERE id = ?`,
      [quantity_consumed, batch.raw_material_id]
    );

    // Log inventory transaction
    await connection.query(
      `INSERT INTO inventory_transactions
       (raw_material_id, warehouse_id, transaction_type, quantity,
        transaction_date, notes, user_id)
       VALUES (?, ?, 'consumption', ?, NOW(), ?, ?)`,
      [
        batch.raw_material_id,
        batch.warehouse_id,
        -quantity_consumed,
        `استهلاك يدوي من دفعة ${batch.batch_number}: ${notes || consumption_type}`,
        req.user.id,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'تم تسجيل الاستهلاك بنجاح',
      data: {
        batch_number: batch.batch_number,
        consumed: quantity_consumed,
        new_remaining: newRemaining,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording consumption:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الاستهلاك',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Get consumption history
exports.getConsumptionHistory = async (req, res) => {
  try {
    const { material_id, warehouse_id, batch_id, from, to, type } = req.query;

    let query = `SELECT * FROM batch_consumption_history WHERE 1=1`;
    const params = [];

    if (material_id) {
      query += ` AND raw_material_id = ?`;
      params.push(material_id);
    }

    if (warehouse_id) {
      query += ` AND warehouse_id = ?`;
      params.push(warehouse_id);
    }

    if (batch_id) {
      query += ` AND batch_id = ?`;
      params.push(batch_id);
    }

    if (type) {
      query += ` AND consumption_type = ?`;
      params.push(type);
    }

    if (from) {
      query += ` AND consumption_date >= ?`;
      params.push(from);
    }

    if (to) {
      query += ` AND consumption_date <= ?`;
      params.push(to);
    }

    query += ` ORDER BY consumption_date DESC LIMIT 500`;

    const [history] = await db.query(query, params);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching consumption history:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب سجل الاستهلاك',
      error: error.message,
    });
  }
};

// Get consumption statistics
exports.getConsumptionStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    let dateFilter = '';
    const params = [];

    if (from) {
      dateFilter += ' AND consumption_date >= ?';
      params.push(from);
    }

    if (to) {
      dateFilter += ' AND consumption_date <= ?';
      params.push(to);
    }

    // Total consumption by material
    const [byMaterial] = await db.query(
      `SELECT
         rm.id,
         rm.name,
         rm.unit,
         SUM(bc.quantity_consumed) AS total_consumed,
         COUNT(DISTINCT bc.batch_id) AS batches_used,
         COUNT(*) AS consumption_count
       FROM batch_consumption bc
       JOIN raw_materials rm ON bc.raw_material_id = rm.id
       WHERE 1=1 ${dateFilter}
       GROUP BY rm.id, rm.name, rm.unit
       ORDER BY total_consumed DESC`,
      params
    );

    // Consumption by type
    const [byType] = await db.query(
      `SELECT
         consumption_type,
         COUNT(*) AS count,
         SUM(quantity_consumed) AS total_quantity
       FROM batch_consumption
       WHERE 1=1 ${dateFilter}
       GROUP BY consumption_type`,
      params
    );

    // Consumption by warehouse
    const [byWarehouse] = await db.query(
      `SELECT
         w.id,
         w.name,
         SUM(bc.quantity_consumed) AS total_consumed,
         COUNT(*) AS consumption_count
       FROM batch_consumption bc
       JOIN warehouses w ON bc.warehouse_id = w.id
       WHERE 1=1 ${dateFilter}
       GROUP BY w.id, w.name
       ORDER BY total_consumed DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        by_material: byMaterial,
        by_type: byType,
        by_warehouse: byWarehouse,
      },
    });
  } catch (error) {
    console.error('Error fetching consumption stats:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات الاستهلاك',
      error: error.message,
    });
  }
};

// Get batch consumption details
exports.getBatchConsumption = async (req, res) => {
  try {
    const { batch_id } = req.params;

    const [consumption] = await db.query(
      `SELECT * FROM batch_consumption_history
       WHERE batch_id = ?
       ORDER BY consumption_date DESC`,
      [batch_id]
    );

    // Get batch summary
    const [batch] = await db.query(
      `SELECT
         mb.*,
         rm.name AS material_name,
         rm.unit,
         (mb.original_quantity - mb.remaining_quantity) AS total_consumed
       FROM material_batches mb
       JOIN raw_materials rm ON mb.raw_material_id = rm.id
       WHERE mb.id = ?`,
      [batch_id]
    );

    res.json({
      success: true,
      data: {
        batch: batch[0],
        consumption_history: consumption,
      },
    });
  } catch (error) {
    console.error('Error fetching batch consumption:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تفاصيل استهلاك الدفعة',
      error: error.message,
    });
  }
};
