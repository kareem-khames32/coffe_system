const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/logo');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('فقط الصور مسموح بها'));
    }
});

exports.uploadMiddleware = upload.single('logo');

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM settings');

        // Convert array to object for easier access
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });

        res.json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
    try {
        const [settings] = await db.query(
            'SELECT * FROM settings WHERE setting_key = ?',
            [req.params.key]
        );

        if (settings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        res.json({
            success: true,
            data: settings[0]
        });
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update or create setting
exports.updateSetting = async (req, res) => {
    try {
        const { setting_key, setting_value } = req.body;

        if (!setting_key) {
            return res.status(400).json({
                success: false,
                message: 'Setting key is required'
            });
        }

        // Check if setting exists
        const [existing] = await db.query(
            'SELECT id FROM settings WHERE setting_key = ?',
            [setting_key]
        );

        if (existing.length > 0) {
            // Update existing setting
            await db.query(
                'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
                [setting_value, setting_key]
            );
        } else {
            // Create new setting
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
                [setting_key, setting_value]
            );
        }

        res.json({
            success: true,
            message: 'Setting updated successfully'
        });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update multiple settings
exports.updateMultipleSettings = async (req, res) => {
    try {
        const settings = req.body; // Object with key-value pairs

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings format'
            });
        }

        for (const [key, value] of Object.entries(settings)) {
            const [existing] = await db.query(
                'SELECT id FROM settings WHERE setting_key = ?',
                [key]
            );

            if (existing.length > 0) {
                await db.query(
                    'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
                    [value, key]
                );
            } else {
                await db.query(
                    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
                    [key, value]
                );
            }
        }

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update multiple settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM settings WHERE setting_key = ?',
            [req.params.key]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        res.json({
            success: true,
            message: 'Setting deleted successfully'
        });
    } catch (error) {
        console.error('Delete setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Upload logo
exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء اختيار صورة'
            });
        }

        const logoPath = '/uploads/logo/' + req.file.filename;

        // Delete old logo file if exists
        const [oldLogo] = await db.query(
            'SELECT setting_value FROM settings WHERE setting_key = ?',
            ['logo_path']
        );

        if (oldLogo.length > 0 && oldLogo[0].setting_value) {
            const oldLogoPath = path.join(__dirname, '../..', oldLogo[0].setting_value);
            if (fs.existsSync(oldLogoPath)) {
                fs.unlinkSync(oldLogoPath);
            }
        }

        // Update logo path in database
        const [existing] = await db.query(
            'SELECT id FROM settings WHERE setting_key = ?',
            ['logo_path']
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
                [logoPath, 'logo_path']
            );
        } else {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
                ['logo_path', logoPath]
            );
        }

        res.json({
            success: true,
            message: 'تم رفع اللوجو بنجاح',
            data: { logo_path: logoPath }
        });
    } catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في رفع اللوجو'
        });
    }
};

// Delete logo
exports.deleteLogo = async (req, res) => {
    try {
        // Get current logo path
        const [rows] = await db.query(
            'SELECT setting_value FROM settings WHERE setting_key = ?',
            ['logo_path']
        );

        if (rows.length > 0 && rows[0].setting_value) {
            const logoPath = path.join(__dirname, '../..', rows[0].setting_value);
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        }

        // Update database
        await db.query(
            'UPDATE settings SET setting_value = NULL WHERE setting_key = ?',
            ['logo_path']
        );

        res.json({
            success: true,
            message: 'تم حذف اللوجو بنجاح'
        });
    } catch (error) {
        console.error('Delete logo error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف اللوجو'
        });
    }
};
