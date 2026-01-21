const db = require('../config/database');

// Get all transfers with filters
exports.getAllTransfers = async (req, res) => {
    try {
        const { from_warehouse, to_warehouse, status, from, to } = req.query;

        let query = `
            SELECT
                st.id,
                st.transfer_number,
                st.transfer_date,
                wf.name AS from_warehouse_name,
                wt.name AS to_warehouse_name,
                st.status,
                u1.full_name AS requested_by_name,
                u2.full_name AS approved_by_name,
                u3.full_name AS completed_by_name,
                st.approved_at,
                st.completed_at,
                COUNT(sti.id) AS items_count,
                st.created_at
            FROM stock_transfers st
            JOIN warehouses wf ON st.from_warehouse_id = wf.id
            JOIN warehouses wt ON st.to_warehouse_id = wt.id
            JOIN users u1 ON st.requested_by = u1.id
            LEFT JOIN users u2 ON st.approved_by = u2.id
            LEFT JOIN users u3 ON st.completed_by = u3.id
            LEFT JOIN stock_transfer_items sti ON st.id = sti.transfer_id
            WHERE 1=1
        `;

        const params = [];

        if (from_warehouse) {
            query += ` AND st.from_warehouse_id = ?`;
            params.push(from_warehouse);
        }

        if (to_warehouse) {
            query += ` AND st.to_warehouse_id = ?`;
            params.push(to_warehouse);
        }

        if (status) {
            query += ` AND st.status = ?`;
            params.push(status);
        }

        if (from && to) {
            query += ` AND st.transfer_date BETWEEN ? AND ?`;
            params.push(from, to);
        }

        query += ` GROUP BY st.id ORDER BY st.transfer_date DESC, st.created_at DESC`;

        const [transfers] = await db.query(query, params);

        res.json({
            success: true,
            data: transfers
        });
    } catch (error) {
        console.error('Get all transfers error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get transfer by ID with items
exports.getTransferById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get transfer details
        const [transfers] = await db.query(`
            SELECT
                st.id,
                st.transfer_number,
                st.transfer_date,
                st.from_warehouse_id,
                wf.name AS from_warehouse_name,
                st.to_warehouse_id,
                wt.name AS to_warehouse_name,
                st.status,
                st.requested_by,
                u1.full_name AS requested_by_name,
                st.approved_by,
                u2.full_name AS approved_by_name,
                st.approved_at,
                st.completed_by,
                u3.full_name AS completed_by_name,
                st.completed_at,
                st.notes,
                st.created_at
            FROM stock_transfers st
            JOIN warehouses wf ON st.from_warehouse_id = wf.id
            JOIN warehouses wt ON st.to_warehouse_id = wt.id
            JOIN users u1 ON st.requested_by = u1.id
            LEFT JOIN users u2 ON st.approved_by = u2.id
            LEFT JOIN users u3 ON st.completed_by = u3.id
            WHERE st.id = ?
        `, [id]);

        if (transfers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'النقلية غير موجودة'
            });
        }

        // Get transfer items
        const [items] = await db.query(`
            SELECT
                sti.id,
                sti.raw_material_id,
                rm.name AS material_name,
                sti.quantity,
                sti.unit,
                rm.current_stock,
                sti.notes
            FROM stock_transfer_items sti
            JOIN raw_materials rm ON sti.raw_material_id = rm.id
            WHERE sti.transfer_id = ?
        `, [id]);

        res.json({
            success: true,
            data: {
                transfer: transfers[0],
                items
            }
        });
    } catch (error) {
        console.error('Get transfer by ID error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get pending transfers
exports.getPendingTransfers = async (req, res) => {
    try {
        const [transfers] = await db.query(`
            SELECT
                st.id,
                st.transfer_number,
                st.transfer_date,
                st.from_warehouse_id,
                wf.name AS from_warehouse_name,
                st.to_warehouse_id,
                wt.name AS to_warehouse_name,
                st.status,
                st.requested_by,
                u.full_name AS requested_by_name,
                st.notes,
                st.created_at
            FROM stock_transfers st
            JOIN warehouses wf ON st.from_warehouse_id = wf.id
            JOIN warehouses wt ON st.to_warehouse_id = wt.id
            JOIN users u ON st.requested_by = u.id
            WHERE st.status = 'pending'
            ORDER BY st.created_at DESC
        `);

        res.json({
            success: true,
            data: transfers
        });
    } catch (error) {
        console.error('Get pending transfers error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Create new transfer
exports.createTransfer = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            from_warehouse_id,
            to_warehouse_id,
            transfer_date,
            items,
            notes
        } = req.body;

        // Validate
        if (!from_warehouse_id || !to_warehouse_id || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'المستودع المصدر والمستودع الهدف والمواد مطلوبة'
            });
        }

        if (from_warehouse_id === to_warehouse_id) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن النقل إلى نفس المستودع'
            });
        }

        // Generate transfer number
        const transferNumber = `TR-${Date.now()}`;

        // Insert transfer
        const [result] = await connection.query(`
            INSERT INTO stock_transfers
            (transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, status, requested_by, notes)
            VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `, [transferNumber, from_warehouse_id, to_warehouse_id, transfer_date || new Date(), req.user.id, notes]);

        const transferId = result.insertId;

        // Insert transfer items
        for (const item of items) {
            // Check if material exists in source warehouse
            const [material] = await connection.query(`
                SELECT current_stock, warehouse_id
                FROM raw_materials
                WHERE id = ? AND warehouse_id = ? AND is_active = 1
            `, [item.raw_material_id, from_warehouse_id]);

            if (material.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `المادة ${item.raw_material_id} غير موجودة في المستودع المصدر`
                });
            }

            // Check if quantity is available
            if (parseFloat(material[0].current_stock) < parseFloat(item.quantity)) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `الكمية المطلوبة غير متوفرة في المستودع المصدر`
                });
            }

            await connection.query(`
                INSERT INTO stock_transfer_items
                (transfer_id, raw_material_id, quantity, unit, notes)
                VALUES (?, ?, ?, ?, ?)
            `, [transferId, item.raw_material_id, item.quantity, item.unit, item.notes]);
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'تم إنشاء النقلية بنجاح',
            data: { id: transferId, transfer_number: transferNumber }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create transfer error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إنشاء النقلية' });
    } finally {
        connection.release();
    }
};

// Approve transfer
exports.approveTransfer = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if transfer exists and is pending
        const [transfer] = await connection.query(`
            SELECT * FROM stock_transfers WHERE id = ? AND status = 'pending'
        `, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'النقلية غير موجودة أو ليست معلقة'
            });
        }

        // Get transfer items
        const [items] = await connection.query(`
            SELECT * FROM stock_transfer_items WHERE transfer_id = ?
        `, [id]);

        // Deduct from source warehouse
        for (const item of items) {
            await connection.query(`
                UPDATE raw_materials
                SET current_stock = current_stock - ?
                WHERE id = ? AND warehouse_id = ?
            `, [item.quantity, item.raw_material_id, transfer[0].from_warehouse_id]);

            // Log transaction
            await connection.query(`
                INSERT INTO inventory_transactions
                (raw_material_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
                VALUES (?, 'transfer', ?, 'transfer_out', ?, ?, ?)
            `, [item.raw_material_id, -item.quantity, id,
                `نقل خارج إلى مستودع آخر - رقم النقلية: ${transfer[0].transfer_number}`, req.user.id]);
        }

        // Update transfer status
        await connection.query(`
            UPDATE stock_transfers
            SET status = 'in_transit',
                approved_by = ?,
                approved_at = NOW()
            WHERE id = ?
        `, [req.user.id, id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تمت الموافقة على النقلية بنجاح'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Approve transfer error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الموافقة على النقلية' });
    } finally {
        connection.release();
    }
};

// Complete transfer (receive at destination)
exports.completeTransfer = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if transfer exists and is in transit
        const [transfer] = await connection.query(`
            SELECT * FROM stock_transfers WHERE id = ? AND status = 'in_transit'
        `, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'النقلية غير موجودة أو ليست في حالة نقل'
            });
        }

        // Get transfer items
        const [items] = await connection.query(`
            SELECT * FROM stock_transfer_items WHERE transfer_id = ?
        `, [id]);

        // Add to destination warehouse
        for (const item of items) {
            // Check if material exists in destination warehouse
            const [existingMaterial] = await connection.query(`
                SELECT id FROM raw_materials
                WHERE id = ? AND warehouse_id = ?
            `, [item.raw_material_id, transfer[0].to_warehouse_id]);

            if (existingMaterial.length > 0) {
                // Material exists, update quantity
                await connection.query(`
                    UPDATE raw_materials
                    SET current_stock = current_stock + ?
                    WHERE id = ? AND warehouse_id = ?
                `, [item.quantity, item.raw_material_id, transfer[0].to_warehouse_id]);
            } else {
                // Material doesn't exist in destination, need to create or update warehouse_id
                // For simplicity, we'll update the warehouse_id
                await connection.query(`
                    UPDATE raw_materials
                    SET warehouse_id = ?,
                        current_stock = current_stock + ?
                    WHERE id = ?
                `, [transfer[0].to_warehouse_id, item.quantity, item.raw_material_id]);
            }

            // Log transaction
            await connection.query(`
                INSERT INTO inventory_transactions
                (raw_material_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
                VALUES (?, 'transfer', ?, 'transfer_in', ?, ?, ?)
            `, [item.raw_material_id, item.quantity, id,
                `نقل وارد من مستودع آخر - رقم النقلية: ${transfer[0].transfer_number}`, req.user.id]);
        }

        // Update transfer status
        await connection.query(`
            UPDATE stock_transfers
            SET status = 'completed',
                completed_by = ?,
                completed_at = NOW()
            WHERE id = ?
        `, [req.user.id, id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تم استلام النقلية بنجاح'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Complete transfer error:', error);
        res.status(500).json({ success: false, message: 'خطأ في استلام النقلية' });
    } finally {
        connection.release();
    }
};

// Cancel transfer
exports.cancelTransfer = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { reason } = req.body;

        // Check if transfer exists and can be cancelled
        const [transfer] = await connection.query(`
            SELECT * FROM stock_transfers
            WHERE id = ? AND status IN ('pending', 'in_transit')
        `, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'النقلية غير موجودة أو لا يمكن إلغاؤها'
            });
        }

        // If approved (in_transit), need to return stock to source warehouse
        if (transfer[0].status === 'in_transit') {
            const [items] = await connection.query(`
                SELECT * FROM stock_transfer_items WHERE transfer_id = ?
            `, [id]);

            for (const item of items) {
                await connection.query(`
                    UPDATE raw_materials
                    SET current_stock = current_stock + ?
                    WHERE id = ? AND warehouse_id = ?
                `, [item.quantity, item.raw_material_id, transfer[0].from_warehouse_id]);

                // Log transaction
                await connection.query(`
                    INSERT INTO inventory_transactions
                    (raw_material_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
                    VALUES (?, 'adjustment', ?, 'transfer_cancelled', ?, ?, ?)
                `, [item.raw_material_id, item.quantity, id,
                    `إلغاء نقلية: ${transfer[0].transfer_number}. ${reason || ''}`, req.user.id]);
            }
        }

        // Update transfer status
        await connection.query(`
            UPDATE stock_transfers
            SET status = 'cancelled',
                notes = CONCAT(COALESCE(notes, ''), '\nسبب الإلغاء: ', ?)
            WHERE id = ?
        `, [reason || 'غير محدد', id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تم إلغاء النقلية بنجاح'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel transfer error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إلغاء النقلية' });
    } finally {
        connection.release();
    }
};

// Delete transfer (only if pending and not approved)
exports.deleteTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if transfer exists and is pending
        const [transfer] = await db.query(`
            SELECT id, status FROM stock_transfers WHERE id = ?
        `, [id]);

        if (transfer.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'النقلية غير موجودة'
            });
        }

        if (transfer[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف نقلية تمت الموافقة عليها أو اكتملت'
            });
        }

        await db.query(`DELETE FROM stock_transfers WHERE id = ?`, [id]);

        res.json({
            success: true,
            message: 'تم حذف النقلية بنجاح'
        });
    } catch (error) {
        console.error('Delete transfer error:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف النقلية' });
    }
};

// Get transfer statistics
exports.getTransferStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT
                COUNT(*) AS total_transfers,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_transfers,
                SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) AS in_transit_transfers,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transfers,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_transfers
            FROM stock_transfers
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get transfer stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};
