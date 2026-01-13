const db = require('../config/database');

// Get all batches with filters
exports.getAllBatches = async (req, res) => {
    try {
        const { material_id, warehouse_id, status } = req.query;

        let query = `
            SELECT
                mb.id,
                mb.batch_number,
                rm.name AS material_name,
                mb.quantity,
                mb.unit,
                mb.production_date,
                mb.expiry_date,
                DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry,
                mb.unit_cost,
                (mb.quantity * mb.unit_cost) AS total_value,
                mb.status,
                w.name AS warehouse_name,
                ip.invoice_number,
                mb.created_at
            FROM material_batches mb
            JOIN raw_materials rm ON mb.raw_material_id = rm.id
            LEFT JOIN warehouses w ON mb.warehouse_id = w.id
            LEFT JOIN inventory_purchases ip ON mb.purchase_id = ip.id
            WHERE 1=1
        `;

        const params = [];

        if (material_id) {
            query += ` AND mb.raw_material_id = ?`;
            params.push(material_id);
        }

        if (warehouse_id) {
            query += ` AND mb.warehouse_id = ?`;
            params.push(warehouse_id);
        }

        if (status) {
            query += ` AND mb.status = ?`;
            params.push(status);
        } else {
            // Default: only active batches
            query += ` AND mb.status = 'active'`;
        }

        query += ` ORDER BY mb.expiry_date ASC, mb.created_at DESC`;

        const [batches] = await db.query(query, params);

        res.json({
            success: true,
            data: batches
        });
    } catch (error) {
        console.error('Get all batches error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get batches for a specific material
exports.getMaterialBatches = async (req, res) => {
    try {
        const { material_id } = req.params;

        const [batches] = await db.query(`
            SELECT
                mb.id,
                mb.batch_number,
                mb.quantity,
                mb.unit,
                mb.production_date,
                mb.expiry_date,
                DATEDIFF(mb.expiry_date, CURDATE()) AS days_until_expiry,
                mb.unit_cost,
                (mb.quantity * mb.unit_cost) AS total_value,
                mb.status,
                w.name AS warehouse_name,
                ip.invoice_number,
                mb.notes,
                mb.created_at
            FROM material_batches mb
            LEFT JOIN warehouses w ON mb.warehouse_id = w.id
            LEFT JOIN inventory_purchases ip ON mb.purchase_id = ip.id
            WHERE mb.raw_material_id = ?
            ORDER BY mb.expiry_date ASC, mb.created_at DESC
        `, [material_id]);

        res.json({
            success: true,
            data: batches
        });
    } catch (error) {
        console.error('Get material batches error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get expiring batches (within specified days)
exports.getExpiringBatches = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const [batches] = await db.query(`
            SELECT * FROM expiring_materials
            WHERE days_until_expiry <= ?
            ORDER BY days_until_expiry ASC
        `, [days]);

        res.json({
            success: true,
            data: batches
        });
    } catch (error) {
        console.error('Get expiring batches error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get expired batches
exports.getExpiredBatches = async (req, res) => {
    try {
        const [batches] = await db.query(`
            SELECT
                mb.id,
                mb.batch_number,
                rm.name AS material_name,
                mb.quantity,
                mb.unit,
                mb.expiry_date,
                DATEDIFF(CURDATE(), mb.expiry_date) AS days_expired,
                mb.unit_cost,
                (mb.quantity * mb.unit_cost) AS total_value,
                mb.status,
                w.name AS warehouse_name,
                mb.disposed_date,
                u.full_name AS disposed_by_name,
                mb.disposal_reason
            FROM material_batches mb
            JOIN raw_materials rm ON mb.raw_material_id = rm.id
            LEFT JOIN warehouses w ON mb.warehouse_id = w.id
            LEFT JOIN users u ON mb.disposed_by = u.id
            WHERE mb.expiry_date < CURDATE()
            ORDER BY mb.expiry_date DESC
        `);

        res.json({
            success: true,
            data: batches
        });
    } catch (error) {
        console.error('Get expired batches error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Add new batch
exports.addBatch = async (req, res) => {
    try {
        const {
            raw_material_id,
            batch_number,
            quantity,
            unit,
            production_date,
            expiry_date,
            purchase_id,
            warehouse_id,
            unit_cost,
            notes
        } = req.body;

        // Validate
        if (!raw_material_id || !batch_number || !quantity || !unit) {
            return res.status(400).json({
                success: false,
                message: 'المادة الخام، رقم الدفعة، الكمية، والوحدة مطلوبة'
            });
        }

        // Check if batch number already exists for this material
        const [existing] = await db.query(`
            SELECT id FROM material_batches
            WHERE raw_material_id = ? AND batch_number = ?
        `, [raw_material_id, batch_number]);

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'رقم الدفعة موجود بالفعل لهذه المادة'
            });
        }

        const [result] = await db.query(`
            INSERT INTO material_batches
            (raw_material_id, batch_number, quantity, unit, production_date, expiry_date,
             purchase_id, warehouse_id, unit_cost, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [raw_material_id, batch_number, quantity, unit, production_date, expiry_date,
            purchase_id || null, warehouse_id || null, unit_cost || 0, notes, req.user.id]);

        res.json({
            success: true,
            message: 'تم إضافة الدفعة بنجاح',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Add batch error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الدفعة' });
    }
};

// Update batch
exports.updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            batch_number,
            quantity,
            production_date,
            expiry_date,
            warehouse_id,
            unit_cost,
            notes
        } = req.body;

        // Check if batch exists
        const [batch] = await db.query(`SELECT id FROM material_batches WHERE id = ?`, [id]);

        if (batch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الدفعة غير موجودة'
            });
        }

        await db.query(`
            UPDATE material_batches
            SET batch_number = COALESCE(?, batch_number),
                quantity = COALESCE(?, quantity),
                production_date = COALESCE(?, production_date),
                expiry_date = COALESCE(?, expiry_date),
                warehouse_id = COALESCE(?, warehouse_id),
                unit_cost = COALESCE(?, unit_cost),
                notes = COALESCE(?, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [batch_number, quantity, production_date, expiry_date, warehouse_id, unit_cost, notes, id]);

        res.json({
            success: true,
            message: 'تم تحديث الدفعة بنجاح'
        });
    } catch (error) {
        console.error('Update batch error:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الدفعة' });
    }
};

// Dispose expired batch
exports.disposeBatch = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { disposal_reason } = req.body;

        // Check if batch exists and is not already disposed
        const [batch] = await connection.query(`
            SELECT * FROM material_batches WHERE id = ? AND status = 'active'
        `, [id]);

        if (batch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الدفعة غير موجودة أو تم التخلص منها بالفعل'
            });
        }

        // Update batch status
        await connection.query(`
            UPDATE material_batches
            SET status = 'disposed',
                disposed_date = CURDATE(),
                disposed_by = ?,
                disposal_reason = ?
            WHERE id = ?
        `, [req.user.id, disposal_reason, id]);

        // Deduct quantity from raw material stock
        await connection.query(`
            UPDATE raw_materials
            SET current_stock = current_stock - ?
            WHERE id = ?
        `, [batch[0].quantity, batch[0].raw_material_id]);

        // Log transaction
        await connection.query(`
            INSERT INTO inventory_transactions
            (raw_material_id, transaction_type, quantity, unit, transaction_date, notes, created_by)
            VALUES (?, 'disposal', ?, ?, CURDATE(), ?, ?)
        `, [batch[0].raw_material_id, -batch[0].quantity, batch[0].unit,
            `تخلص من دفعة منتهية: ${batch[0].batch_number}. ${disposal_reason || ''}`, req.user.id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تم التخلص من الدفعة بنجاح'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Dispose batch error:', error);
        res.status(500).json({ success: false, message: 'خطأ في التخلص من الدفعة' });
    } finally {
        connection.release();
    }
};

// Delete batch (only if not used)
exports.deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if batch exists
        const [batch] = await db.query(`SELECT id, status FROM material_batches WHERE id = ?`, [id]);

        if (batch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الدفعة غير موجودة'
            });
        }

        // Can only delete if status is active (not disposed)
        if (batch[0].status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف دفعة تم التخلص منها'
            });
        }

        await db.query(`DELETE FROM material_batches WHERE id = ?`, [id]);

        res.json({
            success: true,
            message: 'تم حذف الدفعة بنجاح'
        });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الدفعة' });
    }
};

// Get batch statistics
exports.getBatchStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT
                COUNT(*) AS total_batches,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_batches,
                SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired_batches,
                SUM(CASE WHEN status = 'disposed' THEN 1 ELSE 0 END) AS disposed_batches,
                SUM(CASE WHEN status = 'active' THEN quantity * unit_cost ELSE 0 END) AS total_value,
                SUM(CASE WHEN status = 'active' AND expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_soon
            FROM material_batches
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get batch stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};
