const db = require('../config/database');

// Get all raw materials
exports.getAllRawMaterials = async (req, res) => {
  try {
    const [materials] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       ORDER BY rm.name ASC`
    );
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get raw materials error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get active raw materials
exports.getActiveRawMaterials = async (req, res) => {
  try {
    const [materials] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       WHERE rm.is_active = 1
       ORDER BY rm.name ASC`
    );
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get active raw materials error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get low stock materials (for alerts)
exports.getLowStockMaterials = async (req, res) => {
  try {
    const [materials] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       WHERE rm.is_active = 1 AND rm.current_stock <= rm.min_stock
       ORDER BY rm.current_stock ASC`
    );
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get low stock materials error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get raw material by ID
exports.getRawMaterialById = async (req, res) => {
  try {
    const [materials] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       WHERE rm.id = ?`,
      [req.params.id]
    );

    if (materials.length === 0) {
      return res.status(404).json({ success: false, message: 'المادة الخام غير موجودة' });
    }

    res.json({ success: true, data: materials[0] });
  } catch (error) {
    console.error('Get raw material error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Create raw material
exports.createRawMaterial = async (req, res) => {
  try {
    const { name, description, unit, current_stock, min_stock, unit_cost, supplier_id, is_active } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'الاسم ووحدة القياس مطلوبان' });
    }

    const [result] = await db.query(
      `INSERT INTO raw_materials (name, description, unit, current_stock, min_stock, unit_cost, supplier_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        unit,
        current_stock || 0,
        min_stock || 0,
        unit_cost || 0,
        supplier_id || null,
        is_active !== undefined ? is_active : 1
      ]
    );

    const [newMaterial] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       WHERE rm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة المادة الخام بنجاح',
      data: newMaterial[0]
    });
  } catch (error) {
    console.error('Create raw material error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Update raw material
exports.updateRawMaterial = async (req, res) => {
  try {
    const { name, description, unit, current_stock, min_stock, unit_cost, supplier_id, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM raw_materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'المادة الخام غير موجودة' });
    }

    await db.query(
      `UPDATE raw_materials
       SET name = ?, description = ?, unit = ?, current_stock = ?, min_stock = ?,
           unit_cost = ?, supplier_id = ?, is_active = ?
       WHERE id = ?`,
      [name, description, unit, current_stock, min_stock, unit_cost, supplier_id, is_active, id]
    );

    const [updated] = await db.query(
      `SELECT rm.*, s.name as supplier_name
       FROM raw_materials rm
       LEFT JOIN suppliers s ON rm.supplier_id = s.id
       WHERE rm.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'تم تحديث المادة الخام بنجاح',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update raw material error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Delete raw material
exports.deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM raw_materials WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'المادة الخام غير موجودة' });
    }

    await db.query('DELETE FROM raw_materials WHERE id = ?', [id]);

    res.json({ success: true, message: 'تم حذف المادة الخام بنجاح' });
  } catch (error) {
    console.error('Delete raw material error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Adjust stock manually
exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'الكمية مطلوبة' });
    }

    const [material] = await db.query('SELECT * FROM raw_materials WHERE id = ?', [id]);
    if (material.length === 0) {
      return res.status(404).json({ success: false, message: 'المادة الخام غير موجودة' });
    }

    const newStock = parseFloat(material[0].current_stock) + parseFloat(quantity);

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'الكمية غير كافية' });
    }

    await db.query('UPDATE raw_materials SET current_stock = ? WHERE id = ?', [newStock, id]);

    // Log transaction
    await db.query(
      `INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, reference_type, notes, created_by)
       VALUES (?, 'adjustment', ?, 'manual', ?, ?)`,
      [id, quantity, notes, req.user?.id || null]
    );

    const [updated] = await db.query('SELECT * FROM raw_materials WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'تم تعديل المخزون بنجاح',
      data: updated[0]
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
