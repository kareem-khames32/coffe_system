const db = require('../config/database');

// Generate unique order number (format: YYYYMMDD-0001)
exports.generateOrderNumber = async () => {
    const today = new Date();
    const datePrefix = today.toISOString().split('T')[0].replace(/-/g, '');

    // Get the last order number for today
    const [orders] = await db.query(
        `SELECT order_number FROM orders
         WHERE order_number LIKE ?
         ORDER BY order_number DESC LIMIT 1`,
        [`${datePrefix}-%`]
    );

    let sequence = 1;
    if (orders.length > 0) {
        const lastNumber = orders[0].order_number.split('-')[1];
        sequence = parseInt(lastNumber) + 1;
    }

    return `${datePrefix}-${String(sequence).padStart(4, '0')}`;
};

// Calculate discount amount
exports.calculateDiscount = (subtotal, discountType, discountValue) => {
    if (discountType === 'percentage') {
        return (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
        return Math.min(discountValue, subtotal);
    }
    return 0;
};

// Format date for MySQL
exports.formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
};

// Get date range for reports
exports.getDateRange = (period) => {
    const end = new Date();
    const start = new Date();

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(start.getDate() - 7);
            break;
        case 'month':
            start.setMonth(start.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 1);
            break;
        default:
            start.setDate(start.getDate() - 30);
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
};
