const db = require('../config/database');

// ==================== DASHBOARD STATS ====================

// Dashboard Stats - إحصائيات لوحة التحكم
exports.getDashboardStats = async (req, res) => {
    try {
        // إجمالي قيمة المخزون وعدد المواد
        const [stats] = await db.query(`
            SELECT
                COALESCE(SUM(current_stock * unit_cost), 0) AS total_inventory_value,
                COUNT(*) AS total_materials,
                SUM(CASE WHEN current_stock <= min_stock AND current_stock > 0 THEN 1 ELSE 0 END) AS low_stock_count,
                SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
            FROM raw_materials
            WHERE is_active = 1
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// ==================== WAREHOUSES REPORTS ====================

// جميع المستودعات مع القيمة
exports.getWarehousesReport = async (req, res) => {
    try {
        const [warehouses] = await db.query(`
            SELECT
                w.id,
                w.name AS warehouse_name,
                w.location,
                COUNT(rm.id) AS materials_count,
                COALESCE(SUM(rm.current_stock * rm.unit_cost), 0) AS total_value
            FROM warehouses w
            LEFT JOIN raw_materials rm ON w.id = rm.warehouse_id AND rm.is_active = 1
            WHERE w.is_active = 1
            GROUP BY w.id
            ORDER BY total_value DESC
        `);

        res.json({
            success: true,
            data: warehouses
        });
    } catch (error) {
        console.error('Get warehouses report error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// تفاصيل مستودع معين
exports.getWarehouseDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name AS material_name,
                rm.current_stock,
                rm.unit,
                rm.unit_cost,
                rm.min_stock,
                (rm.current_stock * rm.unit_cost) AS total_value,
                s.name AS supplier_name,
                CASE
                    WHEN rm.current_stock = 0 THEN 'out_of_stock'
                    WHEN rm.current_stock <= rm.min_stock THEN 'low_stock'
                    ELSE 'in_stock'
                END AS stock_status
            FROM raw_materials rm
            LEFT JOIN suppliers s ON rm.supplier_id = s.id
            WHERE rm.warehouse_id = ? AND rm.is_active = 1
            ORDER BY total_value DESC
        `, [id]);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get warehouse details error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// حركة مستودع معين
exports.getWarehouseTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const [transactions] = await db.query(`
            SELECT
                it.id,
                it.created_at AS transaction_date,
                it.transaction_type,
                it.quantity,
                it.reference_type,
                it.reference_id,
                it.notes,
                rm.name AS material_name,
                rm.unit,
                u.full_name AS user_name
            FROM inventory_transactions it
            JOIN raw_materials rm ON it.raw_material_id = rm.id
            LEFT JOIN users u ON it.created_by = u.id
            WHERE rm.warehouse_id = ?
            ORDER BY it.created_at DESC
            LIMIT ?
        `, [id, limit]);

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get warehouse transactions error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// ==================== RAW MATERIALS REPORTS ====================

// ملخص المواد الخام
exports.getMaterialsSummary = async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT
                COUNT(*) AS total_materials,
                SUM(current_stock * unit_cost) AS total_value,
                SUM(CASE WHEN current_stock <= min_stock AND current_stock > 0 THEN 1 ELSE 0 END) AS low_stock_count,
                SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
                AVG(current_stock * unit_cost) AS avg_material_value
            FROM raw_materials
            WHERE is_active = 1
        `);

        res.json({
            success: true,
            data: summary[0]
        });
    } catch (error) {
        console.error('Get materials summary error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// المواد حسب القيمة (Top Materials)
exports.getMaterialsByValue = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.current_stock,
                rm.unit,
                rm.unit_cost,
                (rm.current_stock * rm.unit_cost) AS total_value,
                w.name AS warehouse_name,
                s.name AS supplier_name
            FROM raw_materials rm
            LEFT JOIN warehouses w ON rm.warehouse_id = w.id
            LEFT JOIN suppliers s ON rm.supplier_id = s.id
            WHERE rm.is_active = 1
            ORDER BY total_value DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get materials by value error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// المواد القليلة (Low Stock)
exports.getLowStockMaterials = async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.current_stock,
                rm.min_stock,
                rm.unit,
                rm.unit_cost,
                (rm.min_stock - rm.current_stock) AS shortage,
                ((rm.min_stock - rm.current_stock) * rm.unit_cost) AS shortage_value,
                w.name AS warehouse_name,
                s.name AS supplier_name,
                s.phone AS supplier_phone
            FROM raw_materials rm
            LEFT JOIN warehouses w ON rm.warehouse_id = w.id
            LEFT JOIN suppliers s ON rm.supplier_id = s.id
            WHERE rm.is_active = 1 AND rm.current_stock <= rm.min_stock AND rm.current_stock > 0
            ORDER BY shortage DESC
        `);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get low stock materials error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// المواد النافدة (Out of Stock)
exports.getOutOfStockMaterials = async (req, res) => {
    try {
        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.unit,
                rm.unit_cost,
                rm.min_stock,
                w.name AS warehouse_name,
                s.name AS supplier_name,
                s.phone AS supplier_phone
            FROM raw_materials rm
            LEFT JOIN warehouses w ON rm.warehouse_id = w.id
            LEFT JOIN suppliers s ON rm.supplier_id = s.id
            WHERE rm.is_active = 1 AND rm.current_stock = 0
            ORDER BY rm.name ASC
        `);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get out of stock materials error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// حركة مادة معينة
exports.getMaterialTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const [transactions] = await db.query(`
            SELECT
                it.id,
                it.created_at,
                it.transaction_type,
                it.quantity,
                rm.unit_cost,
                (it.quantity * COALESCE(rm.unit_cost, 0)) AS total_value,
                it.reference_type,
                it.reference_id,
                it.notes,
                u.full_name AS created_by_name
            FROM inventory_transactions it
            JOIN raw_materials rm ON it.raw_material_id = rm.id
            LEFT JOIN users u ON it.created_by = u.id
            WHERE it.raw_material_id = ?
            ORDER BY it.created_at DESC
            LIMIT ?
        `, [id, limit]);

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get material transactions error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// استهلاك المواد
exports.getMaterialsConsumption = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        const [consumption] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.unit,
                ABS(COALESCE(SUM(CASE WHEN it.transaction_type = 'sale' THEN it.quantity ELSE 0 END), 0)) AS total_consumed,
                ABS(COALESCE(SUM(CASE WHEN it.transaction_type = 'sale' THEN it.quantity * rm.unit_cost ELSE 0 END), 0)) AS consumption_value,
                COUNT(CASE WHEN it.transaction_type = 'sale' THEN 1 END) AS times_used
            FROM raw_materials rm
            LEFT JOIN inventory_transactions it ON rm.id = it.raw_material_id
                AND it.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            WHERE rm.is_active = 1
            GROUP BY rm.id
            HAVING total_consumed > 0
            ORDER BY total_consumed DESC
        `, [days]);

        res.json({
            success: true,
            data: consumption
        });
    } catch (error) {
        console.error('Get materials consumption error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// المواد الراكدة (No Movement)
exports.getNoMovementMaterials = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.current_stock,
                rm.unit,
                rm.unit_cost,
                (rm.current_stock * rm.unit_cost) AS total_value,
                MAX(it.created_at) AS last_movement,
                DATEDIFF(NOW(), MAX(it.created_at)) AS days_since_movement
            FROM raw_materials rm
            LEFT JOIN inventory_transactions it ON rm.id = it.raw_material_id
            WHERE rm.is_active = 1
            GROUP BY rm.id
            HAVING last_movement IS NULL OR days_since_movement > ?
            ORDER BY days_since_movement DESC
        `, [days]);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get no movement materials error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// ==================== SUPPLIERS REPORTS ====================

// ملخص الموردين
exports.getSuppliersSummary = async (req, res) => {
    try {
        const [suppliers] = await db.query(`
            SELECT
                s.id,
                s.name,
                s.contact_person,
                s.phone,
                COUNT(DISTINCT ip.id) AS invoices_count,
                COALESCE(SUM(ip.total_amount), 0) AS total_purchases,
                COUNT(DISTINCT rm.id) AS materials_supplied,
                MAX(ip.purchase_date) AS last_purchase_date
            FROM suppliers s
            LEFT JOIN inventory_purchases ip ON s.id = ip.supplier_id
            LEFT JOIN raw_materials rm ON s.id = rm.supplier_id AND rm.is_active = 1
            WHERE s.is_active = 1
            GROUP BY s.id
            ORDER BY total_purchases DESC
        `);

        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error('Get suppliers summary error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// تفاصيل مورد معين
exports.getSupplierDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // معلومات المورد
        const [supplier] = await db.query(`
            SELECT
                s.*,
                COUNT(DISTINCT ip.id) AS total_invoices,
                COALESCE(SUM(ip.total_amount), 0) AS total_purchases,
                COUNT(DISTINCT rm.id) AS materials_count
            FROM suppliers s
            LEFT JOIN inventory_purchases ip ON s.id = ip.supplier_id
            LEFT JOIN raw_materials rm ON s.id = rm.supplier_id AND rm.is_active = 1
            WHERE s.id = ?
            GROUP BY s.id
        `, [id]);

        if (supplier.length === 0) {
            return res.status(404).json({ success: false, message: 'المورد غير موجود' });
        }

        res.json({
            success: true,
            data: supplier[0]
        });
    } catch (error) {
        console.error('Get supplier details error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// مشتريات مورد معين
exports.getSupplierPurchases = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const [purchases] = await db.query(`
            SELECT
                ip.id,
                ip.invoice_number,
                ip.purchase_date,
                ip.total_amount,
                ip.notes,
                COUNT(ipi.id) AS items_count,
                u.full_name AS created_by_name
            FROM inventory_purchases ip
            LEFT JOIN inventory_purchase_items ipi ON ip.id = ipi.purchase_id
            LEFT JOIN users u ON ip.created_by = u.id
            WHERE ip.supplier_id = ?
            GROUP BY ip.id
            ORDER BY ip.purchase_date DESC
            LIMIT ?
        `, [id, limit]);

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('Get supplier purchases error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// المواد التي يوردها مورد معين
exports.getSupplierMaterials = async (req, res) => {
    try {
        const { id } = req.params;

        const [materials] = await db.query(`
            SELECT
                rm.id AS material_id,
                rm.name AS material_name,
                rm.unit,
                rm.unit_cost,
                rm.current_stock,
                (rm.current_stock * rm.unit_cost) AS stock_value,
                w.name AS warehouse_name
            FROM raw_materials rm
            LEFT JOIN warehouses w ON rm.warehouse_id = w.id
            WHERE rm.supplier_id = ? AND rm.is_active = 1
            ORDER BY rm.name ASC
        `, [id]);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get supplier materials error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// ==================== PURCHASES REPORTS ====================

// مشتريات فترة معينة
exports.getPurchasesReport = async (req, res) => {
    try {
        const { from, to, supplier_id } = req.query;

        let query = `
            SELECT
                ip.id,
                ip.invoice_number,
                ip.purchase_date,
                s.name AS supplier_name,
                ip.total_amount,
                COUNT(ipi.id) AS items_count,
                u.full_name AS created_by_name
            FROM inventory_purchases ip
            JOIN suppliers s ON ip.supplier_id = s.id
            LEFT JOIN inventory_purchase_items ipi ON ip.id = ipi.purchase_id
            LEFT JOIN users u ON ip.created_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (from && to) {
            query += ` AND ip.purchase_date BETWEEN ? AND ?`;
            params.push(from, to);
        }

        if (supplier_id) {
            query += ` AND ip.supplier_id = ?`;
            params.push(supplier_id);
        }

        query += ` GROUP BY ip.id ORDER BY ip.purchase_date DESC`;

        const [purchases] = await db.query(query, params);

        // حساب الإجمالي
        const total = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);

        res.json({
            success: true,
            data: {
                purchases,
                total,
                count: purchases.length
            }
        });
    } catch (error) {
        console.error('Get purchases report error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// إجمالي المشتريات يومي
exports.getDailyPurchases = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        const [daily] = await db.query(`
            SELECT
                DATE(purchase_date) AS date,
                COUNT(*) AS invoices_count,
                SUM(total_amount) AS total_amount
            FROM inventory_purchases
            WHERE purchase_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(purchase_date)
            ORDER BY date DESC
        `, [days]);

        res.json({
            success: true,
            data: daily
        });
    } catch (error) {
        console.error('Get daily purchases error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// إجمالي المشتريات شهري
exports.getMonthlyPurchases = async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;

        const [monthly] = await db.query(`
            SELECT
                DATE_FORMAT(purchase_date, '%Y-%m') AS month,
                COUNT(*) AS invoices_count,
                SUM(total_amount) AS total_amount
            FROM inventory_purchases
            WHERE purchase_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
            ORDER BY month DESC
        `, [months]);

        res.json({
            success: true,
            data: monthly
        });
    } catch (error) {
        console.error('Get monthly purchases error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// أكثر المواد شراءً
exports.getTopPurchasedMaterials = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const limit = parseInt(req.query.limit) || 20;

        const [materials] = await db.query(`
            SELECT
                rm.id,
                rm.name,
                rm.unit,
                SUM(ipi.quantity) AS total_quantity,
                SUM(ipi.total_price) AS total_value,
                COUNT(DISTINCT ipi.purchase_id) AS purchase_times,
                AVG(ipi.unit_price) AS avg_price
            FROM inventory_purchase_items ipi
            JOIN raw_materials rm ON ipi.raw_material_id = rm.id
            JOIN inventory_purchases ip ON ipi.purchase_id = ip.id
            WHERE ip.purchase_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY rm.id
            ORDER BY total_value DESC
            LIMIT ?
        `, [days, limit]);

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        console.error('Get top purchased materials error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

// تاريخ سعر مادة معينة
exports.getMaterialPriceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const [history] = await db.query(`
            SELECT
                ip.purchase_date,
                s.name AS supplier_name,
                ipi.quantity,
                ipi.unit_price,
                ipi.total_price
            FROM inventory_purchase_items ipi
            JOIN inventory_purchases ip ON ipi.purchase_id = ip.id
            JOIN suppliers s ON ip.supplier_id = s.id
            WHERE ipi.raw_material_id = ?
            ORDER BY ip.purchase_date DESC
            LIMIT ?
        `, [id, limit]);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get material price history error:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
};

module.exports = exports;
