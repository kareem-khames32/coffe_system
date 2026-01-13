const db = require('../config/database');

// Get all payments with filters
exports.getAllPayments = async (req, res) => {
    try {
        const { supplier_id, from, to } = req.query;

        let query = `
            SELECT
                sp.id,
                sp.amount,
                sp.payment_date,
                sp.payment_method,
                sp.reference_number,
                sp.notes,
                s.name AS supplier_name,
                s.phone AS supplier_phone,
                ip.invoice_number,
                ip.total_amount AS invoice_amount,
                u.full_name AS created_by_name,
                sp.created_at
            FROM supplier_payments sp
            JOIN suppliers s ON sp.supplier_id = s.id
            LEFT JOIN inventory_purchases ip ON sp.purchase_id = ip.id
            LEFT JOIN users u ON sp.created_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (supplier_id) {
            query += ` AND sp.supplier_id = ?`;
            params.push(supplier_id);
        }

        if (from && to) {
            query += ` AND sp.payment_date BETWEEN ? AND ?`;
            params.push(from, to);
        }

        query += ` ORDER BY sp.payment_date DESC, sp.created_at DESC`;

        const [payments] = await db.query(query, params);

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get payments for a specific supplier
exports.getSupplierPayments = async (req, res) => {
    try {
        const { supplier_id } = req.params;

        const [payments] = await db.query(`
            SELECT
                sp.id,
                sp.amount,
                sp.payment_date,
                sp.payment_method,
                sp.reference_number,
                sp.notes,
                ip.invoice_number,
                ip.total_amount AS invoice_amount,
                u.full_name AS created_by_name,
                sp.created_at
            FROM supplier_payments sp
            LEFT JOIN inventory_purchases ip ON sp.purchase_id = ip.id
            LEFT JOIN users u ON sp.created_by = u.id
            WHERE sp.supplier_id = ?
            ORDER BY sp.payment_date DESC
        `, [supplier_id]);

        // Get supplier total debt
        const [debt] = await db.query(`
            SELECT
                COALESCE(SUM(ip.total_amount), 0) AS total_purchases,
                COALESCE(SUM(ip.paid_amount), 0) AS total_paid,
                COALESCE(SUM(ip.total_amount - ip.paid_amount), 0) AS remaining_debt
            FROM inventory_purchases ip
            WHERE ip.supplier_id = ?
            AND ip.payment_status IN ('unpaid', 'partial')
        `, [supplier_id]);

        res.json({
            success: true,
            data: {
                payments,
                debt: debt[0]
            }
        });
    } catch (error) {
        console.error('Get supplier payments error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get payments for a specific purchase
exports.getPurchasePayments = async (req, res) => {
    try {
        const { purchase_id } = req.params;

        const [payments] = await db.query(`
            SELECT
                sp.id,
                sp.amount,
                sp.payment_date,
                sp.payment_method,
                sp.reference_number,
                sp.notes,
                u.full_name AS created_by_name,
                sp.created_at
            FROM supplier_payments sp
            LEFT JOIN users u ON sp.created_by = u.id
            WHERE sp.purchase_id = ?
            ORDER BY sp.payment_date DESC
        `, [purchase_id]);

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Get purchase payments error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Get unpaid/partial purchases
exports.getUnpaidPurchases = async (req, res) => {
    try {
        const [purchases] = await db.query(`
            SELECT * FROM unpaid_purchases
        `);

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('Get unpaid purchases error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// Add new payment
exports.addPayment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            supplier_id,
            purchase_id,
            amount,
            payment_date,
            payment_method,
            reference_number,
            notes
        } = req.body;

        // Validate
        if (!supplier_id || !amount || !payment_date) {
            return res.status(400).json({
                success: false,
                message: 'المورد والمبلغ وتاريخ الدفع مطلوبة'
            });
        }

        // Insert payment
        const [result] = await connection.query(`
            INSERT INTO supplier_payments
            (supplier_id, purchase_id, amount, payment_date, payment_method, reference_number, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [supplier_id, purchase_id || null, amount, payment_date, payment_method || 'cash', reference_number, notes, req.user.id]);

        // If payment is for a specific purchase, update purchase payment status
        if (purchase_id) {
            // Get current purchase info
            const [purchase] = await connection.query(`
                SELECT total_amount, paid_amount FROM inventory_purchases WHERE id = ?
            `, [purchase_id]);

            if (purchase.length > 0) {
                const newPaidAmount = parseFloat(purchase[0].paid_amount) + parseFloat(amount);
                const totalAmount = parseFloat(purchase[0].total_amount);

                let paymentStatus = 'partial';
                if (newPaidAmount >= totalAmount) {
                    paymentStatus = 'paid';
                } else if (newPaidAmount === 0) {
                    paymentStatus = 'unpaid';
                }

                await connection.query(`
                    UPDATE inventory_purchases
                    SET paid_amount = ?,
                        payment_status = ?
                    WHERE id = ?
                `, [newPaidAmount, paymentStatus, purchase_id]);
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'تم إضافة الدفعة بنجاح',
            data: { id: result.insertId }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Add payment error:', error);
        res.status(500).json({ success: false, message: 'خطأ في إضافة الدفعة' });
    } finally {
        connection.release();
    }
};

// Delete payment
exports.deletePayment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Get payment info before deleting
        const [payment] = await connection.query(`
            SELECT purchase_id, amount FROM supplier_payments WHERE id = ?
        `, [id]);

        if (payment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الدفعة غير موجودة'
            });
        }

        const purchaseId = payment[0].purchase_id;
        const amount = parseFloat(payment[0].amount);

        // Delete payment
        await connection.query(`DELETE FROM supplier_payments WHERE id = ?`, [id]);

        // Update purchase payment status if applicable
        if (purchaseId) {
            const [purchase] = await connection.query(`
                SELECT total_amount, paid_amount FROM inventory_purchases WHERE id = ?
            `, [purchaseId]);

            if (purchase.length > 0) {
                const newPaidAmount = parseFloat(purchase[0].paid_amount) - amount;
                const totalAmount = parseFloat(purchase[0].total_amount);

                let paymentStatus = 'partial';
                if (newPaidAmount >= totalAmount) {
                    paymentStatus = 'paid';
                } else if (newPaidAmount === 0) {
                    paymentStatus = 'unpaid';
                }

                await connection.query(`
                    UPDATE inventory_purchases
                    SET paid_amount = ?,
                        payment_status = ?
                    WHERE id = ?
                `, [newPaidAmount, paymentStatus, purchaseId]);
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'تم حذف الدفعة بنجاح'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Delete payment error:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الدفعة' });
    } finally {
        connection.release();
    }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
    try {
        const { from, to } = req.query;

        let query = `
            SELECT
                COUNT(*) AS total_payments,
                COALESCE(SUM(amount), 0) AS total_amount,
                payment_method,
                COUNT(*) AS method_count
            FROM supplier_payments
            WHERE 1=1
        `;

        const params = [];

        if (from && to) {
            query += ` AND payment_date BETWEEN ? AND ?`;
            params.push(from, to);
        }

        query += ` GROUP BY payment_method`;

        const [stats] = await db.query(query, params);

        // Get overall stats
        let overallQuery = `
            SELECT
                COUNT(*) AS total_payments,
                COALESCE(SUM(amount), 0) AS total_amount
            FROM supplier_payments
            WHERE 1=1
        `;

        if (from && to) {
            overallQuery += ` AND payment_date BETWEEN ? AND ?`;
        }

        const [overall] = await db.query(overallQuery, from && to ? [from, to] : []);

        // Get unpaid debt
        const [debt] = await db.query(`
            SELECT
                COALESCE(SUM(total_amount - paid_amount), 0) AS total_debt,
                COUNT(*) AS unpaid_purchases_count
            FROM inventory_purchases
            WHERE payment_status IN ('unpaid', 'partial')
        `);

        res.json({
            success: true,
            data: {
                overall: overall[0],
                by_method: stats,
                debt: debt[0]
            }
        });
    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};
