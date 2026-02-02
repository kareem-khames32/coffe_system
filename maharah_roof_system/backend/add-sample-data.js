const mysql = require('mysql2/promise');
require('dotenv').config();

const addSampleData = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database');

    // Add Categories
    console.log('\n📁 Adding categories...');
    const categories = [
      { name: 'مشروبات ساخنة', description: 'القهوة والشاي والمشروبات الساخنة' },
      { name: 'مشروبات باردة', description: 'العصائر والمشروبات المثلجة' },
      { name: 'حلويات', description: 'الكيك والمعجنات والحلويات' },
      { name: 'وجبات خفيفة', description: 'السندويتشات والوجبات الخفيفة' },
    ];

    for (const cat of categories) {
      await connection.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [cat.name, cat.description]
      );
      console.log(`✅ Added category: ${cat.name}`);
    }

    // Get category IDs
    const [catRows] = await connection.execute('SELECT id, name FROM categories');
    const catMap = {};
    catRows.forEach(row => {
      catMap[row.name] = row.id;
    });

    // Add Products
    console.log('\n☕ Adding products...');
    const products = [
      // مشروبات ساخنة
      { name: 'إسبريسو', category_id: catMap['مشروبات ساخنة'], price: 25, cost_price: 10, stock: 100, description: 'قهوة إسبريسو إيطالية أصلية' },
      { name: 'كابتشينو', category_id: catMap['مشروبات ساخنة'], price: 35, cost_price: 15, stock: 100, description: 'كابتشينو بالحليب الطازج' },
      { name: 'لاتيه', category_id: catMap['مشروبات ساخنة'], price: 35, cost_price: 15, stock: 100, description: 'لاتيه كلاسيكي' },
      { name: 'أمريكانو', category_id: catMap['مشروبات ساخنة'], price: 30, cost_price: 12, stock: 100, description: 'قهوة أمريكانو' },
      { name: 'تركيش كوفي', category_id: catMap['مشروبات ساخنة'], price: 20, cost_price: 8, stock: 100, description: 'قهوة تركية تقليدية' },
      { name: 'شاي أخضر', category_id: catMap['مشروبات ساخنة'], price: 15, cost_price: 5, stock: 100, description: 'شاي أخضر طبيعي' },
      { name: 'شاي أسود', category_id: catMap['مشروبات ساخنة'], price: 12, cost_price: 4, stock: 100, description: 'شاي أسود فاخر' },
      { name: 'هوت شوكليت', category_id: catMap['مشروبات ساخنة'], price: 40, cost_price: 18, stock: 80, description: 'شوكولاتة ساخنة غنية' },

      // مشروبات باردة
      { name: 'آيس لاتيه', category_id: catMap['مشروبات باردة'], price: 40, cost_price: 18, stock: 100, description: 'لاتيه مثلج' },
      { name: 'آيس كابتشينو', category_id: catMap['مشروبات باردة'], price: 40, cost_price: 18, stock: 100, description: 'كابتشينو مثلج' },
      { name: 'فرابتشينو كراميل', category_id: catMap['مشروبات باردة'], price: 45, cost_price: 20, stock: 80, description: 'فرابتشينو بنكهة الكراميل' },
      { name: 'عصير برتقال طازج', category_id: catMap['مشروبات باردة'], price: 30, cost_price: 12, stock: 60, description: 'عصير برتقال طبيعي' },
      { name: 'عصير مانجو', category_id: catMap['مشروبات باردة'], price: 35, cost_price: 15, stock: 60, description: 'عصير مانجو طازج' },
      { name: 'موهيتو', category_id: catMap['مشروبات باردة'], price: 38, cost_price: 16, stock: 70, description: 'موهيتو منعش' },

      // حلويات
      { name: 'كيك شوكولاتة', category_id: catMap['حلويات'], price: 45, cost_price: 20, stock: 30, description: 'كيك شوكولاتة فاخر' },
      { name: 'تشيز كيك', category_id: catMap['حلويات'], price: 50, cost_price: 22, stock: 25, description: 'تشيز كيك كلاسيكي' },
      { name: 'كرواسون', category_id: catMap['حلويات'], price: 20, cost_price: 8, stock: 40, description: 'كرواسون فرنسي' },
      { name: 'مافن بالتوت', category_id: catMap['حلويات'], price: 25, cost_price: 10, stock: 35, description: 'مافن طازج بالتوت' },
      { name: 'دونات', category_id: catMap['حلويات'], price: 18, cost_price: 7, stock: 40, description: 'دونات محلى' },
      { name: 'كوكيز شوكولاتة', category_id: catMap['حلويات'], price: 22, cost_price: 9, stock: 50, description: 'كوكيز بقطع الشوكولاتة' },

      // وجبات خفيفة
      { name: 'سندويتش تونة', category_id: catMap['وجبات خفيفة'], price: 40, cost_price: 18, stock: 30, description: 'سندويتش تونة طازج' },
      { name: 'سندويتش جبنة', category_id: catMap['وجبات خفيفة'], price: 35, cost_price: 15, stock: 35, description: 'سندويتش جبنة مشكلة' },
      { name: 'بانيني دجاج', category_id: catMap['وجبات خفيفة'], price: 50, cost_price: 22, stock: 25, description: 'بانيني دجاج مشوي' },
      { name: 'سلطة سيزر', category_id: catMap['وجبات خفيفة'], price: 45, cost_price: 20, stock: 20, description: 'سلطة سيزر طازجة' },
    ];

    for (const product of products) {
      await connection.execute(
        'INSERT INTO products (name, category_id, price, cost_price, stock, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [product.name, product.category_id, product.price, product.cost_price, product.stock, product.description, 1]
      );
      console.log(`✅ Added product: ${product.name} - ${product.price} ج.م`);
    }

    console.log('\n✅ Sample data added successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${products.length} products`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addSampleData();
