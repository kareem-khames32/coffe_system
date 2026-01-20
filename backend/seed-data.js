const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedData() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🌱 Seeding complete system data...\n');

        await connection.beginTransaction();

        // ====== 1. WAREHOUSES (المستودعات) ======
        console.log('🏢 Adding warehouses...');
        const warehouses = [
            ['المستودع الرئيسي', 'شارع الجامعة، القاهرة', 'مستودع رئيسي لجميع المواد الخام'],
            ['مستودع الفرع الثاني', 'شارع الهرم، الجيزة', 'مستودع فرعي'],
        ];

        const warehouseIds = [];
        for (const [name, location, description] of warehouses) {
            const [result] = await connection.query(
                'INSERT INTO warehouses (name, location, description, is_active) VALUES (?, ?, ?, 1)',
                [name, location, description]
            );
            warehouseIds.push(result.insertId);
        }
        console.log(`✅ Added ${warehouses.length} warehouses`);

        // ====== 2. SUPPLIERS (الموردين) ======
        console.log('\n🚚 Adding suppliers...');
        const suppliers = [
            ['شركة القهوة المصرية', 'أحمد محمد', '01123456789', 'ahmed@coffee.com', 'شارع التحرير، القاهرة'],
            ['مؤسسة الألبان الطازجة', 'سارة علي', '01198765432', 'sara@dairy.com', 'شارع الهرم، الجيزة'],
            ['شركة المواد الغذائية', 'محمود حسن', '01234567890', 'mahmoud@foods.com', 'المنصورة'],
        ];

        const supplierIds = [];
        for (const [name, contact, phone, email, address] of suppliers) {
            const [result] = await connection.query(
                'INSERT INTO suppliers (name, contact_person, phone, email, address, is_active) VALUES (?, ?, ?, ?, ?, 1)',
                [name, contact, phone, email, address]
            );
            supplierIds.push(result.insertId);
        }
        console.log(`✅ Added ${suppliers.length} suppliers`);

        // ====== 3. CATEGORIES (الفئات) ======
        console.log('\n📁 Adding categories...');
        const categories = [
            ['قهوة ساخنة', 'مشروبات قهوة ساخنة'],
            ['قهوة باردة', 'مشروبات قهوة باردة'],
            ['مشروبات أخرى', 'شاي ومشروبات أخرى'],
        ];

        const categoryIds = [];
        for (const [name, description] of categories) {
            const [result] = await connection.query(
                'INSERT INTO categories (name, description, is_active) VALUES (?, ?, 1)',
                [name, description]
            );
            categoryIds.push(result.insertId);
        }
        console.log(`✅ Added ${categories.length} categories`);

        // ====== 4. RAW MATERIALS (المواد الخام) ======
        console.log('\n📦 Adding raw materials...');
        const rawMaterials = [
            ['بن عربي', 'قهوة محمصة للاستخدام في المشروبات', 'جرام', 0, 500, 0.15, supplierIds[0], warehouseIds[0]],
            ['حليب كامل الدسم', 'حليب طازج كامل الدسم', 'مل', 0, 5000, 0.02, supplierIds[1], warehouseIds[0]],
            ['سكر أبيض', 'سكر أبيض ناعم', 'جرام', 0, 500, 0.008, supplierIds[2], warehouseIds[0]],
            ['كاكاو بودر', 'كاكاو فاخر للمشروبات', 'جرام', 0, 100, 0.045, supplierIds[2], warehouseIds[0]],
            ['فانيليا', 'خلاصة فانيليا طبيعية', 'مل', 0, 50, 0.30, supplierIds[2], warehouseIds[0]],
            ['كراميل صوص', 'صوص كراميل للتزيين', 'مل', 0, 100, 0.055, supplierIds[2], warehouseIds[0]],
            ['كريمة خفق', 'كريمة خفق طازجة', 'مل', 0, 150, 0.035, supplierIds[1], warehouseIds[0]],
        ];

        const rawMaterialIds = [];
        for (const [name, description, unit, stock, minStock, unitCost, supplierId, warehouseId] of rawMaterials) {
            const [result] = await connection.query(
                'INSERT INTO raw_materials (name, description, unit, current_stock, min_stock, unit_cost, supplier_id, warehouse_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                [name, description, unit, stock, minStock, unitCost, supplierId, warehouseId]
            );
            rawMaterialIds.push({ id: result.insertId, name, unit });
        }
        console.log(`✅ Added ${rawMaterials.length} raw materials`);

        // ====== 5. INVENTORY PURCHASES (المشتريات) ======
        console.log('\n🛒 Adding inventory purchases...');

        // Get first user (cashier/admin) for created_by
        const [users] = await connection.query('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
            throw new Error('No users found. Please add at least one user first.');
        }
        const userId = users[0].id;

        // Purchase 1: بن عربي
        const [purchase1] = await connection.query(
            `INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, total_amount, payment_status, notes, created_by)
             VALUES (?, ?, CURDATE(), ?, 'paid', 'شراء بن عربي', ?)`,
            [supplierIds[0], warehouseIds[0], 300, userId]
        );
        await connection.query(
            `INSERT INTO inventory_purchase_items (purchase_id, raw_material_id, quantity, unit, unit_cost, total_cost)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [purchase1.insertId, rawMaterialIds[0].id, 2000, 'جرام', 0.15, 300]
        );
        // Update stock
        await connection.query(
            'UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?',
            [2000, rawMaterialIds[0].id]
        );

        // Purchase 2: حليب
        const [purchase2] = await connection.query(
            `INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, total_amount, payment_status, notes, created_by)
             VALUES (?, ?, CURDATE(), ?, 'paid', 'شراء حليب طازج', ?)`,
            [supplierIds[1], warehouseIds[0], 1000, userId]
        );
        await connection.query(
            `INSERT INTO inventory_purchase_items (purchase_id, raw_material_id, quantity, unit, unit_cost, total_cost)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [purchase2.insertId, rawMaterialIds[1].id, 50000, 'مل', 0.02, 1000]
        );
        await connection.query(
            'UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?',
            [50000, rawMaterialIds[1].id]
        );

        // Purchase 3: سكر وكاكاو وتوابل
        const [purchase3] = await connection.query(
            `INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, total_amount, payment_status, notes, created_by)
             VALUES (?, ?, CURDATE(), ?, 'paid', 'شراء سكر وكاكاو وتوابل', ?)`,
            [supplierIds[2], warehouseIds[0], 290, userId]
        );
        await connection.query(
            `INSERT INTO inventory_purchase_items (purchase_id, raw_material_id, quantity, unit, unit_cost, total_cost)
             VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
            [
                purchase3.insertId, rawMaterialIds[2].id, 10000, 'جرام', 0.008, 80,
                purchase3.insertId, rawMaterialIds[3].id, 1000, 'جرام', 0.045, 45,
                purchase3.insertId, rawMaterialIds[4].id, 500, 'مل', 0.30, 150,
                purchase3.insertId, rawMaterialIds[5].id, 200, 'مل', 0.055, 11
            ]
        );
        await connection.query('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?', [10000, rawMaterialIds[2].id]);
        await connection.query('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?', [1000, rawMaterialIds[3].id]);
        await connection.query('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?', [500, rawMaterialIds[4].id]);
        await connection.query('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?', [200, rawMaterialIds[5].id]);

        // Purchase 4: كريمة خفق
        const [purchase4] = await connection.query(
            `INSERT INTO inventory_purchases (supplier_id, warehouse_id, purchase_date, total_amount, payment_status, notes, created_by)
             VALUES (?, ?, CURDATE(), ?, 'paid', 'شراء كريمة خفق', ?)`,
            [supplierIds[1], warehouseIds[0], 70, userId]
        );
        await connection.query(
            `INSERT INTO inventory_purchase_items (purchase_id, raw_material_id, quantity, unit, unit_cost, total_cost)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [purchase4.insertId, rawMaterialIds[6].id, 2000, 'مل', 0.035, 70]
        );
        await connection.query(
            'UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?',
            [2000, rawMaterialIds[6].id]
        );

        console.log(`✅ Added 4 inventory purchases with items`);

        // ====== 6. PRODUCTS (المنتجات) ======
        console.log('\n☕ Adding products...');

        const products = [
            ['إسبريسو', 'قهوة إسبريسو إيطالية أصلية', categoryIds[0], 15, 28],
            ['كابتشينو', 'كابتشينو بالحليب الطازج', categoryIds[0], 18, 30],
            ['لاتيه', 'لاتيه بالحليب الكريمي', categoryIds[0], 20, 32],
            ['أمريكانو', 'قهوة أمريكية كلاسيكية', categoryIds[0], 12, 25],
            ['موكا', 'موكا بالشوكولاتة الفاخرة', categoryIds[0], 22, 35],
            ['آيس لاتيه', 'لاتيه بارد منعش', categoryIds[1], 22, 35],
            ['آيس موكا', 'موكا بارد بالشوكولاتة', categoryIds[1], 24, 38],
            ['فرابتشينو كراميل', 'فرابتشينو بالكراميل', categoryIds[1], 28, 40],
        ];

        const productIds = [];
        for (const [name, description, categoryId, costPrice, price] of products) {
            const [result] = await connection.query(
                'INSERT INTO products (name, description, category_id, cost_price, price, is_available, is_active) VALUES (?, ?, ?, ?, ?, 1, 1)',
                [name, description, categoryId, costPrice, price]
            );
            productIds.push({ id: result.insertId, name });
        }
        console.log(`✅ Added ${products.length} products`);

        // ====== 7. PRODUCT RECIPES (وصفات المنتجات) ======
        console.log('\n📝 Adding product recipes...');

        // Helper to find IDs
        const findRawMaterial = (name) => rawMaterialIds.find(rm => rm.name === name);
        const findProduct = (name) => productIds.find(p => p.name === name);

        const coffee = findRawMaterial('بن عربي');
        const milk = findRawMaterial('حليب كامل الدسم');
        const sugar = findRawMaterial('سكر أبيض');
        const cocoa = findRawMaterial('كاكاو بودر');
        const caramel = findRawMaterial('كراميل صوص');
        const cream = findRawMaterial('كريمة خفق');

        // Recipes: [product_name, raw_material, quantity, unit]
        const recipes = [
            ['إسبريسو', coffee, 18, 'جرام'],
            ['إسبريسو', sugar, 5, 'جرام'],

            ['كابتشينو', coffee, 18, 'جرام'],
            ['كابتشينو', milk, 120, 'مل'],
            ['كابتشينو', sugar, 8, 'جرام'],

            ['لاتيه', coffee, 18, 'جرام'],
            ['لاتيه', milk, 200, 'مل'],
            ['لاتيه', sugar, 8, 'جرام'],

            ['أمريكانو', coffee, 18, 'جرام'],
            ['أمريكانو', sugar, 5, 'جرام'],

            ['موكا', coffee, 18, 'جرام'],
            ['موكا', milk, 150, 'مل'],
            ['موكا', cocoa, 20, 'جرام'],
            ['موكا', sugar, 10, 'جرام'],

            ['آيس لاتيه', coffee, 18, 'جرام'],
            ['آيس لاتيه', milk, 200, 'مل'],
            ['آيس لاتيه', sugar, 10, 'جرام'],

            ['آيس موكا', coffee, 18, 'جرام'],
            ['آيس موكا', milk, 150, 'مل'],
            ['آيس موكا', cocoa, 25, 'جرام'],
            ['آيس موكا', sugar, 12, 'جرام'],

            ['فرابتشينو كراميل', coffee, 18, 'جرام'],
            ['فرابتشينو كراميل', milk, 180, 'مل'],
            ['فرابتشينو كراميل', caramel, 30, 'مل'],
            ['فرابتشينو كراميل', cream, 40, 'مل'],
            ['فرابتشينو كراميل', sugar, 15, 'جرام'],
        ];

        let recipeCount = 0;
        for (const [productName, rawMaterial, quantity, unit] of recipes) {
            const product = findProduct(productName);
            if (product && rawMaterial) {
                await connection.query(
                    'INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit) VALUES (?, ?, ?, ?)',
                    [product.id, rawMaterial.id, quantity, unit]
                );
                recipeCount++;
            }
        }
        console.log(`✅ Added ${recipeCount} recipe items`);

        await connection.commit();

        console.log('\n✅ Complete system data seeded successfully!');
        console.log('🎯 System ready for full testing!\n');
        console.log('📊 Summary:');
        console.log(`   - ${warehouses.length} warehouses`);
        console.log(`   - ${suppliers.length} suppliers`);
        console.log(`   - ${categories.length} categories`);
        console.log(`   - ${rawMaterials.length} raw materials`);
        console.log(`   - 4 inventory purchases with stock`);
        console.log(`   - ${products.length} products`);
        console.log(`   - ${recipeCount} recipe items`);
        console.log('\n🧪 You can now test:');
        console.log('   ✅ Create orders (materials will be deducted)');
        console.log('   ✅ View inventory reports');
        console.log('   ✅ Check stock levels');
        console.log('   ✅ View sales reports');
        console.log('   ✅ Track material usage\n');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Error seeding data:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

seedData();
