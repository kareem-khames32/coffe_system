const db = require('../config/database');

// Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Today's sales
        const [todaySales] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total
             FROM orders
             WHERE DATE(created_at) = ? AND order_status IN ('completed', 'ready', 'served')`,
            [today]
        );

        // Today's orders count
        const [todayOrders] = await db.query(
            `SELECT COUNT(*) as count
             FROM orders
             WHERE DATE(created_at) = ?`,
            [today]
        );

        // Pending orders count
        const [pendingOrders] = await db.query(
            `SELECT COUNT(*) as count
             FROM orders
             WHERE order_status = 'pending'`
        );

        // Today's profit (calculate from order items: revenue - cost)
        const [todayProfit] = await db.query(
            `SELECT COALESCE(SUM(oi.subtotal - (p.cost_price * oi.quantity)), 0) as profit
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE DATE(o.created_at) = ? AND o.order_status IN ('completed', 'ready', 'served')`,
            [today]
        );

        // Low stock raw materials count (products don't have stock tracking)
        const [lowStock] = await db.query(
            `SELECT COUNT(*) as count
             FROM raw_materials
             WHERE current_stock <= min_stock`
        );

        // Top selling products (last 30 days)
        const [topProducts] = await db.query(
            `SELECT p.name as product_name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             AND o.order_status IN ('completed', 'ready', 'served')
             GROUP BY oi.product_id, p.name
             ORDER BY total_sold DESC
             LIMIT 5`
        );

        // Sales chart data (last 7 days)
        const [salesChart] = await db.query(
            `SELECT DATE(created_at) as date, SUM(total_amount) as sales, COUNT(*) as orders
             FROM orders
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             AND order_status IN ('completed', 'ready', 'served')
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`
        );

        // Online vs In-Store comparison (last 30 days)
        const [orderTypes] = await db.query(
            `SELECT order_type, COUNT(*) as count, SUM(total_amount) as total
             FROM orders
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             AND order_status IN ('completed', 'ready', 'served')
             GROUP BY order_type`
        );

        res.json({
            success: true,
            data: {
                todaySales: parseFloat(todaySales[0].total) || 0,
                todayOrders: todayOrders[0].count || 0,
                pendingOrders: pendingOrders[0].count || 0,
                todayProfit: parseFloat(todayProfit[0].profit) || 0,
                lowStockProducts: lowStock[0].count || 0,
                topProducts,
                salesChart,
                orderTypes
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Sales Report
exports.getSalesReport = async (req, res) => {
    try {
        const { start_date, end_date, order_type, status } = req.query;

        let query = `
            SELECT o.*, u.full_name as cashier_name
            FROM orders o
            LEFT JOIN users u ON o.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }

        if (order_type && order_type !== 'all') {
            query += ' AND o.order_type = ?';
            params.push(order_type);
        }

        if (status && status !== 'all') {
            query += ' AND o.order_status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';

        const [orders] = await db.query(query, params);

        // Calculate totals from order_items (since profit is not in orders table)
        const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        // Get total profit from order_items
        let totalProfit = 0;
        for (const order of orders) {
            const [items] = await db.query(
                'SELECT SUM(profit) as order_profit FROM order_items WHERE order_id = ?',
                [order.id]
            );
            totalProfit += parseFloat(items[0].order_profit || 0);
        }

        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        res.json({
            success: true,
            data: {
                orders,
                summary: {
                    totalSales,
                    totalProfit,
                    totalOrders,
                    averageOrderValue
                }
            }
        });
    } catch (error) {
        console.error('Get sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Products Report
exports.getProductsReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT
                oi.product_id,
                oi.product_name,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue,
                SUM(oi.cost_price * oi.quantity) as total_cost,
                SUM(oi.profit) as total_profit
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status IN ('completed', 'ready')
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY oi.product_id, oi.product_name ORDER BY total_sold DESC';

        const [products] = await db.query(query, params);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Profit Report
exports.getProfitReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Build date conditions for orders
        let orderDateCondition = 'status IN (\'completed\', \'ready\')';
        const orderParams = [];

        if (start_date) {
            orderDateCondition += ' AND DATE(created_at) >= ?';
            orderParams.push(start_date);
        }
        if (end_date) {
            orderDateCondition += ' AND DATE(created_at) <= ?';
            orderParams.push(end_date);
        }

        // Build date conditions for expenses
        let expenseDateCondition = '1=1';
        const expenseParams = [];

        if (start_date) {
            expenseDateCondition += ' AND DATE(expense_date) >= ?';
            expenseParams.push(start_date);
        }
        if (end_date) {
            expenseDateCondition += ' AND DATE(expense_date) <= ?';
            expenseParams.push(end_date);
        }

        // Build date conditions for purchases
        let purchaseDateCondition = '1=1';
        const purchaseParams = [];

        if (start_date) {
            purchaseDateCondition += ' AND DATE(purchase_date) >= ?';
            purchaseParams.push(start_date);
        }
        if (end_date) {
            purchaseDateCondition += ' AND DATE(purchase_date) <= ?';
            purchaseParams.push(end_date);
        }

        // Total revenue from orders
        const [revenue] = await db.query(
            `SELECT COALESCE(SUM(total), 0) as total
             FROM orders
             WHERE ${orderDateCondition}`,
            orderParams
        );

        // Total cost from orders
        const [cost] = await db.query(
            `SELECT COALESCE(SUM(cost), 0) as total
             FROM orders
             WHERE ${orderDateCondition}`,
            orderParams
        );

        // Gross profit
        const grossProfit = revenue[0].total - cost[0].total;

        // Total expenses
        const [expenses] = await db.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM expenses
             WHERE ${expenseDateCondition}`,
            expenseParams
        );

        // Total purchases
        const [purchases] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total
             FROM purchases
             WHERE ${purchaseDateCondition}`,
            purchaseParams
        );

        // Net profit
        const netProfit = grossProfit - expenses[0].total - purchases[0].total;

        console.log('Profit report data:', {
            revenue: revenue[0].total,
            cost: cost[0].total,
            grossProfit,
            expenses: expenses[0].total,
            purchases: purchases[0].total,
            netProfit
        });

        res.json({
            success: true,
            data: {
                totalRevenue: parseFloat(revenue[0].total) || 0,
                totalCost: parseFloat(cost[0].total) || 0,
                grossProfit: parseFloat(grossProfit) || 0,
                totalExpenses: parseFloat(expenses[0].total) || 0,
                totalPurchases: parseFloat(purchases[0].total) || 0,
                netProfit: parseFloat(netProfit) || 0
            }
        });
    } catch (error) {
        console.error('Get profit report error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            message: `خطأ في تحميل التقرير: ${error.sqlMessage || error.message}`
        });
    }
};

// Category Sales Report
exports.getCategorySalesReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT
                c.id,
                c.name as category_name,
                COUNT(DISTINCT oi.id) as items_sold,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.status IN ('completed', 'ready')
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY c.id, c.name ORDER BY total_revenue DESC';

        const [categories] = await db.query(query, params);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get category sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Customer Report (top customers by orders)
exports.getCustomerReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT
                customer_name,
                customer_phone,
                COUNT(*) as total_orders,
                SUM(total) as total_spent
            FROM orders
            WHERE customer_name IS NOT NULL
            AND status IN ('completed', 'ready')
        `;
        const params = [];

        if (start_date) {
            query += ' AND DATE(created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(created_at) <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY customer_name, customer_phone ORDER BY total_spent DESC LIMIT 50';

        const [customers] = await db.query(query, params);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Get customer report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Purchases and Expenses Combined Report
exports.getPurchasesAndExpensesReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Build parameters for purchases
        let purchasesQuery = 'SELECT * FROM purchases WHERE 1=1';
        const purchasesParams = [];

        if (start_date) {
            purchasesQuery += ' AND DATE(purchase_date) >= ?';
            purchasesParams.push(start_date);
        }
        if (end_date) {
            purchasesQuery += ' AND DATE(purchase_date) <= ?';
            purchasesParams.push(end_date);
        }
        purchasesQuery += ' ORDER BY purchase_date DESC';

        // Build parameters for expenses
        let expensesQuery = 'SELECT * FROM expenses WHERE 1=1';
        const expensesParams = [];

        if (start_date) {
            expensesQuery += ' AND DATE(expense_date) >= ?';
            expensesParams.push(start_date);
        }
        if (end_date) {
            expensesQuery += ' AND DATE(expense_date) <= ?';
            expensesParams.push(end_date);
        }
        expensesQuery += ' ORDER BY expense_date DESC';

        // Fetch both
        const [purchases] = await db.query(purchasesQuery, purchasesParams);
        const [expenses] = await db.query(expensesQuery, expensesParams);

        // Calculate totals
        const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const grandTotal = totalPurchases + totalExpenses;

        console.log('Purchases and Expenses Report:', {
            purchasesCount: purchases.length,
            expensesCount: expenses.length,
            totalPurchases,
            totalExpenses,
            grandTotal
        });

        res.json({
            success: true,
            data: {
                purchases,
                expenses,
                summary: {
                    totalPurchases,
                    totalExpenses,
                    grandTotal
                }
            }
        });
    } catch (error) {
        console.error('Get purchases and expenses report error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sql: error.sql
        });
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل التقرير'
        });
    }
};
