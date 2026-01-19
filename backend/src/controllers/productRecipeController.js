const db = require('../config/database');
const { convertUnits } = require('../utils/unitConversion');

// Get recipe for a product
exports.getProductRecipe = async (req, res) => {
  try {
    const { productId } = req.params;

    const [recipe] = await db.query(
      `SELECT pr.raw_material_id, pr.quantity_needed, pr.unit,
              rm.name as material_name, rm.unit as material_unit, rm.unit_cost
       FROM product_recipes pr
       JOIN raw_materials rm ON pr.raw_material_id = rm.id
       WHERE pr.product_id = ?
       ORDER BY rm.name ASC`,
      [productId]
    );

    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error('Get product recipe error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Update product recipe (replace all)
exports.updateProductRecipe = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { productId } = req.params;
    const { recipe } = req.body; // array of {raw_material_id, quantity_needed, unit}

    if (!recipe || !Array.isArray(recipe)) {
      return res.status(400).json({ success: false, message: 'الوصفة مطلوبة' });
    }

    // Delete existing recipe
    await connection.query('DELETE FROM product_recipes WHERE product_id = ?', [productId]);

    // Insert new recipe items
    let totalCost = 0;
    for (const item of recipe) {
      const { raw_material_id, quantity_needed, unit } = item;

      if (!raw_material_id || !quantity_needed) {
        continue;
      }

      await connection.query(
        `INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit)
         VALUES (?, ?, ?, ?)`,
        [productId, raw_material_id, quantity_needed, unit || null]
      );

      // Calculate cost with unit conversion
      const [material] = await connection.query(
        'SELECT unit_cost, unit FROM raw_materials WHERE id = ?',
        [raw_material_id]
      );

      if (material.length > 0) {
        const materialUnit = material[0].unit;
        const recipeUnit = unit || materialUnit;

        // Convert recipe quantity to material's base unit
        const convertedQuantity = convertUnits(
          parseFloat(quantity_needed),
          recipeUnit,
          materialUnit
        );

        totalCost += parseFloat(material[0].unit_cost) * convertedQuantity;
      }
    }

    // Update product cost_price automatically
    await connection.query(
      'UPDATE products SET cost_price = ? WHERE id = ?',
      [totalCost, productId]
    );

    await connection.commit();

    // Get updated recipe
    const [updatedRecipe] = await connection.query(
      `SELECT pr.raw_material_id, pr.quantity_needed, pr.unit,
              rm.name as material_name, rm.unit as material_unit, rm.unit_cost
       FROM product_recipes pr
       JOIN raw_materials rm ON pr.raw_material_id = rm.id
       WHERE pr.product_id = ?`,
      [productId]
    );

    res.json({
      success: true,
      message: 'تم تحديث الوصفة بنجاح',
      data: {
        recipe: updatedRecipe,
        total_cost: totalCost
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update product recipe error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally {
    connection.release();
  }
};

// Deduct stock for an order (called when order is created)
exports.deductStockForOrder = async (orderId, items) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const { product_id, quantity } = item;

      // Get product recipe
      const [recipe] = await connection.query(
        'SELECT * FROM product_recipes WHERE product_id = ?',
        [product_id]
      );

      // Deduct each material
      for (const recipeItem of recipe) {
        const totalQuantity = parseFloat(recipeItem.quantity_needed) * parseFloat(quantity);

        // Update stock
        await connection.query(
          `UPDATE raw_materials
           SET current_stock = current_stock - ?
           WHERE id = ?`,
          [totalQuantity, recipeItem.raw_material_id]
        );

        // Log transaction
        await connection.query(
          `INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, reference_type, reference_id)
           VALUES (?, 'sale', ?, 'order', ?)`,
          [recipeItem.raw_material_id, 'sale', -totalQuantity, 'order', orderId]
        );
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Deduct stock error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Restore stock for an order (called when order is cancelled or edited)
exports.restoreStockForOrder = async (orderId, items) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const { product_id, quantity } = item;

      // Get product recipe
      const [recipe] = await connection.query(
        'SELECT * FROM product_recipes WHERE product_id = ?',
        [product_id]
      );

      // Restore each material
      for (const recipeItem of recipe) {
        const totalQuantity = parseFloat(recipeItem.quantity_needed) * parseFloat(quantity);

        // Update stock (add back)
        await connection.query(
          `UPDATE raw_materials
           SET current_stock = current_stock + ?
           WHERE id = ?`,
          [totalQuantity, recipeItem.raw_material_id]
        );

        // Log transaction
        await connection.query(
          `INSERT INTO inventory_transactions (raw_material_id, transaction_type, quantity, reference_type, reference_id)
           VALUES (?, 'return', ?, 'order_cancel', ?)`,
          [recipeItem.raw_material_id, 'return', totalQuantity, 'order_cancel', orderId]
        );
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Restore stock error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Check if sufficient stock is available
exports.checkStockAvailability = async (req, res) => {
  try {
    const { items, products } = req.body; // array of {product_id, quantity}
    const itemsToCheck = items || products || [];

    const unavailableMaterials = [];

    for (const item of itemsToCheck) {
      const { product_id, quantity } = item;

      // Get product recipe
      const [recipe] = await db.query(
        `SELECT pr.*, rm.name as material_name, rm.current_stock, rm.unit
         FROM product_recipes pr
         JOIN raw_materials rm ON pr.raw_material_id = rm.id
         WHERE pr.product_id = ?`,
        [product_id]
      );

      // Check each material
      for (const recipeItem of recipe) {
        const requiredQuantity = parseFloat(recipeItem.quantity_needed) * parseFloat(quantity);
        const availableStock = parseFloat(recipeItem.current_stock);

        if (requiredQuantity > availableStock) {
          unavailableMaterials.push({
            material_name: recipeItem.material_name,
            required: requiredQuantity,
            available: availableStock,
            unit: recipeItem.unit
          });
        }
      }
    }

    if (unavailableMaterials.length > 0) {
      return res.json({
        success: false,
        available: false,
        message: 'مخزون غير كافٍ',
        unavailable_materials: unavailableMaterials
      });
    }

    res.json({
      success: true,
      available: true,
      message: 'المخزون متوفر'
    });
  } catch (error) {
    console.error('Check stock availability error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// Add single recipe item
exports.addRecipeItem = async (req, res) => {
  try {
    const { product_id, raw_material_id, quantity_needed, unit, notes } = req.body;

    // Validate required fields
    if (!product_id || !raw_material_id || !quantity_needed || !unit) {
      return res.status(400).json({
        success: false,
        message: 'المنتج، المادة الخام، الكمية، والوحدة مطلوبة'
      });
    }

    // Check if product exists
    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // Check if raw material exists
    const [material] = await db.query('SELECT id FROM raw_materials WHERE id = ?', [raw_material_id]);
    if (material.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المادة الخام غير موجودة'
      });
    }

    // Check if recipe already exists
    const [existing] = await db.query(
      'SELECT id FROM product_recipes WHERE product_id = ? AND raw_material_id = ?',
      [product_id, raw_material_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'الوصفة موجودة بالفعل. استخدم التعديل لتحديثها'
      });
    }

    // Insert recipe
    const [result] = await db.query(`
      INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [product_id, raw_material_id, quantity_needed, unit, notes || null]);

    // Get the created recipe
    const [recipe] = await db.query(`
      SELECT
        pr.id,
        pr.product_id,
        pr.raw_material_id,
        pr.quantity_needed,
        pr.unit,
        pr.notes,
        rm.name AS material_name,
        p.name AS product_name,
        pr.created_at
      FROM product_recipes pr
      JOIN raw_materials rm ON pr.raw_material_id = rm.id
      JOIN products p ON pr.product_id = p.id
      WHERE pr.id = ?
    `, [result.insertId]);

    res.json({
      success: true,
      message: 'تم إضافة الوصفة بنجاح',
      data: recipe[0]
    });
  } catch (error) {
    console.error('Add recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الوصفة'
    });
  }
};

module.exports = exports;
