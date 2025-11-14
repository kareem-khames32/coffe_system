const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/logo');
    // Create directory if it doesn't exist
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('فقط الصور مسموح بها (JPEG, PNG, GIF, SVG)'));
  }
});

// Get all settings
router.get('/', verifyToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      'SELECT * FROM settings'
    );

    await connection.end();

    // Convert array to object
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Update settings
router.put('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { cafe_name, cafe_phone, cafe_address } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    if (cafe_name !== undefined) {
      await connection.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['cafe_name', cafe_name, cafe_name]
      );
    }

    if (cafe_phone !== undefined) {
      await connection.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['cafe_phone', cafe_phone, cafe_phone]
      );
    }

    if (cafe_address !== undefined) {
      await connection.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['cafe_address', cafe_address, cafe_address]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Upload logo
router.post('/logo', verifyToken, checkRole('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء اختيار صورة'
      });
    }

    const logoPath = '/uploads/logo/' + req.file.filename;
    const connection = await mysql.createConnection(dbConfig);

    // Delete old logo file if exists
    const [oldLogo] = await connection.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      ['logo_path']
    );

    if (oldLogo.length > 0 && oldLogo[0].setting_value) {
      const oldLogoPath = path.join(__dirname, '..', oldLogo[0].setting_value);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Update logo path in database
    await connection.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      ['logo_path', logoPath, logoPath]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'تم رفع اللوجو بنجاح',
      data: { logo_path: logoPath }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في رفع اللوجو'
    });
  }
});

// Delete logo
router.delete('/logo', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get current logo path
    const [rows] = await connection.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      ['logo_path']
    );

    if (rows.length > 0 && rows[0].setting_value) {
      const logoPath = path.join(__dirname, '..', rows[0].setting_value);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    // Update database
    await connection.execute(
      'UPDATE settings SET setting_value = NULL WHERE setting_key = ?',
      ['logo_path']
    );

    await connection.end();

    res.json({
      success: true,
      message: 'تم حذف اللوجو بنجاح'
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف اللوجو'
    });
  }
});

module.exports = router;
