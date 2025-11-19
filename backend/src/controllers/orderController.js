const db = require('../config/database');
const { generateOrderNumber, calculateDiscount } = require('../utils/helpers');

// Create In-Store Order
exports.createInStoreOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            items, // [{product_id, quantity, price, cost_price}]
            customer_name,
            customer_phone,
            customer_address,
            discount_type,
            discount_value,
            offer_id
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must have at least one item'
            });
        }

        // Calculate totals
        let subtotal = 0;
        let totalCost = 0;

        for (const item of items) {
            // Check stock availability
            const [products] = await connection.query(
                'SELECT stock FROM products WHERE id = ?',
                [item.product_id]
            );

            if (products.length === 0 || products[0].stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product ID ${item.product_id}`
                });
            }

            subtotal += item.price * item.quantity;
            totalCost += item.cost_price * item.quantity;
        }

        // Calculate discount
        const discountAmount = calculateDiscount(
            subtotal,
            discount_type || 'none',
            discount_value || 0
        );

        const total = subtotal - discountAmount;
        const profit = total - totalCost;

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_number, order_type, status, customer_name, customer_phone,
             customer_address, subtotal, discount_type, discount_value, discount_amount, total,
             cost, profit, offer_id, cashier_id)
             VALUES (?, 'in-store', 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                customer_name || null,
                customer_phone || null,
                customer_address || null,
                subtotal,
                discount_type || 'none',
                discount_value || 0,
                discountAmount,
                total,
                totalCost,
                profit,
                offer_id || null,
                req.user.id
            ]
        );

        const orderId = orderResult.insertId;

        // Add order items and update stock
        for (const item of items) {
            // Get product name
            const [products] = await connection.query(
                'SELECT name FROM products WHERE id = ?',
                [item.product_id]
            );

            const itemSubtotal = item.price * item.quantity;
            const itemProfit = (item.price - item.cost_price) * item.quantity;

            // Insert order item
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price,
                 cost_price, subtotal, profit)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    products[0].name,
                    item.quantity,
                    item.price,
                    item.cost_price,
                    itemSubtotal,
                    itemProfit
                ]
            );

            // Update stock
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        // Get complete order data with items for invoice
        const [completeOrder] = await connection.query(
            `SELECT o.*, u.full_name as cashier_name
             FROM orders o
             LEFT JOIN users u ON o.cashier_id = u.id
             WHERE o.id = ?`,
            [orderId]
        );

        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                ...completeOrder[0],
                items: orderItems
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create in-store order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        connection.release();
    }
};

// Create Online Order (no authentication required)
exports.createOnlineOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            items,
            customer_name,
            customer_phone,
            customer_address,
            discount_type,
            discount_value,
            offer_id
        } = req.body;

        // Validate required fields for online orders
        if (!customer_name || !customer_phone || !customer_address) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, phone, and address are required for online orders'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must have at least one item'
            });
        }

        // Calculate totals
        let subtotal = 0;
        let totalCost = 0;
        let discountAmount = 0;

        for (const item of items) {
            // Check stock availability
            const [products] = await connection.query(
                'SELECT stock, price, cost_price FROM products WHERE id = ? AND is_active = TRUE',
                [item.product_id]
            );

            if (products.length === 0 || products[0].stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Product not available or insufficient stock`
                });
            }

            subtotal += products[0].price * item.quantity;
            totalCost += products[0].cost_price * item.quantity;
        }

        // Apply discount (from daily discount or manual discount)
        let finalDiscountType = discount_type || 'none';
        let finalDiscountValue = discount_value || 0;

        // If no discount provided, check for offer
        if ((!discount_type || discount_type === 'none') && offer_id) {
            const [offers] = await connection.query(
                `SELECT * FROM offers WHERE id = ? AND is_active = TRUE
                 AND start_date <= CURDATE() AND end_date >= CURDATE()`,
                [offer_id]
            );

            if (offers.length > 0) {
                const offer = offers[0];
                finalDiscountType = offer.offer_type === 'buy_x_get_y' ? 'percentage' : offer.offer_type;
                finalDiscountValue = offer.discount_value;
            }
        }

        // Calculate discount amount
        discountAmount = calculateDiscount(subtotal, finalDiscountType, finalDiscountValue);

        const total = subtotal - discountAmount;
        const profit = total - totalCost;

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Create order (status = pending for online orders)
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_number, order_type, status, customer_name, customer_phone,
             customer_address, subtotal, discount_type, discount_value, discount_amount, total,
             cost, profit, offer_id, cashier_id)
             VALUES (?, 'online', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
            [
                orderNumber,
                customer_name,
                customer_phone,
                customer_address,
                subtotal,
                finalDiscountType,
                finalDiscountValue,
                discountAmount,
                total,
                totalCost,
                profit,
                offer_id || null
            ]
        );

        const orderId = orderResult.insertId;

        // Add order items and update stock
        for (const item of items) {
            const [products] = await connection.query(
                'SELECT name, price, cost_price FROM products WHERE id = ?',
                [item.product_id]
            );

            const itemSubtotal = products[0].price * item.quantity;
            const itemProfit = (products[0].price - products[0].cost_price) * item.quantity;

            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price,
                 cost_price, subtotal, profit)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    products[0].name,
                    item.quantity,
                    products[0].price,
                    products[0].cost_price,
                    itemSubtotal,
                    itemProfit
                ]
            );

            // Update stock
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully. You will receive a confirmation soon.',
            data: {
                order_id: orderId,
                order_number: orderNumber,
                total: total,
                status: 'pending'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create online order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        connection.release();
    }
};

// Get all orders with filters
exports.getAllOrders = async (req, res) => {
    try {
        const {
            order_type, // 'in-store', 'online', or 'all'
            status, // 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', or 'all'
            start_date,
            end_date
        } = req.query;

        let query = `
            SELECT o.*, u.full_name as cashier_name
            FROM orders o
            LEFT JOIN users u ON o.cashier_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (order_type && order_type !== 'all') {
            query += ' AND o.order_type = ?';
            params.push(order_type);
        }

        if (status && status !== 'all') {
            query += ' AND o.status = ?';
            params.push(status);
        }

        if (start_date) {
            query += ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY o.created_at DESC';

        const [orders] = await db.query(query, params);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get pending orders count
exports.getPendingOrdersCount = async (req, res) => {
    try {
        const [result] = await db.query(
            `SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`
        );

        res.json({
            success: true,
            data: { count: result[0].count }
        });
    } catch (error) {
        console.error('Get pending orders count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get order by ID with items
exports.getOrderById = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.full_name as cashier_name
             FROM orders o
             LEFT JOIN users u ON o.cashier_id = u.id
             WHERE o.id = ?`,
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get order items
        const [items] = await db.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Track order by order number (no authentication required)
exports.trackOrder = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.id, o.order_number, o.order_type, o.status, o.customer_name,
             o.customer_phone, o.customer_address, o.total, o.created_at, o.updated_at
             FROM orders o
             WHERE o.order_number = ?`,
            [req.params.orderNumber]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get order items
        const [items] = await db.query(
            'SELECT product_name, quantity, price, subtotal FROM order_items WHERE order_id = ?',
            [orders[0].id]
        );

        res.json({
            success: true,
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Check if order exists
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If cancelling, return stock
        if (status === 'cancelled' && orders[0].status !== 'cancelled') {
            const [items] = await db.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [req.params.id]
            );

            for (const item of items) {
                await db.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

        res.json({
            success: true,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Edit order (with smart inventory recalculation)
exports.editOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            items, // New items list
            customer_name,
            customer_phone,
            customer_address,
            discount_type,
            discount_value
        } = req.body;

        // Check if order exists and is not cancelled
        const [orders] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (orders[0].status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit cancelled order'
            });
        }

        const order = orders[0];

        // Get old items
        const [oldItems] = await connection.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        // Smart inventory recalculation
        // 1. Return all old items to stock
        for (const oldItem of oldItems) {
            await connection.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [oldItem.quantity, oldItem.product_id]
            );
        }

        // 2. Delete old items
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);

        // 3. Calculate new totals
        let subtotal = 0;
        let totalCost = 0;

        for (const item of items) {
            const [products] = await connection.query(
                'SELECT stock, price, cost_price FROM products WHERE id = ?',
                [item.product_id]
            );

            if (products.length === 0 || products[0].stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product ID ${item.product_id}`
                });
            }

            subtotal += products[0].price * item.quantity;
            totalCost += products[0].cost_price * item.quantity;
        }

        // Calculate discount
        const discountAmount = calculateDiscount(
            subtotal,
            discount_type || order.discount_type,
            discount_value || order.discount_value
        );

        const total = subtotal - discountAmount;
        const profit = total - totalCost;

        // 4. Update order
        await connection.query(
            `UPDATE orders SET customer_name = ?, customer_phone = ?, customer_address = ?,
             subtotal = ?, discount_type = ?, discount_value = ?, discount_amount = ?,
             total = ?, cost = ?, profit = ?
             WHERE id = ?`,
            [
                customer_name || order.customer_name,
                customer_phone || order.customer_phone,
                customer_address || order.customer_address,
                subtotal,
                discount_type || order.discount_type,
                discount_value || order.discount_value,
                discountAmount,
                total,
                totalCost,
                profit,
                req.params.id
            ]
        );

        // 5. Add new items and deduct from stock
        for (const item of items) {
            const [products] = await connection.query(
                'SELECT name, price, cost_price FROM products WHERE id = ?',
                [item.product_id]
            );

            const itemSubtotal = products[0].price * item.quantity;
            const itemProfit = (products[0].price - products[0].cost_price) * item.quantity;

            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price,
                 cost_price, subtotal, profit)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    item.product_id,
                    products[0].name,
                    item.quantity,
                    products[0].price,
                    products[0].cost_price,
                    itemSubtotal,
                    itemProfit
                ]
            );

            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // 6. Log the edit
        await connection.query(
            `INSERT INTO order_edit_history (order_id, edited_by, changes)
             VALUES (?, ?, ?)`,
            [req.params.id, req.user.id, 'Order items and details updated']
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: {
                order_id: req.params.id,
                total: total
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Edit order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        connection.release();
    }
};

// Get order edit history
exports.getOrderEditHistory = async (req, res) => {
    try {
        const [history] = await db.query(
            `SELECT h.*, u.full_name as edited_by_name
             FROM order_edit_history h
             LEFT JOIN users u ON h.edited_by = u.id
             WHERE h.order_id = ?
             ORDER BY h.edited_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get order edit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Check if order exists
        const [orders] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (orders[0].status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order already cancelled'
            });
        }

        // Return items to stock
        const [items] = await connection.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        for (const item of items) {
            await connection.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Update order status
        await connection.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['cancelled', req.params.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        connection.release();
    }
};
