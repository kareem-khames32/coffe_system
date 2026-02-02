const db = require('../config/database');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: categories[0]
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create category
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, is_active } = req.body;

        // Check if category exists
        const [categories] = await db.query(
            'SELECT id FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Build update query
        let updateQuery = 'UPDATE categories SET ';
        const updateValues = [];

        if (name) {
            updateQuery += 'name = ?, ';
            updateValues.push(name);
        }

        if (description !== undefined) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (is_active !== undefined) {
            updateQuery += 'is_active = ?, ';
            updateValues.push(is_active);
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await db.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        // Check if category has products
        const [products] = await db.query(
            'SELECT id FROM products WHERE category_id = ?',
            [req.params.id]
        );

        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing products'
            });
        }

        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
