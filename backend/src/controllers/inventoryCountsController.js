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
         ici.id,
         ici.count_id,
         ici.raw_material_id,
         ici.system_quantity,
         ici.actual_quantity AS counted_quantity,
         ici.variance,
         ici.notes,
         rm.name AS material_name,
         rm.unit
       FROM inventory_count_items ici
       JOIN raw_materials rm ON ici.raw_material_id = rm.id
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
    const { raw_material_id, counted_quantity, notes = null } = req.body;

    // Validation
    if (!raw_material_id || counted_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم المادة والكمية المجردة',
      });
    }

    // Check count exists and is draft
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

    if (counts[0].status !== 'draft') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعديل جرد مكتمل أو ملغي',
      });
    }

    // Get system quantity (current stock)
    const [materials] = await connection.query(
      `SELECT current_stock FROM raw_materials WHERE id = ?`,
      [raw_material_id]
    );
    const systemQuantity = materials.length > 0 ? materials[0].current_stock : 0;

    // Check if item already exists in this count
    const [existingItems] = await connection.query(
      `SELECT id FROM inventory_count_items
       WHERE count_id = ? AND raw_material_id = ?`,
      [count_id, raw_material_id]
    );

    if (existingItems.length > 0) {
      // Update existing item
      await connection.query(
        `UPDATE inventory_count_items
         SET actual_quantity = ?, system_quantity = ?, notes = ?
         WHERE id = ?`,
        [counted_quantity, systemQuantity, notes, existingItems[0].id]
      );
    } else {
      // Insert new item
      await connection.query(
        `INSERT INTO inventory_count_items
         (count_id, raw_material_id, system_quantity, actual_quantity, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [count_id, raw_material_id, systemQuantity, counted_quantity, notes]
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

    // If auto_adjust is true, adjust stock for variances
    if (auto_adjust) {
      const [items] = await connection.query(
        `SELECT * FROM inventory_count_items WHERE count_id = ? AND variance != 0`,
        [id]
      );

      for (const item of items) {
        // Update material stock to match actual quantity
        await connection.query(
          `UPDATE raw_materials
           SET current_stock = ?
           WHERE id = ?`,
          [item.actual_quantity, item.raw_material_id]
        );

        // Log transaction
        await connection.query(
          `INSERT INTO inventory_transactions
           (raw_material_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
           VALUES (?, 'adjustment', ?, 'count', ?, ?, ?)`,
          [
            item.raw_material_id,
            item.variance,
            id,
            `تعديل من جرد: فرق ${item.variance}`,
            req.user.id,
          ]
        );
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
    const { warehouse_id } = req.query;

    let query = `
      SELECT
        ic.id AS count_id,
        ic.warehouse_id,
        w.name AS warehouse_name,
        ici.raw_material_id,
        rm.name AS material_name,
        ici.system_quantity,
        ici.actual_quantity AS counted_quantity,
        ici.variance,
        CASE
          WHEN ici.system_quantity = 0 THEN 0
          ELSE (ici.variance / ici.system_quantity * 100)
        END AS variance_percentage,
        CASE
          WHEN ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END) > 10 THEN 'high'
          WHEN ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END) > 5 THEN 'medium'
          ELSE 'low'
        END AS variance_level
      FROM inventory_count_items ici
      JOIN inventory_counts ic ON ici.count_id = ic.id
      JOIN raw_materials rm ON ici.raw_material_id = rm.id
      JOIN warehouses w ON ic.warehouse_id = w.id
      WHERE ici.variance != 0 AND ic.status = 'completed'
    `;
    const params = [];

    if (warehouse_id) {
      query += ` AND ic.warehouse_id = ?`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY ABS(ici.variance) DESC`;

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

    // Variance summary from inventory_count_items
    const [varianceSummary] = await db.query(
      `SELECT
         CASE
           WHEN ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END) > 10 THEN 'high'
           WHEN ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END) > 5 THEN 'medium'
           ELSE 'low'
         END AS variance_level,
         COUNT(*) AS count,
         AVG(ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END)) AS avg_variance_pct
       FROM inventory_count_items ici
       JOIN inventory_counts ic ON ici.count_id = ic.id
       WHERE ici.variance != 0 AND ic.status = 'completed' ${dateFilter.replace(/count_date/g, 'ic.count_date')}
       GROUP BY variance_level`,
      params
    );

    // Most problematic materials
    const [problematicMaterials] = await db.query(
      `SELECT
         ici.raw_material_id,
         rm.name AS material_name,
         COUNT(*) AS variance_count,
         AVG(ABS(CASE WHEN ici.system_quantity = 0 THEN 0 ELSE (ici.variance / ici.system_quantity * 100) END)) AS avg_variance_pct
       FROM inventory_count_items ici
       JOIN inventory_counts ic ON ici.count_id = ic.id
       JOIN raw_materials rm ON ici.raw_material_id = rm.id
       WHERE ici.variance != 0 AND ic.status = 'completed' ${dateFilter.replace(/count_date/g, 'ic.count_date')}
       GROUP BY ici.raw_material_id, rm.name
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
