const db = require('../config/database');

// Get all daily discounts
exports.getAllDailyDiscounts = async (req, res) => {
    try {
        const [discounts] = await db.query(
            `SELECT * FROM daily_discounts ORDER BY target_date DESC`
        );

        res.json({
            success: true,
            data: discounts
        });
    } catch (error) {
        console.error('Get all daily discounts error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الخصومات اليومية'
        });
    }
};

// Get active daily discounts
exports.getActiveDailyDiscounts = async (req, res) => {
    try {
        const [discounts] = await db.query(
            `SELECT * FROM daily_discounts
             WHERE is_active = 1
             ORDER BY target_date DESC`
        );

        res.json({
            success: true,
            data: discounts
        });
    } catch (error) {
        console.error('Get active daily discounts error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الخصومات النشطة'
        });
    }
};

// Get daily discount by ID
exports.getDailyDiscountById = async (req, res) => {
    try {
        const [discounts] = await db.query(
            `SELECT * FROM daily_discounts WHERE id = ?`,
            [req.params.id]
        );

        if (discounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخصم غير موجود'
            });
        }

        res.json({
            success: true,
            data: discounts[0]
        });
    } catch (error) {
        console.error('Get daily discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الخصم'
        });
    }
};

// Get discount for specific date
exports.getDiscountForDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد التاريخ'
            });
        }

        const [discounts] = await db.query(
            `SELECT * FROM daily_discounts
             WHERE target_date = ? AND is_active = 1
             ORDER BY discount_value DESC
             LIMIT 1`,
            [date]
        );

        res.json({
            success: true,
            data: discounts.length > 0 ? discounts[0] : null
        });
    } catch (error) {
        console.error('Get discount for date error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل خصم التاريخ'
        });
    }
};

// Create daily discount
exports.createDailyDiscount = async (req, res) => {
    try {
        const { name, description, discount_type, discount_value, target_date, is_active } = req.body;

        if (!name || !discount_value || !target_date) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة: الاسم، قيمة الخصم، والتاريخ'
            });
        }

        // Validate discount value
        if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
            return res.status(400).json({
                success: false,
                message: 'قيمة الخصم يجب أن تكون بين 0 و 100 للخصم بالنسبة المئوية'
            });
        }

        if (discount_value <= 0) {
            return res.status(400).json({
                success: false,
                message: 'قيمة الخصم يجب أن تكون أكبر من 0'
            });
        }

        // Convert ISO string date to DATE format (YYYY-MM-DD)
        const targetDateOnly = new Date(target_date).toISOString().split('T')[0];

        const [result] = await db.query(
            `INSERT INTO daily_discounts (name, description, discount_type, discount_value, target_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                discount_type || 'percentage',
                discount_value,
                targetDateOnly,
                is_active !== undefined ? is_active : true
            ]
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة الخصم بنجاح',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create daily discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة الخصم'
        });
    }
};

// Update daily discount
exports.updateDailyDiscount = async (req, res) => {
    try {
        const { name, description, discount_type, discount_value, target_date, is_active } = req.body;

        // Check if discount exists
        const [existing] = await db.query(
            'SELECT id FROM daily_discounts WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخصم غير موجود'
            });
        }

        // Validate discount value if provided
        if (discount_value !== undefined) {
            if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'قيمة الخصم يجب أن تكون بين 0 و 100 للخصم بالنسبة المئوية'
                });
            }

            if (discount_value <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'قيمة الخصم يجب أن تكون أكبر من 0'
                });
            }
        }

        let updateQuery = 'UPDATE daily_discounts SET ';
        const updateValues = [];

        if (name !== undefined) {
            updateQuery += 'name = ?, ';
            updateValues.push(name);
        }

        if (description !== undefined) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (discount_type !== undefined) {
            updateQuery += 'discount_type = ?, ';
            updateValues.push(discount_type);
        }

        if (discount_value !== undefined) {
            updateQuery += 'discount_value = ?, ';
            updateValues.push(discount_value);
        }

        if (target_date !== undefined) {
            updateQuery += 'target_date = ?, ';
            // Convert ISO string date to DATE format (YYYY-MM-DD)
            const targetDateOnly = new Date(target_date).toISOString().split('T')[0];
            updateValues.push(targetDateOnly);
        }

        if (is_active !== undefined) {
            updateQuery += 'is_active = ?, ';
            updateValues.push(is_active);
        }

        if (updateValues.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await db.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'تم تحديث الخصم بنجاح'
        });
    } catch (error) {
        console.error('Update daily discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الخصم'
        });
    }
};

// Delete daily discount
exports.deleteDailyDiscount = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM daily_discounts WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'الخصم غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف الخصم بنجاح'
        });
    } catch (error) {
        console.error('Delete daily discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الخصم'
        });
    }
};
