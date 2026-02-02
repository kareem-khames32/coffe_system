const db = require('../config/database');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query(
      'SELECT * FROM suppliers ORDER BY name ASC'
    );
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get active suppliers
exports.getActiveSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query(
      'SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC'
    );
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Get active suppliers error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const [suppliers] = await db.query(
      'SELECT * FROM suppliers WHERE id = ?',
      [req.params.id]
    );

    if (suppliers.length === 0) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    res.json({ success: true, data: suppliers[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, notes, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم المورد مطلوب' });
    }

    const [result] = await db.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, contact_person, phone, email, address, notes, is_active !== undefined ? is_active : 1]
    );

    const [newSupplier] = await db.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'تم إضافة المورد بنجاح',
      data: newSupplier[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, notes, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    await db.query(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ?, is_active = ?
       WHERE id = ?`,
      [name, contact_person, phone, email, address, notes, is_active, id]
    );

    const [updated] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'تم تحديث المورد بنجاح',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    await db.query('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({ success: true, message: 'تم حذف المورد بنجاح' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
