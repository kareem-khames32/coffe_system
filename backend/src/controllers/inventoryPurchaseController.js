const db = require('../config/database');

// Get all inventory purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const [purchases] = await db.query(
      `SELECT ip.*, s.name as supplier_name, u.full_name as created_by_name
       FROM inventory_purchases ip
       LEFT JOIN suppliers s ON ip.supplier_id = s.id
       LEFT JOIN users u ON ip.created_by = u.id
       ORDER BY ip.purchase_date DESC, ip.created_at DESC`
    );
    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Get inventory purchases error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Get purchase by ID with items
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [purchases] = await db.query(
      `SELECT ip.*, s.name as supplier_name, u.full_name as created_by_name
       FROM inventory_purchases ip
       LEFT JOIN suppliers s ON ip.supplier_id = s.id
       LEFT JOIN users u ON ip.created_by = u.id
       WHERE ip.id = ?`,
      [id]
    );

    if (purchases.length === 0) {
      return res.status(404).json({ success: false, message: 'المشتريات غير موجودة' });
    }

    const [items] = await db.query(
      `SELECT ipi.*, rm.name as material_name, rm.unit
       FROM inventory_purchase_items ipi
       JOIN raw_materials rm ON ipi.raw_material_id = rm.id
       WHERE ipi.purchase_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...purchases[0],
        items
      }
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Create inventory purchase
exports.createPurchase = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { supplier_id, warehouse_id, purchase_date, invoice_number, items, notes, payment_terms } = req.body;

    if (!purchase_date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'تاريخ الشراء والمواد مطلوبة' });
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_cost)), 0);

    // Insert purchase
    const [purchaseResult] = await connection.query(
      `INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, invoice_number, total_amount, payment_terms, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [supplier_id || null, warehouse_id || null, purchase_date, invoice_number, total_amount, payment_terms || 'cash', notes, req.user?.id || null]
    );

    const purchaseId = purchaseResult.insertId;

    // Insert items and update stock
    for (const item of items) {
      const { raw_material_id, quantity, unit, unit_cost } = item;
      const total_cost = parseFloat(quantity) * parseFloat(unit_cost);

      // Insert item
      await connection.query(
        `INSERT INTO inventory_purchase_items (purchase_id, raw_material_id, quantity, unit, unit_cost, total_cost)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [purchaseId, raw_material_id, quantity, unit, unit_cost, total_cost]
      );

      // Update stock
      await connection.query(
        `UPDATE raw_materials
         SET current_stock = current_stock + ?, unit_cost = ?
         WHERE id = ?`,
        [quantity, unit_cost, raw_material_id]
      );

      // Log transaction
      await connection.query(
        `INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, reference_type, reference_id, created_by)
         VALUES (?, 'purchase', ?, 'purchase', ?, ?)`,
        [raw_material_id, quantity, purchaseId, req.user?.id || null]
      );
    }

    // 💰 Auto-create supplier payment record for credit purchases
    if (payment_terms && payment_terms !== 'cash' && supplier_id) {
      console.log('💰 Auto-creating payment record for credit purchase...');
      console.log('   Payment terms:', payment_terms);
      console.log('   Supplier ID:', supplier_id);
      console.log('   Total amount:', total_amount);

      // Calculate due date based on payment terms
      let daysToAdd = 0;
      if (payment_terms === 'credit_7') daysToAdd = 7;
      else if (payment_terms === 'credit_15') daysToAdd = 15;
      else if (payment_terms === 'credit_30') daysToAdd = 30;
      else if (payment_terms === 'credit_60') daysToAdd = 60;

      const dueDate = new Date(purchase_date);
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      // Create payment record with status 'unpaid'
      await connection.query(
        `INSERT INTO supplier_payments (purchase_id, supplier_id, amount_due, amount_paid, payment_status, due_date, amount, payment_date, created_by)
         VALUES (?, ?, ?, 0, 'unpaid', ?, 0, ?, ?)`,
        [purchaseId, supplier_id, total_amount, dueDate.toISOString().split('T')[0], purchase_date, req.user?.id || 1]
      );

      console.log('✅ Payment record created successfully!');
    }

    await connection.commit();

    // Get the created purchase with items
    const [newPurchase] = await connection.query(
      `SELECT ip.*, s.name as supplier_name
       FROM inventory_purchases ip
       LEFT JOIN suppliers s ON ip.supplier_id = s.id
       WHERE ip.id = ?`,
      [purchaseId]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة المشتريات بنجاح',
      data: newPurchase[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create purchase error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally {
    connection.release();
  }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Get purchase items
    const [items] = await connection.query(
      'SELECT * FROM inventory_purchase_items WHERE purchase_id = ?',
      [id]
    );

    // Reverse stock updates
    for (const item of items) {
      await connection.query(
        `UPDATE raw_materials
         SET current_stock = current_stock - ?
         WHERE id = ?`,
        [item.quantity, item.raw_material_id]
      );
    }

    // Delete purchase (items will be deleted by CASCADE)
    await connection.query('DELETE FROM inventory_purchases WHERE id = ?', [id]);

    await connection.commit();

    res.json({ success: true, message: 'تم حذف المشتريات بنجاح' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete purchase error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally {
    connection.release();
  }
};
