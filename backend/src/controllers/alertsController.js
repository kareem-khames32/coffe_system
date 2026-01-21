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
        u.full_name AS resolved_by_name
      FROM system_alerts sa
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

    if (is_resolved !== undefined) {
      query += ` AND sa.is_resolved = ?`;
      params.push(is_resolved === 'true' || is_resolved === '1');
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
      alert_type = 'low_stock',
      severity = 'low',
      title,
      message,
      reference_type = null,
      reference_id = null,
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
       (alert_type, severity, title, message, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [alert_type, severity, title, message, reference_type, reference_id]
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

// Resolve alert
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE system_alerts
       SET is_resolved = TRUE, resolved_by = ?, resolved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
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
        rm.unit
      FROM alert_thresholds at
      JOIN raw_materials rm ON at.raw_material_id = rm.id
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
         SET low_stock_threshold = ?,
             critical_stock_threshold = ?,
             expiry_warning_days = ?,
             enabled = ?
         WHERE raw_material_id = ?`,
        [
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
         (raw_material_id, low_stock_threshold, critical_stock_threshold, expiry_warning_days, enabled)
         VALUES (?, ?, ?, ?, ?)`,
        [
          raw_material_id,
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

    // 1. Low stock alerts - using min_stock from raw_materials directly
    const [lowStockMaterials] = await connection.query(`
      SELECT
        rm.id AS material_id,
        rm.name AS material_name,
        rm.current_stock,
        rm.min_stock,
        rm.unit,
        w.name AS warehouse_name,
        CASE
          WHEN rm.current_stock = 0 THEN 'out_of_stock'
          WHEN rm.current_stock <= rm.min_stock * 0.5 THEN 'critical'
          WHEN rm.current_stock <= rm.min_stock THEN 'warning'
          ELSE 'normal'
        END AS stock_status
      FROM raw_materials rm
      LEFT JOIN warehouses w ON rm.warehouse_id = w.id
      WHERE rm.is_active = 1
        AND rm.current_stock <= rm.min_stock
    `);

    for (const material of lowStockMaterials) {
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
        let severity, title, message;

        if (material.stock_status === 'out_of_stock') {
          severity = 'critical';
          title = 'نفاد المخزون';
          message = `المادة "${material.material_name}" نفدت تماماً من المخزون!`;
        } else if (material.stock_status === 'critical') {
          severity = 'warning';
          title = 'مخزون حرج';
          message = `المادة "${material.material_name}" وصلت لمستوى حرج: ${material.current_stock} ${material.unit} (الحد الأدنى: ${material.min_stock})`;
        } else {
          severity = 'info';
          title = 'مخزون منخفض';
          message = `المادة "${material.material_name}" قاربت على النفاد: ${material.current_stock} ${material.unit} (الحد الأدنى: ${material.min_stock})`;
        }

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id)
           VALUES ('low_stock', ?, ?, ?, 'material', ?)`,
          [severity, title, message, material.material_id]
        );

        alertsCreated++;
      }
    }

    // 2. Expiry warnings
    const [expiringBatches] = await connection.query(
      `SELECT
         mb.id,
         mb.batch_number,
         rm.name AS material_name,
         DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry
       FROM material_batches mb
       JOIN raw_materials rm ON mb.raw_material_id = rm.id
       WHERE mb.expiry_date IS NOT NULL
         AND DATEDIFF(mb.expiry_date, CURDATE()) <= 30
         AND DATEDIFF(mb.expiry_date, CURDATE()) > 0
         AND mb.status = 'active'`
    );

    for (const batch of expiringBatches) {
      const [existingAlerts] = await connection.query(
        `SELECT id FROM system_alerts
         WHERE alert_type = 'expiring_batch'
           AND reference_type = 'batch'
           AND reference_id = ?
           AND is_resolved = FALSE
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [batch.id]
      );

      if (existingAlerts.length === 0) {
        const severity = batch.days_until_expiry <= 7 ? 'critical' : 'medium';

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id)
           VALUES ('expiring_batch', ?, ?, ?, 'batch', ?)`,
          [
            severity,
            'انتهاء صلاحية قريب',
            `الدفعة "${batch.batch_number}" من مادة "${batch.material_name}" ستنتهي صلاحيتها خلال ${batch.days_until_expiry} يوم`,
            batch.id,
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
        const severity = purchase.days_overdue > 7 ? 'critical' : 'medium';

        await connection.query(
          `INSERT INTO system_alerts
           (alert_type, severity, title, message, reference_type, reference_id)
           VALUES ('overdue_payment', ?, ?, ?, 'purchase', ?)`,
          [
            severity,
            'دفعة متأخرة',
            `فاتورة "${purchase.invoice_number}" من مورد "${purchase.supplier_name}" متأخرة ${purchase.days_overdue} يوم. المبلغ المتبقي: ${purchase.remaining_amount} جنيه`,
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
           (alert_type, severity, title, message, reference_type, reference_id)
           VALUES ('low_stock', 'medium', ?, ?, 'transfer', ?)`,
          [
            'تحويل معلق',
            `التحويل "${transfer.transfer_number}" معلق منذ ${transfer.days_pending} يوم بانتظار الموافقة`,
            transfer.id,
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
