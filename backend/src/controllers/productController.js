const db = require('../config/database');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get available products (stock > 0) - for online orders
exports.getAvailableProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = TRUE AND p.stock > 0
             ORDER BY p.name ASC`
        );

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get available products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: products[0]
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.category_id = ?
             ORDER BY p.name ASC`,
            [req.params.categoryId]
        );

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.stock <= p.low_stock_alert AND p.is_active = TRUE
             ORDER BY p.stock ASC`
        );

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category_id,
            price,
            cost_price,
            stock,
            image,
            low_stock_alert
        } = req.body;

        if (!name || !category_id || price === undefined || cost_price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, price, and cost price are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO products (name, description, category_id, price, cost_price, stock, image, low_stock_alert)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                category_id,
                price,
                cost_price,
                stock || 0,
                image || null,
                low_stock_alert || 10
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category_id,
            price,
            cost_price,
            stock,
            image,
            low_stock_alert,
            is_active
        } = req.body;

        // Check if product exists
        const [products] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build update query
        let updateQuery = 'UPDATE products SET ';
        const updateValues = [];

        if (name) {
            updateQuery += 'name = ?, ';
            updateValues.push(name);
        }

        if (description !== undefined) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (category_id) {
            updateQuery += 'category_id = ?, ';
            updateValues.push(category_id);
        }

        if (price !== undefined) {
            updateQuery += 'price = ?, ';
            updateValues.push(price);
        }

        if (cost_price !== undefined) {
            updateQuery += 'cost_price = ?, ';
            updateValues.push(cost_price);
        }

        if (stock !== undefined) {
            updateQuery += 'stock = ?, ';
            updateValues.push(stock);
        }

        if (image !== undefined) {
            updateQuery += 'image = ?, ';
            updateValues.push(image);
        }

        if (low_stock_alert !== undefined) {
            updateQuery += 'low_stock_alert = ?, ';
            updateValues.push(low_stock_alert);
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
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update stock
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;

        if (stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Stock value is required'
            });
        }

        // Check if product exists
        const [products] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await db.query('UPDATE products SET stock = ? WHERE id = ?', [stock, req.params.id]);

        res.json({
            success: true,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product that has been ordered'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
