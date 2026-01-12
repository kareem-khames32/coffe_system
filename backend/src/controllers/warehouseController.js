const db = require('../config/database');

// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const [warehouses] = await db.query(
      'SELECT * FROM warehouses ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get active warehouses only
exports.getActiveWarehouses = async (req, res) => {
  try {
    const [warehouses] = await db.query(
      'SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get active warehouses error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get warehouse by ID
exports.getWarehouseById = async (req, res) => {
  try {
    const [warehouses] = await db.query(
      'SELECT * FROM warehouses WHERE id = ?',
      [req.params.id]
    );

    if (warehouses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود'
      });
    }

    res.json({
      success: true,
      data: warehouses[0]
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create warehouse
exports.createWarehouse = async (req, res) => {
  try {
    const { name, location, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستودع مطلوب'
      });
    }

    const [result] = await db.query(
      `INSERT INTO warehouses (name, location, description, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, location || null, description || null, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة المستودع بنجاح',
      data: {
        id: result.insertId,
        name,
        location,
        description,
        is_active: is_active !== undefined ? is_active : true
      }
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const { name, location, description, is_active } = req.body;
    const warehouseId = req.params.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستودع مطلوب'
      });
    }

    // Check if warehouse exists
    const [existing] = await db.query(
      'SELECT id FROM warehouses WHERE id = ?',
      [warehouseId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود'
      });
    }

    await db.query(
      `UPDATE warehouses
       SET name = ?, location = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [name, location || null, description || null, is_active, warehouseId]
    );

    res.json({
      success: true,
      message: 'تم تحديث المستودع بنجاح',
      data: {
        id: warehouseId,
        name,
        location,
        description,
        is_active
      }
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouseId = req.params.id;

    // Check if warehouse has raw materials
    const [materials] = await db.query(
      'SELECT COUNT(*) as count FROM raw_materials WHERE warehouse_id = ?',
      [warehouseId]
    );

    if (materials[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف المستودع لأنه يحتوي على مواد خام. قم بنقل المواد أولاً.'
      });
    }

    const [result] = await db.query(
      'DELETE FROM warehouses WHERE id = ?',
      [warehouseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المستودع غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المستودع بنجاح'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
