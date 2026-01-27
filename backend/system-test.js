/**
 * ====================================================
 * اختبار شامل لنظام إدارة الكافيه
 * System Full Test - Coffee Shop Management System
 * ====================================================
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let TOKEN = null;

// Test Data Storage
const testData = {
  categories: [],
  products: [],
  suppliers: [],
  warehouses: [],
  rawMaterials: [],
  inventoryPurchases: [],
  orders: [],
  expenses: [],
};

// Statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// ============================================
// Utility Functions
// ============================================

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (TOKEN) {
    config.headers.Authorization = `Bearer ${TOKEN}`;
  }
  return config;
});

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('ar-EG');
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    section: '📦',
  };
  console.log(`[${timestamp}] ${icons[type] || ''} ${message}`);
}

async function runTest(testName, testFn) {
  stats.total++;
  try {
    await testFn();
    stats.passed++;
    log(`${testName}`, 'success');
    return true;
  } catch (error) {
    stats.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    stats.errors.push({ test: testName, error: errorMsg });
    log(`${testName} - فشل: ${errorMsg}`, 'error');
    return false;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 1. Authentication
// ============================================

async function testAuthentication() {
  log('=== اختبار نظام المصادقة ===', 'section');

  await runTest('تسجيل الدخول', async () => {
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: '123456',
    });

    const token = response.data.data?.token || response.data.token;
    if (!token) throw new Error('لم يتم استلام Token');
    TOKEN = token;
  });

  await runTest('التحقق من المستخدم الحالي', async () => {
    const response = await api.get('/auth/me');
    const user = response.data.data || response.data;
    if (!user) throw new Error('لم يتم استلام بيانات المستخدم');
  });
}

// ============================================
// 2. Clean Data
// ============================================

async function cleanAllData() {
  log('=== مسح البيانات القديمة (ماعدا المستخدمين) ===', 'section');

  const cleanTasks = [
    { name: 'التنبيهات', endpoint: '/alerts', key: 'alerts' },
    { name: 'تحويلات المخزون', endpoint: '/stock-transfers', key: 'transfers' },
    { name: 'دفعات المواد', endpoint: '/material-batches', key: 'batches' },
    { name: 'مشتريات المخزون', endpoint: '/inventory-purchases', key: 'purchases' },
    { name: 'الطلبات', endpoint: '/orders', key: 'orders' },
    { name: 'الخصومات اليومية', endpoint: '/daily-discounts', key: 'data' },
    { name: 'العروض', endpoint: '/offers', key: 'data' },
    { name: 'المصروفات', endpoint: '/expenses', key: 'data' },
    { name: 'المنتجات', endpoint: '/products', key: 'data' },
    { name: 'الفئات', endpoint: '/categories', key: 'data' },
    { name: 'المواد الخام', endpoint: '/raw-materials', key: 'data' },
    { name: 'المخازن', endpoint: '/warehouses', key: 'data' },
    { name: 'الموردين', endpoint: '/suppliers', key: 'data' },
  ];

  for (const task of cleanTasks) {
    try {
      const response = await api.get(task.endpoint);
      const items = response.data[task.key] || response.data.data || response.data || [];
      const itemsArray = Array.isArray(items) ? items : [];

      for (const item of itemsArray) {
        try {
          await api.delete(`${task.endpoint}/${item.id}`);
        } catch (e) {}
      }
      if (itemsArray.length > 0) {
        log(`تم مسح ${task.name} (${itemsArray.length})`, 'info');
      }
    } catch (e) {}
  }

  log('تم مسح جميع البيانات بنجاح!', 'success');
  await delay(500);
}

// ============================================
// 3. Categories
// ============================================

async function testCategories() {
  log('=== اختبار إدارة الفئات ===', 'section');

  const categoriesToCreate = [
    { name: 'المشروبات الساخنة', description: 'قهوة، شاي' },
    { name: 'المشروبات الباردة', description: 'عصائر، سموثي' },
    { name: 'الحلويات', description: 'كيك، دونات' },
    { name: 'الوجبات الخفيفة', description: 'ساندويتشات' },
  ];

  for (const category of categoriesToCreate) {
    await runTest(`إنشاء فئة: ${category.name}`, async () => {
      const response = await api.post('/categories', category);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.categories.push({ id, ...category });
    });
  }

  await runTest('جلب جميع الفئات', async () => {
    const response = await api.get('/categories');
    const categories = response.data.data || response.data;
    if (!categories || categories.length < categoriesToCreate.length) {
      throw new Error(`عدد الفئات غير صحيح: ${categories?.length}`);
    }
  });

  await runTest('تحديث فئة', async () => {
    if (testData.categories.length === 0) throw new Error('لا توجد فئات');
    const categoryId = testData.categories[0].id;
    await api.put(`/categories/${categoryId}`, {
      name: 'المشروبات الساخنة المميزة',
      description: 'قهوة مميزة، شاي',
    });
  });
}

// ============================================
// 4. Products
// ============================================

async function testProducts() {
  log('=== اختبار إدارة المنتجات ===', 'section');

  if (testData.categories.length === 0) {
    log('تخطي اختبار المنتجات - لا توجد فئات', 'warning');
    return;
  }

  const productsToCreate = [
    { name: 'قهوة عربية', category_id: testData.categories[0].id, price: 15, cost_price: 5 },
    { name: 'كابتشينو', category_id: testData.categories[0].id, price: 20, cost_price: 7 },
    { name: 'لاتيه', category_id: testData.categories[0].id, price: 22, cost_price: 8 },
    { name: 'عصير برتقال', category_id: testData.categories[1].id, price: 18, cost_price: 6 },
    { name: 'سموثي فراولة', category_id: testData.categories[1].id, price: 25, cost_price: 10 },
    { name: 'كيكة شوكولاتة', category_id: testData.categories[2].id, price: 30, cost_price: 12 },
    { name: 'كرواسون', category_id: testData.categories[3].id, price: 12, cost_price: 4 },
  ];

  for (const product of productsToCreate) {
    await runTest(`إنشاء منتج: ${product.name}`, async () => {
      const response = await api.post('/products', product);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.products.push({ id, ...product });
    });
  }

  await runTest('جلب جميع المنتجات', async () => {
    const response = await api.get('/products');
    const products = response.data.data || response.data;
    if (!products || products.length < productsToCreate.length) {
      throw new Error(`عدد المنتجات: ${products?.length}`);
    }
  });

  await runTest('جلب المنتجات المتاحة', async () => {
    const response = await api.get('/products/available');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب منتجات حسب الفئة', async () => {
    const categoryId = testData.categories[0].id;
    const response = await api.get(`/products/category/${categoryId}`);
    const products = response.data.data || response.data;
    if (!products || products.length < 3) {
      throw new Error(`عدد منتجات الفئة: ${products?.length}`);
    }
  });
}

// ============================================
// 5. Suppliers
// ============================================

async function testSuppliers() {
  log('=== اختبار إدارة الموردين ===', 'section');

  const suppliersToCreate = [
    { name: 'مورد القهوة', contact_person: 'أحمد', phone: '0501234567', email: 'coffee@test.com', address: 'الرياض' },
    { name: 'شركة الألبان', contact_person: 'سعيد', phone: '0507654321', email: 'dairy@test.com', address: 'جدة' },
    { name: 'مخبز الحلويات', contact_person: 'خالد', phone: '0509876543', email: 'bakery@test.com', address: 'الدمام' },
  ];

  for (const supplier of suppliersToCreate) {
    await runTest(`إنشاء مورد: ${supplier.name}`, async () => {
      const response = await api.post('/suppliers', supplier);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.suppliers.push({ id, ...supplier });
    });
  }

  await runTest('جلب جميع الموردين', async () => {
    const response = await api.get('/suppliers');
    const suppliers = response.data.data || response.data;
    if (!suppliers || suppliers.length < suppliersToCreate.length) {
      throw new Error(`عدد الموردين: ${suppliers?.length}`);
    }
  });

  await runTest('جلب الموردين النشطين', async () => {
    const response = await api.get('/suppliers/active');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 6. Warehouses
// ============================================

async function testWarehouses() {
  log('=== اختبار إدارة المخازن ===', 'section');

  const warehousesToCreate = [
    { name: 'المخزن الرئيسي', location: 'الفرع الرئيسي', is_default: true },
    { name: 'مخزن الفرع الثاني', location: 'الفرع الثاني', is_default: false },
  ];

  for (const warehouse of warehousesToCreate) {
    await runTest(`إنشاء مخزن: ${warehouse.name}`, async () => {
      const response = await api.post('/warehouses', warehouse);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.warehouses.push({ id, ...warehouse });
    });
  }

  await runTest('جلب جميع المخازن', async () => {
    const response = await api.get('/warehouses');
    const warehouses = response.data.data || response.data;
    if (!warehouses || warehouses.length < warehousesToCreate.length) {
      throw new Error(`عدد المخازن: ${warehouses?.length}`);
    }
  });
}

// ============================================
// 7. Raw Materials
// ============================================

async function testRawMaterials() {
  log('=== اختبار إدارة المواد الخام ===', 'section');

  if (testData.suppliers.length === 0 || testData.warehouses.length === 0) {
    log('تخطي اختبار المواد الخام - لا يوجد موردين أو مخازن', 'warning');
    return;
  }

  const materialsToCreate = [
    { name: 'بن قهوة', unit: 'kg', current_stock: 50, min_stock: 10, cost_per_unit: 100, supplier_id: testData.suppliers[0].id, warehouse_id: testData.warehouses[0].id },
    { name: 'حليب طازج', unit: 'liter', current_stock: 100, min_stock: 20, cost_per_unit: 8, supplier_id: testData.suppliers[1].id, warehouse_id: testData.warehouses[0].id },
    { name: 'سكر', unit: 'kg', current_stock: 30, min_stock: 5, cost_per_unit: 5, supplier_id: testData.suppliers[0].id, warehouse_id: testData.warehouses[0].id },
    { name: 'شوكولاتة', unit: 'kg', current_stock: 20, min_stock: 5, cost_per_unit: 80, supplier_id: testData.suppliers[2].id, warehouse_id: testData.warehouses[0].id },
  ];

  for (const material of materialsToCreate) {
    await runTest(`إنشاء مادة خام: ${material.name}`, async () => {
      const response = await api.post('/raw-materials', material);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.rawMaterials.push({ id, ...material });
    });
  }

  await runTest('جلب جميع المواد الخام', async () => {
    const response = await api.get('/raw-materials');
    const materials = response.data.data || response.data;
    if (!materials || materials.length < materialsToCreate.length) {
      throw new Error(`عدد المواد الخام: ${materials?.length}`);
    }
  });

  await runTest('جلب المواد الخام النشطة', async () => {
    const response = await api.get('/raw-materials/active');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 8. Orders
// ============================================

async function testOrders() {
  log('=== اختبار نظام الطلبات ===', 'section');

  if (testData.products.length === 0) {
    log('تخطي اختبار الطلبات - لا توجد منتجات', 'warning');
    return;
  }

  // In-Store Order
  await runTest('إنشاء طلب داخلي (In-Store)', async () => {
    const orderData = {
      items: [
        { product_id: testData.products[0].id, quantity: 2, price: testData.products[0].price },
        { product_id: testData.products[1].id, quantity: 1, price: testData.products[1].price },
      ],
      payment_method: 'cash',
      notes: 'طلب اختباري',
    };
    const response = await api.post('/orders/in-store', orderData);
    const order = response.data.data || response.data;
    if (order?.id) testData.orders.push(order);
  });

  // Online Order
  await runTest('إنشاء طلب أونلاين', async () => {
    const orderData = {
      customer_name: 'عميل اختباري',
      customer_phone: '0501234567',
      customer_address: 'الرياض - حي النزهة - شارع الملك فهد',
      items: [
        { product_id: testData.products[3].id, quantity: 2, price: testData.products[3].price },
      ],
      payment_method: 'card',
      notes: 'طلب أونلاين',
    };
    const response = await api.post('/orders/online', orderData);
    const order = response.data.data || response.data;
    if (order?.id) testData.orders.push(order);
  });

  await runTest('جلب جميع الطلبات', async () => {
    const response = await api.get('/orders');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب عدد الطلبات المعلقة', async () => {
    const response = await api.get('/orders/pending-count');
    if (response.data === undefined) throw new Error('لا توجد بيانات');
  });

  if (testData.orders.length > 0) {
    await runTest('تحديث حالة طلب', async () => {
      const orderId = testData.orders[0].id;
      await api.put(`/orders/${orderId}/status`, { status: 'preparing' });
    });
  }
}

// ============================================
// 9. Expenses
// ============================================

async function testExpenses() {
  log('=== اختبار إدارة المصروفات ===', 'section');

  const today = new Date().toISOString().split('T')[0];
  const expensesToCreate = [
    { description: 'إيجار الشهر', amount: 5000, category: 'rent', expense_date: today },
    { description: 'فاتورة كهرباء', amount: 800, category: 'utilities', expense_date: today },
    { description: 'صيانة المعدات', amount: 500, category: 'maintenance', expense_date: today },
  ];

  for (const expense of expensesToCreate) {
    await runTest(`إنشاء مصروف: ${expense.description}`, async () => {
      const response = await api.post('/expenses', expense);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.expenses.push({ id, ...expense });
    });
  }

  await runTest('جلب جميع المصروفات', async () => {
    const response = await api.get('/expenses');
    const expenses = response.data.data || response.data;
    if (!expenses || expenses.length < expensesToCreate.length) {
      throw new Error(`عدد المصروفات: ${expenses?.length}`);
    }
  });

  await runTest('جلب إجمالي المصروفات', async () => {
    const response = await api.get('/expenses/total');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 10. Reports
// ============================================

async function testReports() {
  log('=== اختبار التقارير ===', 'section');

  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await runTest('تقرير لوحة التحكم', async () => {
    const response = await api.get('/reports/dashboard');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('تقرير المبيعات', async () => {
    const response = await api.get('/reports/sales', {
      params: { start_date: lastMonth, end_date: today },
    });
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('تقرير المنتجات', async () => {
    const response = await api.get('/reports/products');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('تقرير الأرباح', async () => {
    const response = await api.get('/reports/profit', {
      params: { start_date: lastMonth, end_date: today },
    });
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 11. Inventory Reports
// ============================================

async function testInventoryReports() {
  log('=== اختبار تقارير المخزون ===', 'section');

  await runTest('إحصائيات المخزون', async () => {
    const response = await api.get('/reports/inventory/dashboard-stats');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('تقرير المخازن', async () => {
    const response = await api.get('/reports/inventory/warehouses');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('ملخص المواد الخام', async () => {
    const response = await api.get('/reports/inventory/materials/summary');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('ملخص الموردين', async () => {
    const response = await api.get('/reports/inventory/suppliers/summary');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 12. Material Batches
// ============================================

async function testMaterialBatches() {
  log('=== اختبار دفعات المواد ===', 'section');

  await runTest('جلب إحصائيات الدفعات', async () => {
    const response = await api.get('/material-batches/stats');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب الدفعات القريبة من الانتهاء', async () => {
    const response = await api.get('/material-batches/expiring', { params: { days: 30 } });
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 13. Stock Transfers
// ============================================

async function testStockTransfers() {
  log('=== اختبار تحويلات المخزون ===', 'section');

  await runTest('جلب تحويلات المخزون', async () => {
    const response = await api.get('/stock-transfers');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب إحصائيات التحويلات', async () => {
    const response = await api.get('/stock-transfers/stats');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 14. Alerts
// ============================================

async function testAlerts() {
  log('=== اختبار نظام التنبيهات ===', 'section');

  await runTest('جلب التنبيهات', async () => {
    const response = await api.get('/alerts');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// 15. Users (Read Only)
// ============================================

async function testUsers() {
  log('=== اختبار إدارة المستخدمين ===', 'section');

  await runTest('جلب جميع المستخدمين', async () => {
    const response = await api.get('/users');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ============================================
// Summary
// ============================================

function printSummary() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           📊 ملخص نتائج الاختبار الشامل                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  إجمالي الاختبارات:    ${String(stats.total).padStart(4)} اختبار                      ║`);
  console.log(`║  ✅ نجح:               ${String(stats.passed).padStart(4)} اختبار                      ║`);
  console.log(`║  ❌ فشل:               ${String(stats.failed).padStart(4)} اختبار                      ║`);
  console.log(`║  نسبة النجاح:          ${String(Math.round((stats.passed / stats.total) * 100)).padStart(3)}%                           ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (stats.errors.length > 0) {
    console.log('\n❌ الاختبارات الفاشلة:');
    console.log('─'.repeat(60));
    stats.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.test}`);
      console.log(`   السبب: ${err.error}`);
    });
  }

  console.log('\n');
  if (stats.failed === 0) {
    console.log('🎉 تهانينا! جميع الاختبارات نجحت بنجاح!');
    console.log('✨ النظام يعمل بشكل ممتاز وكل الوحدات متصلة ببعضها.');
  } else if (stats.passed / stats.total >= 0.8) {
    console.log('👍 أداء جيد! معظم الاختبارات نجحت.');
  } else {
    console.log('⚠️ يوجد بعض المشاكل، يرجى مراجعة الأخطاء أعلاه.');
  }
}

// ============================================
// Main
// ============================================

async function runAllTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       🧪 اختبار شامل لنظام إدارة الكافيه                 ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  1️⃣  تسجيل الدخول                                        ║');
  console.log('║  2️⃣  مسح البيانات (ماعدا المستخدمين)                     ║');
  console.log('║  3️⃣  اختبار جميع وحدات النظام                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // 1. Authentication
    await testAuthentication();
    if (!TOKEN) {
      console.log('❌ فشل تسجيل الدخول');
      process.exit(1);
    }

    // 2. Clean data
    await cleanAllData();

    // 3. Run tests in order (dependencies matter)
    await testCategories();
    await testProducts();
    await testSuppliers();
    await testWarehouses();
    await testRawMaterials();
    await testOrders();
    await testExpenses();
    await testReports();
    await testInventoryReports();
    await testMaterialBatches();
    await testStockTransfers();
    await testAlerts();
    await testUsers();

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\n❌ خطأ غير متوقع:', error.message);
    process.exit(1);
  }
}

runAllTests();
