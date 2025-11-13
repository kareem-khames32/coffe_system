const db = require('../config/database');

// Get all purchases
exports.getAllPurchases = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT p.*, u.full_name as user_name
            FROM purchases p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND p.purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND p.purchase_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY p.purchase_date DESC';

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
            `SELECT p.*, u.full_name as user_name
             FROM purchases p
             LEFT JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
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
        const { description, amount, supplier, purchase_date, notes } = req.body;

        if (!description || !amount || !purchase_date) {
            return res.status(400).json({
                success: false,
                message: 'Description, amount, and purchase date are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO purchases (description, amount, supplier, user_id, purchase_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                description,
                amount,
                supplier || null,
                req.user.id,
                purchase_date,
                notes || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Purchase created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
    try {
        const { description, amount, supplier, purchase_date, notes } = req.body;

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

        if (description) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (amount !== undefined) {
            updateQuery += 'amount = ?, ';
            updateValues.push(amount);
        }

        if (supplier !== undefined) {
            updateQuery += 'supplier = ?, ';
            updateValues.push(supplier);
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

        let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM purchases WHERE 1=1';
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
