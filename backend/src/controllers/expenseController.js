const db = require('../config/database');

// Get all expenses
exports.getAllExpenses = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT e.*, u.full_name as user_name
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND e.expense_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND e.expense_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY e.expense_date DESC';

        const [expenses] = await db.query(query, params);

        res.json({
            success: true,
            data: expenses
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const [expenses] = await db.query(
            `SELECT e.*, u.full_name as user_name
             FROM expenses e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE e.id = ?`,
            [req.params.id]
        );

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expenses[0]
        });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create expense
exports.createExpense = async (req, res) => {
    try {
        const { description, amount, category, expense_date, notes } = req.body;

        if (!description || !amount || !expense_date) {
            return res.status(400).json({
                success: false,
                message: 'Description, amount, and expense date are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO expenses (description, amount, category, user_id, expense_date, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                description,
                amount,
                category || null,
                req.user.id,
                expense_date,
                notes || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update expense
exports.updateExpense = async (req, res) => {
    try {
        const { description, amount, category, expense_date, notes } = req.body;

        // Check if expense exists
        const [expenses] = await db.query('SELECT id FROM expenses WHERE id = ?', [req.params.id]);

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        let updateQuery = 'UPDATE expenses SET ';
        const updateValues = [];

        if (description) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (amount !== undefined) {
            updateQuery += 'amount = ?, ';
            updateValues.push(amount);
        }

        if (category !== undefined) {
            updateQuery += 'category = ?, ';
            updateValues.push(category);
        }

        if (expense_date) {
            updateQuery += 'expense_date = ?, ';
            updateValues.push(expense_date);
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
            message: 'Expense updated successfully'
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get total expenses for a period
exports.getTotalExpenses = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND expense_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND expense_date <= ?';
            params.push(end_date);
        }

        const [result] = await db.query(query, params);

        res.json({
            success: true,
            data: { total: result[0].total }
        });
    } catch (error) {
        console.error('Get total expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
