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

        console.log('🌱 Seeding database with test data...\n');

        await connection.beginTransaction();

        // 1. Add Categories
        console.log('📁 Adding categories...');
        const categories = [
            ['قهوة ساخنة', 'مشروبات قهوة ساخنة'],
            ['قهوة باردة', 'مشروبات قهوة باردة'],
            ['مشروبات أخرى', 'شاي ومشروبات أخرى'],
        ];

        for (const [name, description] of categories) {
            await connection.query(
                'INSERT INTO categories (name, description, is_active) VALUES (?, ?, 1)',
                [name, description]
            );
        }
        console.log(`✅ Added ${categories.length} categories`);

        // 2. Add Raw Materials
        console.log('\n📦 Adding raw materials...');
        const rawMaterials = [
            ['بن عربي', 'قهوة محمصة للاستخدام في المشروبات', 'جرام', 1000, 200, 0.15],
            ['حليب كامل الدسم', 'حليب طازج كامل الدسم', 'مل', 50000, 10000, 0.02],
            ['سكر أبيض', 'سكر أبيض ناعم', 'جرام', 5000, 500, 0.008],
            ['كاكاو بودر', 'كاكاو فاخر للمشروبات', 'جرام', 500, 100, 0.045],
            ['فانيليا', 'خلاصة فانيليا طبيعية', 'مل', 200, 50, 0.30],
            ['كراميل صوص', 'صوص كراميل للتزيين', 'مل', 300, 100, 0.055],
            ['كريمة خفق', 'كريمة خفق طازجة', 'مل', 400, 150, 0.035],
        ];

        for (const [name, description, unit, stock, minStock, unitCost] of rawMaterials) {
            await connection.query(
                'INSERT INTO raw_materials (name, description, unit, current_stock, min_stock, unit_cost, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [name, description, unit, stock, minStock, unitCost]
            );
        }
        console.log(`✅ Added ${rawMaterials.length} raw materials`);

        // 3. Add Products
        console.log('\n☕ Adding products...');

        // Get category IDs
        const [hotCoffee] = await connection.query("SELECT id FROM categories WHERE name = 'قهوة ساخنة'");
        const [icedCoffee] = await connection.query("SELECT id FROM categories WHERE name = 'قهوة باردة'");

        const products = [
            ['إسبريسو', 'قهوة إسبريسو إيطالية أصلية', hotCoffee[0].id, 15, 28],
            ['كابتشينو', 'كابتشينو بالحليب الطازج', hotCoffee[0].id, 18, 30],
            ['لاتيه', 'لاتيه بالحليب الكريمي', hotCoffee[0].id, 20, 32],
            ['أمريكانو', 'قهوة أمريكية كلاسيكية', hotCoffee[0].id, 12, 25],
            ['موكا', 'موكا بالشوكولاتة الفاخرة', hotCoffee[0].id, 22, 35],
            ['آيس لاتيه', 'لاتيه بارد منعش', icedCoffee[0].id, 22, 35],
            ['آيس موكا', 'موكا بارد بالشوكولاتة', icedCoffee[0].id, 24, 38],
            ['فرابتشينو كراميل', 'فرابتشينو بالكراميل', icedCoffee[0].id, 28, 40],
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

        // 4. Add Product Recipes
        console.log('\n📝 Adding product recipes...');

        // Get raw material IDs
        const [coffee] = await connection.query("SELECT id FROM raw_materials WHERE name = 'بن عربي'");
        const [milk] = await connection.query("SELECT id FROM raw_materials WHERE name = 'حليب كامل الدسم'");
        const [sugar] = await connection.query("SELECT id FROM raw_materials WHERE name = 'سكر أبيض'");
        const [cocoa] = await connection.query("SELECT id FROM raw_materials WHERE name = 'كاكاو بودر'");
        const [caramel] = await connection.query("SELECT id FROM raw_materials WHERE name = 'كراميل صوص'");
        const [cream] = await connection.query("SELECT id FROM raw_materials WHERE name = 'كريمة خفق'");

        // Recipes: [product_name, raw_material_id, quantity, unit]
        const recipes = [
            ['إسبريسو', coffee[0].id, 18, 'جرام'],
            ['إسبريسو', sugar[0].id, 5, 'جرام'],

            ['كابتشينو', coffee[0].id, 18, 'جرام'],
            ['كابتشينو', milk[0].id, 120, 'مل'],
            ['كابتشينو', sugar[0].id, 8, 'جرام'],

            ['لاتيه', coffee[0].id, 18, 'جرام'],
            ['لاتيه', milk[0].id, 200, 'مل'],
            ['لاتيه', sugar[0].id, 8, 'جرام'],

            ['أمريكانو', coffee[0].id, 18, 'جرام'],
            ['أمريكانو', sugar[0].id, 5, 'جرام'],

            ['موكا', coffee[0].id, 18, 'جرام'],
            ['موكا', milk[0].id, 150, 'مل'],
            ['موكا', cocoa[0].id, 20, 'جرام'],
            ['موكا', sugar[0].id, 10, 'جرام'],

            ['آيس لاتيه', coffee[0].id, 18, 'جرام'],
            ['آيس لاتيه', milk[0].id, 200, 'مل'],
            ['آيس لاتيه', sugar[0].id, 10, 'جرام'],

            ['آيس موكا', coffee[0].id, 18, 'جرام'],
            ['آيس موكا', milk[0].id, 150, 'مل'],
            ['آيس موكا', cocoa[0].id, 25, 'جرام'],
            ['آيس موكا', sugar[0].id, 12, 'جرام'],

            ['فرابتشينو كراميل', coffee[0].id, 18, 'جرام'],
            ['فرابتشينو كراميل', milk[0].id, 180, 'مل'],
            ['فرابتشينو كراميل', caramel[0].id, 30, 'مل'],
            ['فرابتشينو كراميل', cream[0].id, 40, 'مل'],
            ['فرابتشينو كراميل', sugar[0].id, 15, 'جرام'],
        ];

        let recipeCount = 0;
        for (const [productName, rawMaterialId, quantity, unit] of recipes) {
            const product = productIds.find(p => p.name === productName);
            if (product) {
                await connection.query(
                    'INSERT INTO product_recipes (product_id, raw_material_id, quantity_needed, unit) VALUES (?, ?, ?, ?)',
                    [product.id, rawMaterialId, quantity, unit]
                );
                recipeCount++;
            }
        }
        console.log(`✅ Added ${recipeCount} recipe items`);

        await connection.commit();

        console.log('\n✅ Database seeded successfully!');
        console.log('🎯 Ready to test orders!\n');
        console.log('📊 Summary:');
        console.log(`   - ${categories.length} categories`);
        console.log(`   - ${rawMaterials.length} raw materials`);
        console.log(`   - ${products.length} products`);
        console.log(`   - ${recipeCount} recipe items\n`);

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
