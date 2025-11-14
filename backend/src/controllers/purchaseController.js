const db = require('../config/database');

// Get all purchases
exports.getAllPurchases = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT *
            FROM purchases
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND purchase_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY purchase_date DESC';

        const [purchases] = await db.query(query, params);

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
    try {
        const [purchases] = await db.query(
            'SELECT * FROM purchases WHERE id = ?',
            [req.params.id]
        );

        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            data: purchases[0]
        });
    } catch (error) {
        console.error('Get purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create purchase
exports.createPurchase = async (req, res) => {
    try {
        const { supplier_name, item_description, quantity, unit_price, total_amount, purchase_date, notes } = req.body;

        console.log('Create purchase request:', req.body);

        if (!supplier_name || !item_description || !quantity || !unit_price || !total_amount || !purchase_date) {
            console.log('Validation failed:', { supplier_name, item_description, quantity, unit_price, total_amount, purchase_date });
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة: اسم المورد، الصنف، الكمية، سعر الوحدة، المبلغ الإجمالي، والتاريخ'
            });
        }

        const [result] = await db.query(
            `INSERT INTO purchases (supplier_name, item_description, quantity, unit_price, total_amount, purchase_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                supplier_name,
                item_description,
                quantity,
                unit_price,
                total_amount,
                purchase_date,
                notes || null
            ]
        );

        console.log('Purchase created successfully:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'تم إضافة عملية الشراء بنجاح',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create purchase error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        res.status(500).json({
            success: false,
            message: `خطأ في الخادم: ${error.sqlMessage || error.message}`
        });
    }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
    try {
        const { supplier_name, item_description, quantity, unit_price, total_amount, purchase_date, notes } = req.body;

        // Check if purchase exists
        const [purchases] = await db.query('SELECT id FROM purchases WHERE id = ?', [req.params.id]);

        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        let updateQuery = 'UPDATE purchases SET ';
        const updateValues = [];

        if (supplier_name) {
            updateQuery += 'supplier_name = ?, ';
            updateValues.push(supplier_name);
        }

        if (item_description) {
            updateQuery += 'item_description = ?, ';
            updateValues.push(item_description);
        }

        if (quantity !== undefined) {
            updateQuery += 'quantity = ?, ';
            updateValues.push(quantity);
        }

        if (unit_price !== undefined) {
            updateQuery += 'unit_price = ?, ';
            updateValues.push(unit_price);
        }

        if (total_amount !== undefined) {
            updateQuery += 'total_amount = ?, ';
            updateValues.push(total_amount);
        }

        if (purchase_date) {
            updateQuery += 'purchase_date = ?, ';
            updateValues.push(purchase_date);
        }

        if (notes !== undefined) {
            updateQuery += 'notes = ?, ';
            updateValues.push(notes);
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await db.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'Purchase updated successfully'
        });
    } catch (error) {
        console.error('Update purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM purchases WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            message: 'Purchase deleted successfully'
        });
    } catch (error) {
        console.error('Delete purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get total purchases for a period
exports.getTotalPurchases = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND purchase_date <= ?';
            params.push(end_date);
        }

        const [result] = await db.query(query, params);

        res.json({
            success: true,
            data: { total: result[0].total }
        });
    } catch (error) {
        console.error('Get total purchases error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
