const db = require('../config/database');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const {
      alert_type,
      severity,
      is_read,
      is_resolved,
      warehouse_id,
      limit = 100,
    } = req.query;

    let query = `
      SELECT
        sa.*,
        w.name AS warehouse_name,
        u.full_name AS resolved_by_name
      FROM system_alerts sa
      LEFT JOIN warehouses w ON sa.warehouse_id = w.id
      LEFT JOIN users u ON sa.resolved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (alert_type) {
      query += ` AND sa.alert_type = ?`;
      params.push(alert_type);
    }

    if (severity) {
      query += ` AND sa.severity = ?`;
      params.push(severity);
    }

    if (is_read !== undefined) {
      query += ` AND sa.is_read = ?`;
      params.push(is_read === 'true' || is_read === '1');
    }

    if (is_resolved !== undefined) {
      query += ` AND sa.is_resolved = ?`;
      params.push(is_resolved === 'true' || is_resolved === '1');
    }

    if (warehouse_id) {
      query += ` AND sa.warehouse_id = ?`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY sa.severity DESC, sa.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [alerts] = await db.query(query, params);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التنبيهات',
      error: error.message,
    });
  }
};

// Get unresolved alerts summary
exports.getUnresolvedSummary = async (req, res) => {
  try {
    const [summary] = await db.query(`SELECT * FROM unresolved_alerts_summary`);

    // Get total counts
    const [totals] = await db.query(
      `SELECT
         COUNT(*) AS total_alerts,
         SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
         SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) AS warning_count,
         SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) AS info_count
       FROM system_alerts
       WHERE is_resolved = FALSE`
    );

    res.json({
      success: true,
      data: {
        summary,
        totals: totals[0],
      },
    });
  } catch (error) {
    console.error('Error fetching unresolved summary:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب ملخص التنبيهات',
      error: error.message,
    });
  }
};

// Create custom alert
exports.createAlert = async (req, res) => {
  try {
    const {
      alert_type = 'custom',
      severity = 'info',
      title,
      message,
      reference_type = null,
      reference_id = null,
      warehouse_id = null,
    } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم العنوان والرسالة',
      });
    }

    const [result] = await db.query(
      `INSERT INTO system_alerts
       (alert_type, severity, title, message, reference_type, reference_id, warehouse_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [alert_type, severity, title, message, reference_type, reference_id, warehouse_id]
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التنبيه بنجاح',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التنبيه',
      error: error.message,
    });
  }
};

// Mark alert as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`UPDATE system_alerts SET is_read = TRUE WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'تم تحديد التنبيه كمقروء',
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التنبيه',
      error: error.message,
    });
  }
};

// Mark all alerts as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { alert_type, severity, warehouse_id } = req.body;

    let query = `UPDATE system_alerts SET is_read = TRUE WHERE is_read = FALSE`;
    const params = [];

    if (alert_type) {
      query += ` AND alert_type = ?`;
      params.push(alert_type);
    }

    if (severity) {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (warehouse_id) {
      query += ` AND warehouse_id = ?`;
      params.push(warehouse_id);
    }

    await db.query(query, params);

    res.json({
      success: true,
      message: 'تم تحديد جميع التنبيهات كمقروءة',
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التنبيهات',
      error: error.message,
    });
  }
};

// Resolve alert
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = null } = req.body;

    await db.query(
      `UPDATE system_alerts
       SET is_resolved = TRUE, resolved_by = ?, resolved_at = NOW(), resolved_notes = ?
       WHERE id = ?`,
      [req.user.id, notes, id]
    );

    res.json({
      success: true,
      message: 'تم حل التنبيه بنجاح',
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حل التنبيه',
      error: error.message,
    });
  }
};

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM system_alerts WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'تم حذف التنبيه بنجاح',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التنبيه',
      error: error.message,
    });
  }
};

// Get alert thresholds
exports.getThresholds = async (req, res) => {
  try {
    const { material_id } = req.query;

    let query = `
      SELECT
        at.*,
        rm.name AS material_name,
        rm.current_stock,
        rm.unit,
        w.name AS warehouse_name
      FROM alert_thresholds at
      JOIN raw_materials rm ON at.raw_material_id = rm.id
      LEFT JOIN warehouses w ON at.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      query += ` AND at.raw_material_id = ?`;
      params.push(material_id);
    }

    const [thresholds] = await db.query(query, params);

    res.json({
      success: true,
      data: thresholds,
    });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حدود التنبيه',
      error: error.message,
    });
  }
};

// Set or update threshold
exports.setThreshold = async (req, res) => {
  try {
    const {
      raw_material_id,
      warehouse_id = null,
      low_stock_threshold,
      critical_stock_threshold,
      expiry_warning_days = 30,
      enabled = true,
    } = req.body;

    // Validation
    if (!raw_material_id) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم معرف المادة',
      });
    }

    // Check if threshold exists
    const [existing] = await db.query(
      `SELECT id FROM alert_thresholds WHERE raw_material_id = ?`,
      [raw_material_id]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE alert_thresholds
         SET warehouse_id = ?,
             low_stock_threshold = ?,
             critical_stock_threshold = ?,
             expiry_warning_days = ?,
             enabled = ?
         WHERE raw_material_id = ?`,
        [
          warehouse_id,
          low_stock_threshold,
          critical_stock_threshold,
          expiry_warning_days,
          enabled,
          raw_material_id,
        ]
      );

      res.json({
        success: true,
        message: 'تم تحديث حدود التنبيه بنجاح',
      });
    } else {
      // Insert new
      await db.query(
        `INSERT INTO alert_thresholds
         (raw_material_id, warehouse_id, low_stock_threshold, critical_stock_threshold, expiry_warning_days, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          raw_material_id,
          warehouse_id,
          low_stock_threshold,
          critical_stock_threshold,
          expiry_warning_days,
          enabled,
        ]
      );

      res.status(201).json({
        success: true,
        message: 'تم إنشاء حدود التنبيه بنجاح',
      });
    }
  } catch (error) {
    console.error('Error setting threshold:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تعيين حدود التنبيه',
      error: error.message,
    });
  }
};

// Delete threshold
exports.deleteThreshold = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM alert_thresholds WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'تم حذف حدود التنبيه بنجاح',
    });
  } catch (error) {
    console.error('Error deleting threshold:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف حدود التنبيه',
      error: error.message,
    });
  }
};

// Check and generate automatic alerts
exports.generateAutoAlerts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let alertsCreated = 0;

    // 1. Low stock alerts
    const [lowStock] = await connection.query(`SELECT * FROM low_stock_materials`);

    for (const material of lowStock) {
      // Check if alert already exists
      const [existingAlerts] = await connection.query(
        `SELECT id FROM system_alerts
         WHERE alert_type = 'low_stock'
           AND reference_type = 'material'
           AND reference_id = ?
           AND is_resolved = FALSE
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [material.material_id]
      );

      if (existingAlerts.length === 0) {
        const severity = material.stock_status === 'critical' ? 'critical' : 'warning';
        const title =
          material.stock_status === 'critical' ? 'مخزون حرج' : 'مخزون منخفض';

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id, warehouse_id)
           VALUES ('low_stock', ?, ?, ?, 'material', ?, ?)`,
          [
            severity,
            title,
            `المادة "${material.material_name}" لديها مخزون ${material.stock_status === 'critical' ? 'حرج' : 'منخفض'}: ${material.current_stock} ${material.unit}`,
            material.material_id,
            material.warehouse_id,
          ]
        );

        alertsCreated++;
      }
    }

    // 2. Expiry warnings
    const [expiringBatches] = await connection.query(
      `SELECT * FROM expiring_materials WHERE days_until_expiry <= 30 AND days_until_expiry > 0`
    );

    for (const batch of expiringBatches) {
      const [existingAlerts] = await connection.query(
        `SELECT id FROM system_alerts
         WHERE alert_type = 'expiry_warning'
           AND reference_type = 'batch'
           AND reference_id = ?
           AND is_resolved = FALSE
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [batch.id]
      );

      if (existingAlerts.length === 0) {
        const severity = batch.days_until_expiry <= 7 ? 'critical' : 'warning';

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id, warehouse_id)
           VALUES ('expiry_warning', ?, ?, ?, 'batch', ?, ?)`,
          [
            severity,
            'انتهاء صلاحية قريب',
            `الدفعة "${batch.batch_number}" من مادة "${batch.material_name}" ستنتهي صلاحيتها خلال ${batch.days_until_expiry} يوم`,
            batch.id,
            batch.warehouse_id,
          ]
        );

        alertsCreated++;
      }
    }

    // 3. Overdue payment alerts
    const [overduePayments] = await connection.query(
      `SELECT * FROM unpaid_purchases WHERE days_overdue > 0`
    );

    for (const purchase of overduePayments) {
      const [existingAlerts] = await connection.query(
        `SELECT id FROM system_alerts
         WHERE alert_type = 'overdue_payment'
           AND reference_type = 'purchase'
           AND reference_id = ?
           AND is_resolved = FALSE
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [purchase.id]
      );

      if (existingAlerts.length === 0) {
        const severity = purchase.days_overdue > 7 ? 'critical' : 'warning';

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id)
           VALUES ('overdue_payment', ?, ?, ?, 'purchase', ?)`,
          [
            severity,
            'دفعة متأخرة',
            `فاتورة "${purchase.invoice_number}" من مورد "${purchase.supplier_name}" متأخرة ${purchase.days_overdue} يوم. المبلغ المتبقي: ${parseFloat(purchase.total_amount) - parseFloat(purchase.paid_amount)} جنيه`,
            purchase.id,
          ]
        );

        alertsCreated++;
      }
    }

    // 4. Pending transfer alerts
    const [pendingTransfers] = await connection.query(
      `SELECT
         st.*,
         DATEDIFF(NOW(), st.created_at) AS days_pending
       FROM stock_transfers st
       WHERE st.status = 'pending'
         AND DATEDIFF(NOW(), st.created_at) > 2`
    );

    for (const transfer of pendingTransfers) {
      const [existingAlerts] = await connection.query(
        `SELECT id FROM system_alerts
         WHERE alert_type = 'transfer_pending'
           AND reference_type = 'transfer'
           AND reference_id = ?
           AND is_resolved = FALSE
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [transfer.id]
      );

      if (existingAlerts.length === 0) {
        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id, warehouse_id)
           VALUES ('transfer_pending', 'warning', ?, ?, 'transfer', ?, ?)`,
          [
            'تحويل معلق',
            `التحويل "${transfer.transfer_number}" معلق منذ ${transfer.days_pending} يوم بانتظار الموافقة`,
            transfer.id,
            transfer.from_warehouse_id,
          ]
        );

        alertsCreated++;
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'تم فحص وإنشاء التنبيهات التلقائية',
      data: {
        alerts_created: alertsCreated,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating auto alerts:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التنبيهات التلقائية',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
