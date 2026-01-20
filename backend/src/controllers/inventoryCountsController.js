const db = require('../config/database');

// Get all inventory counts
exports.getAllCounts = async (req, res) => {
  try {
    const { warehouse_id, status, from, to } = req.query;

    let query = `
      SELECT
        ic.*,
        w.name AS warehouse_name,
        u1.full_name AS created_by_name,
        u2.full_name AS completed_by_name,
        (SELECT COUNT(*) FROM inventory_count_items WHERE count_id = ic.id) AS items_count,
        (SELECT COUNT(*) FROM inventory_count_items ici WHERE ici.count_id = ic.id AND ici.variance != 0) AS variance_count
      FROM inventory_counts ic
      JOIN warehouses w ON ic.warehouse_id = w.id
      JOIN users u1 ON ic.created_by = u1.id
      LEFT JOIN users u2 ON ic.completed_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (warehouse_id) {
      query += ` AND ic.warehouse_id = ?`;
      params.push(warehouse_id);
    }

    if (status) {
      query += ` AND ic.status = ?`;
      params.push(status);
    }

    if (from) {
      query += ` AND ic.count_date >= ?`;
      params.push(from);
    }

    if (to) {
      query += ` AND ic.count_date <= ?`;
      params.push(to);
    }

    query += ` ORDER BY ic.created_at DESC`;

    const [counts] = await db.query(query, params);

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Error fetching inventory counts:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الجرد',
      error: error.message,
    });
  }
};

// Get count by ID with items
exports.getCountById = async (req, res) => {
  try {
    const { id } = req.params;

    const [counts] = await db.query(
      `SELECT
         ic.*,
         w.name AS warehouse_name,
         u1.full_name AS created_by_name,
         u2.full_name AS completed_by_name
       FROM inventory_counts ic
       JOIN warehouses w ON ic.warehouse_id = w.id
       JOIN users u1 ON ic.created_by = u1.id
       LEFT JOIN users u2 ON ic.completed_by = u2.id
       WHERE ic.id = ?`,
      [id]
    );

    if (counts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الجرد غير موجود',
      });
    }

    // Get count items
    const [items] = await db.query(
      `SELECT
         ici.*,
         rm.name AS material_name,
         rm.unit,
         mb.batch_number
       FROM inventory_count_items ici
       JOIN raw_materials rm ON ici.raw_material_id = rm.id
       LEFT JOIN material_batches mb ON ici.batch_id = mb.id
       WHERE ici.count_id = ?
       ORDER BY rm.name`,
      [id]
    );

    res.json({
      success: true,
      data: {
        count: counts[0],
        items: items,
      },
    });
  } catch (error) {
    console.error('Error fetching count details:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تفاصيل الجرد',
      error: error.message,
    });
  }
};

// Create new inventory count
exports.createCount = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { warehouse_id, count_date, notes = null } = req.body;

    // Validation
    if (!warehouse_id || !count_date) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم المستودع وتاريخ الجرد',
      });
    }

    // Insert count
    const [result] = await connection.query(
      `INSERT INTO inventory_counts
       (warehouse_id, count_date, created_by, notes)
       VALUES (?, ?, ?, ?)`,
      [warehouse_id, count_date, req.user.id, notes]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الجرد بنجاح',
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating count:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الجرد',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Add item to count
exports.addCountItem = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { count_id } = req.params;
    const { raw_material_id, batch_id = null, counted_quantity, notes = null } = req.body;

    // Validation
    if (!raw_material_id || counted_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم المادة والكمية المجردة',
      });
    }

    // Check count exists and is draft or in_progress
    const [counts] = await connection.query(
      `SELECT * FROM inventory_counts WHERE id = ?`,
      [count_id]
    );

    if (counts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'الجرد غير موجود',
      });
    }

    if (!['draft', 'in_progress'].includes(counts[0].status)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل جرد مكتمل أو ملغي',
      });
    }

    // Get system quantity (current stock)
    let systemQuantity = 0;

    if (batch_id) {
      // Specific batch count
      const [batches] = await connection.query(
        `SELECT remaining_quantity FROM material_batches WHERE id = ?`,
        [batch_id]
      );
      if (batches.length > 0) {
        systemQuantity = batches[0].remaining_quantity;
      }
    } else {
      // Total material count
      const [materials] = await connection.query(
        `SELECT current_stock FROM raw_materials WHERE id = ?`,
        [raw_material_id]
      );
      if (materials.length > 0) {
        systemQuantity = materials[0].current_stock;
      }
    }

    // Check if item already exists in this count
    const [existingItems] = await connection.query(
      `SELECT id FROM inventory_count_items
       WHERE count_id = ? AND raw_material_id = ? AND (batch_id = ? OR (batch_id IS NULL AND ? IS NULL))`,
      [count_id, raw_material_id, batch_id, batch_id]
    );

    if (existingItems.length > 0) {
      // Update existing item
      await connection.query(
        `UPDATE inventory_count_items
         SET counted_quantity = ?, system_quantity = ?, notes = ?
         WHERE id = ?`,
        [counted_quantity, systemQuantity, notes, existingItems[0].id]
      );
    } else {
      // Insert new item
      await connection.query(
        `INSERT INTO inventory_count_items
         (count_id, raw_material_id, batch_id, system_quantity, counted_quantity, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [count_id, raw_material_id, batch_id, systemQuantity, counted_quantity, notes]
      );
    }

    // Update count status to in_progress if still draft
    if (counts[0].status === 'draft') {
      await connection.query(
        `UPDATE inventory_counts SET status = 'in_progress' WHERE id = ?`,
        [count_id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'تم إضافة المادة للجرد بنجاح',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding count item:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المادة للجرد',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Remove item from count
exports.removeCountItem = async (req, res) => {
  try {
    const { item_id } = req.params;

    // Check if count is still editable
    const [items] = await db.query(
      `SELECT ici.*, ic.status
       FROM inventory_count_items ici
       JOIN inventory_counts ic ON ici.count_id = ic.id
       WHERE ici.id = ?`,
      [item_id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المادة غير موجودة',
      });
    }

    if (!['draft', 'in_progress'].includes(items[0].status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف مادة من جرد مكتمل أو ملغي',
      });
    }

    await db.query(`DELETE FROM inventory_count_items WHERE id = ?`, [item_id]);

    res.json({
      success: true,
      message: 'تم حذف المادة من الجرد',
    });
  } catch (error) {
    console.error('Error removing count item:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المادة',
      error: error.message,
    });
  }
};

// Complete inventory count
exports.completeCount = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { auto_adjust = false } = req.body;

    // Get count details
    const [counts] = await connection.query(
      `SELECT * FROM inventory_counts WHERE id = ?`,
      [id]
    );

    if (counts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'الجرد غير موجود',
      });
    }

    if (counts[0].status === 'completed') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'الجرد مكتمل مسبقاً',
      });
    }

    // Update count status
    await connection.query(
      `UPDATE inventory_counts
       SET status = 'completed', completed_by = ?, completed_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    // If auto_adjust is true, create adjustments for variances
    if (auto_adjust) {
      const [items] = await connection.query(
        `SELECT * FROM inventory_count_items WHERE count_id = ? AND variance != 0`,
        [id]
      );

      for (const item of items) {
        const adjustmentType = item.variance > 0 ? 'increase' : 'decrease';
        const quantity = Math.abs(item.variance);

        // Generate adjustment number
        const adjustmentNumber = `ADJ-${Date.now()}-${item.id}`;

        // Create adjustment
        await connection.query(
          `INSERT INTO inventory_adjustments
           (adjustment_number, count_id, warehouse_id, raw_material_id, batch_id,
            adjustment_type, quantity, reason, adjusted_by, approved_by, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'count_variance', ?, ?, ?)`,
          [
            adjustmentNumber,
            id,
            counts[0].warehouse_id,
            item.raw_material_id,
            item.batch_id,
            adjustmentType,
            quantity,
            req.user.id,
            req.user.id,
            `تعديل تلقائي من جرد #${id}`,
          ]
        );

        // Update stock
        if (item.batch_id) {
          // Update batch
          await connection.query(
            `UPDATE material_batches
             SET remaining_quantity = ?
             WHERE id = ?`,
            [item.counted_quantity, item.batch_id]
          );
        }

        // Update material total stock
        const stockChange = adjustmentType === 'increase' ? quantity : -quantity;
        await connection.query(
          `UPDATE raw_materials
           SET current_stock = current_stock + ?
           WHERE id = ?`,
          [stockChange, item.raw_material_id]
        );

        // Log transaction
        await connection.query(
          `INSERT INTO inventory_transactions
           (raw_material_id, warehouse_id, transaction_type, quantity,
            transaction_date, notes, user_id)
           VALUES (?, ?, 'adjustment', ?, NOW(), ?, ?)`,
          [
            item.raw_material_id,
            counts[0].warehouse_id,
            stockChange,
            `تعديل من جرد #${id}: فرق ${item.variance}`,
            req.user.id,
          ]
        );

        // Create alert for significant variances (> 10%)
        if (Math.abs(item.variance_percentage) > 10) {
          await connection.query(
            `INSERT INTO system_alerts
             (alert_type, severity, title, message, reference_type, reference_id)
             VALUES ('variance', 'medium', ?, ?, 'count', ?)`,
            [
              'فرق جرد كبير',
              `تم اكتشاف فرق ${item.variance_percentage.toFixed(2)}% في المادة خلال جرد #${id}`,
              id,
            ]
          );
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: auto_adjust
        ? 'تم إكمال الجرد وتطبيق التعديلات بنجاح'
        : 'تم إكمال الجرد بنجاح',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error completing count:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إكمال الجرد',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Cancel inventory count
exports.cancelCount = async (req, res) => {
  try {
    const { id } = req.params;

    const [counts] = await db.query(
      `SELECT * FROM inventory_counts WHERE id = ?`,
      [id]
    );

    if (counts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الجرد غير موجود',
      });
    }

    if (counts[0].status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء جرد مكتمل',
      });
    }

    await db.query(
      `UPDATE inventory_counts SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'تم إلغاء الجرد بنجاح',
    });
  } catch (error) {
    console.error('Error cancelling count:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إلغاء الجرد',
      error: error.message,
    });
  }
};

// Get count variances
exports.getCountVariances = async (req, res) => {
  try {
    const { warehouse_id, level } = req.query;

    let query = `SELECT * FROM count_variances WHERE 1=1`;
    const params = [];

    if (warehouse_id) {
      query += ` AND warehouse_id = ?`;
      params.push(warehouse_id);
    }

    if (level) {
      query += ` AND variance_level = ?`;
      params.push(level);
    }

    query += ` ORDER BY ABS(variance_percentage) DESC`;

    const [variances] = await db.query(query, params);

    res.json({
      success: true,
      data: variances,
    });
  } catch (error) {
    console.error('Error fetching variances:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفروقات',
      error: error.message,
    });
  }
};

// Get count statistics
exports.getCountStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    let dateFilter = '';
    const params = [];

    if (from) {
      dateFilter += ' AND count_date >= ?';
      params.push(from);
    }

    if (to) {
      dateFilter += ' AND count_date <= ?';
      params.push(to);
    }

    // Count summary
    const [summary] = await db.query(
      `SELECT
         status,
         COUNT(*) AS count
       FROM inventory_counts
       WHERE 1=1 ${dateFilter}
       GROUP BY status`,
      params
    );

    // Variance summary
    const [varianceSummary] = await db.query(
      `SELECT
         variance_level,
         COUNT(*) AS count,
         AVG(ABS(variance_percentage)) AS avg_variance_pct
       FROM count_variances
       WHERE 1=1 ${dateFilter}
       GROUP BY variance_level`,
      params
    );

    // Most problematic materials
    const [problematicMaterials] = await db.query(
      `SELECT
         raw_material_id,
         material_name,
         COUNT(*) AS variance_count,
         AVG(ABS(variance_percentage)) AS avg_variance_pct
       FROM count_variances
       WHERE 1=1 ${dateFilter}
       GROUP BY raw_material_id, material_name
       ORDER BY avg_variance_pct DESC
       LIMIT 10`,
      params
    );

    res.json({
      success: true,
      data: {
        summary,
        variance_summary: varianceSummary,
        problematic_materials: problematicMaterials,
      },
    });
  } catch (error) {
    console.error('Error fetching count stats:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات الجرد',
      error: error.message,
    });
  }
};
