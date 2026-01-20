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
            ['قهوة ساخنة', 'hot-coffee', 'مشروبات قهوة ساخنة'],
            ['قهوة باردة', 'iced-coffee', 'مشروبات قهوة باردة'],
            ['مشروبات أخرى', 'other-drinks', 'شاي ومشروبات أخرى'],
        ];

        for (const [name, slug, description] of categories) {
            await connection.query(
                'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
                [name, slug, description]
            );
        }
        console.log(`✅ Added ${categories.length} categories`);

        // 2. Add Raw Materials
        console.log('\n📦 Adding raw materials...');
        const rawMaterials = [
            ['بن عربي', 'حبوب', 1000, 200, 150],
            ['حليب كامل الدسم', 'لتر', 50, 20, 25],
            ['سكر أبيض', 'جرام', 5000, 500, 8],
            ['كاكاو بودر', 'جرام', 500, 100, 45],
            ['فانيليا', 'مل', 200, 50, 30],
            ['كراميل صوص', 'مل', 300, 100, 55],
            ['كريمة خفق', 'مل', 400, 150, 35],
        ];

        for (const [name, unit, stock, minStock, unitCost] of rawMaterials) {
            await connection.query(
                'INSERT INTO raw_materials (name, unit, stock_quantity, min_stock, unit_cost) VALUES (?, ?, ?, ?, ?)',
                [name, unit, stock, minStock, unitCost]
            );
        }
        console.log(`✅ Added ${rawMaterials.length} raw materials`);

        // 3. Add Products
        console.log('\n☕ Adding products...');

        // Get category IDs
        const [hotCoffee] = await connection.query("SELECT id FROM categories WHERE slug = 'hot-coffee'");
        const [icedCoffee] = await connection.query("SELECT id FROM categories WHERE slug = 'iced-coffee'");
        const [otherDrinks] = await connection.query("SELECT id FROM categories WHERE slug = 'other-drinks'");

        const products = [
            ['إسبريسو', 'espresso', 'قهوة إسبريسو إيطالية أصلية', hotCoffee[0].id, 25, 28, 15, 'متوفر'],
            ['كابتشينو', 'cappuccino', 'كابتشينو بالحليب الطازج', hotCoffee[0].id, 22, 30, 18, 'متوفر'],
            ['لاتيه', 'latte', 'لاتيه بالحليب الكريمي', hotCoffee[0].id, 24, 32, 20, 'متوفر'],
            ['أمريكانو', 'americano', 'قهوة أمريكية كلاسيكية', hotCoffee[0].id, 18, 25, 12, 'متوفر'],
            ['موكا', 'mocha', 'موكا بالشوكولاتة الفاخرة', hotCoffee[0].id, 26, 35, 22, 'متوفر'],
            ['آيس لاتيه', 'iced-latte', 'لاتيه بارد منعش', icedCoffee[0].id, 25, 35, 22, 'متوفر'],
            ['آيس موكا', 'iced-mocha', 'موكا بارد بالشوكولاتة', icedCoffee[0].id, 27, 38, 24, 'متوفر'],
            ['فرابتشينو كراميل', 'caramel-frappuccino', 'فرابتشينو بالكراميل', icedCoffee[0].id, 30, 40, 28, 'متوفر'],
        ];

        const productIds = [];
        for (const [name, slug, description, categoryId, costPrice, price, prepTime, status] of products) {
            const [result] = await connection.query(
                'INSERT INTO products (name, slug, description, category_id, cost_price, price, preparation_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, slug, description, categoryId, costPrice, price, prepTime, status]
            );
            productIds.push({ id: result.insertId, name, slug });
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

        // Recipes: [product_slug, raw_material_id, quantity]
        const recipes = [
            ['espresso', coffee[0].id, 18],
            ['espresso', sugar[0].id, 5],

            ['cappuccino', coffee[0].id, 18],
            ['cappuccino', milk[0].id, 120],
            ['cappuccino', sugar[0].id, 8],

            ['latte', coffee[0].id, 18],
            ['latte', milk[0].id, 200],
            ['latte', sugar[0].id, 8],

            ['americano', coffee[0].id, 18],
            ['americano', sugar[0].id, 5],

            ['mocha', coffee[0].id, 18],
            ['mocha', milk[0].id, 150],
            ['mocha', cocoa[0].id, 20],
            ['mocha', sugar[0].id, 10],

            ['iced-latte', coffee[0].id, 18],
            ['iced-latte', milk[0].id, 200],
            ['iced-latte', sugar[0].id, 10],

            ['iced-mocha', coffee[0].id, 18],
            ['iced-mocha', milk[0].id, 150],
            ['iced-mocha', cocoa[0].id, 25],
            ['iced-mocha', sugar[0].id, 12],

            ['caramel-frappuccino', coffee[0].id, 18],
            ['caramel-frappuccino', milk[0].id, 180],
            ['caramel-frappuccino', caramel[0].id, 30],
            ['caramel-frappuccino', cream[0].id, 40],
            ['caramel-frappuccino', sugar[0].id, 15],
        ];

        let recipeCount = 0;
        for (const [productSlug, rawMaterialId, quantity] of recipes) {
            const product = productIds.find(p => p.slug === productSlug);
            if (product) {
                await connection.query(
                    'INSERT INTO product_recipes (product_id, raw_material_id, quantity_required) VALUES (?, ?, ?)',
                    [product.id, rawMaterialId, quantity]
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
