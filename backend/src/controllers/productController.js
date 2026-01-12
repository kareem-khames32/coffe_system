const db = require('../config/database');
const { convertUnits } = require('../utils/unitConversion');

// Get all products with raw material availability check
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );

        // Check raw material availability for each product
        for (const product of products) {
            const availability = await checkProductAvailability(product.id);
            product.materials_available = availability.available;
            product.unavailable_materials = availability.unavailable_materials;
        }

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

// Helper function to check if product can be made based on raw materials
async function checkProductAvailability(productId) {
    try {
        // Get product recipe
        const [recipe] = await db.query(
            `SELECT pr.raw_material_id, pr.quantity_needed, pr.unit,
                    rm.name as material_name, rm.current_stock, rm.unit as material_unit
             FROM product_recipes pr
             JOIN raw_materials rm ON pr.raw_material_id = rm.id
             WHERE pr.product_id = ?`,
            [productId]
        );

        // If no recipe, consider available
        if (recipe.length === 0) {
            return { available: true, unavailable_materials: [] };
        }

        const unavailable_materials = [];

        // Check each material
        for (const item of recipe) {
            const recipeUnit = item.unit || item.material_unit;

            // Convert recipe quantity to material's base unit
            const convertedQuantity = convertUnits(
                parseFloat(item.quantity_needed),
                recipeUnit,
                item.material_unit
            );

            const currentStock = parseFloat(item.current_stock);

            // Check if enough stock
            if (convertedQuantity > currentStock) {
                unavailable_materials.push({
                    name: item.material_name,
                    required: convertedQuantity,
                    available: currentStock,
                    unit: item.material_unit
                });
            }
        }

        return {
            available: unavailable_materials.length === 0,
            unavailable_materials
        };
    } catch (error) {
        console.error('Check product availability error:', error);
        return { available: false, unavailable_materials: [] };
    }
}

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
