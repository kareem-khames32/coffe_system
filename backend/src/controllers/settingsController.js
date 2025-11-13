const db = require('../config/database');

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
