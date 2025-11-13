const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, username, full_name, role, can_make_sales, can_view_inventory,
             can_edit_inventory, can_view_order_details, can_cancel_orders, can_edit_orders,
             can_view_reports, can_add_expenses, can_manage_offers, is_active, created_at
             FROM users ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, username, full_name, role, can_make_sales, can_view_inventory,
             can_edit_inventory, can_view_order_details, can_cancel_orders, can_edit_orders,
             can_view_reports, can_add_expenses, can_manage_offers, is_active, created_at
             FROM users WHERE id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create user
exports.createUser = async (req, res) => {
    try {
        const {
            username,
            password,
            full_name,
            role,
            can_make_sales,
            can_view_inventory,
            can_edit_inventory,
            can_view_order_details,
            can_cancel_orders,
            can_edit_orders,
            can_view_reports,
            can_add_expenses,
            can_manage_offers
        } = req.body;

        // Validate required fields
        if (!username || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and full name are required'
            });
        }

        // Check if username exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            `INSERT INTO users (username, password, full_name, role, can_make_sales,
             can_view_inventory, can_edit_inventory, can_view_order_details, can_cancel_orders,
             can_edit_orders, can_view_reports, can_add_expenses, can_manage_offers)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                username,
                hashedPassword,
                full_name,
                role || 'cashier',
                can_make_sales !== undefined ? can_make_sales : true,
                can_view_inventory !== undefined ? can_view_inventory : true,
                can_edit_inventory || false,
                can_view_order_details !== undefined ? can_view_order_details : true,
                can_cancel_orders || false,
                can_edit_orders || false,
                can_view_reports || false,
                can_add_expenses || false,
                can_manage_offers || false
            ]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const {
            username,
            password,
            full_name,
            role,
            can_make_sales,
            can_view_inventory,
            can_edit_inventory,
            can_view_order_details,
            can_cancel_orders,
            can_edit_orders,
            can_view_reports,
            can_add_expenses,
            can_manage_offers,
            is_active
        } = req.body;

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build update query
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];

        if (username) {
            // Check if username is taken by another user
            const [existing] = await db.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, req.params.id]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            updateQuery += 'username = ?, ';
            updateValues.push(username);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += 'password = ?, ';
            updateValues.push(hashedPassword);
        }

        if (full_name) {
            updateQuery += 'full_name = ?, ';
            updateValues.push(full_name);
        }

        if (role) {
            updateQuery += 'role = ?, ';
            updateValues.push(role);
        }

        if (can_make_sales !== undefined) {
            updateQuery += 'can_make_sales = ?, ';
            updateValues.push(can_make_sales);
        }

        if (can_view_inventory !== undefined) {
            updateQuery += 'can_view_inventory = ?, ';
            updateValues.push(can_view_inventory);
        }

        if (can_edit_inventory !== undefined) {
            updateQuery += 'can_edit_inventory = ?, ';
            updateValues.push(can_edit_inventory);
        }

        if (can_view_order_details !== undefined) {
            updateQuery += 'can_view_order_details = ?, ';
            updateValues.push(can_view_order_details);
        }

        if (can_cancel_orders !== undefined) {
            updateQuery += 'can_cancel_orders = ?, ';
            updateValues.push(can_cancel_orders);
        }

        if (can_edit_orders !== undefined) {
            updateQuery += 'can_edit_orders = ?, ';
            updateValues.push(can_edit_orders);
        }

        if (can_view_reports !== undefined) {
            updateQuery += 'can_view_reports = ?, ';
            updateValues.push(can_view_reports);
        }

        if (can_add_expenses !== undefined) {
            updateQuery += 'can_add_expenses = ?, ';
            updateValues.push(can_add_expenses);
        }

        if (can_manage_offers !== undefined) {
            updateQuery += 'can_manage_offers = ?, ';
            updateValues.push(can_manage_offers);
        }

        if (is_active !== undefined) {
            updateQuery += 'is_active = ?, ';
            updateValues.push(is_active);
        }

        // Remove last comma and add WHERE
        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await db.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
