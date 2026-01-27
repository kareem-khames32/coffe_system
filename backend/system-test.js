/**
 * ════════════════════════════════════════════════════════════════
 * اختبار شامل لنظام إدارة الكافيه - سير العمل الكامل
 * Comprehensive Coffee Shop System Test - Full Workflow
 * ════════════════════════════════════════════════════════════════
 *
 * هذا الاختبار يحاكي سير العمل الحقيقي:
 * 1. إنشاء المخازن
 * 2. إنشاء الموردين
 * 3. إنشاء المواد الخام (بدون مخزون)
 * 4. شراء مواد خام (يزيد المخزون)
 * 5. إنشاء الفئات والمنتجات
 * 6. ربط المنتجات بالمواد الخام (الوصفات)
 * 7. إنشاء طلبات (يخصم من المخزون)
 * 8. التحقق من صحة كل العمليات
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let TOKEN = null;

// Test Data Storage
const testData = {
  warehouses: [],
  suppliers: [],
  rawMaterials: [],
  inventoryPurchases: [],
  categories: [],
  products: [],
  orders: [],
  expenses: [],
  stockBeforeOrder: {},
  stockAfterOrder: {},
};

// Statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// ════════════════════════════════════════════════════════════════
// Utility Functions
// ════════════════════════════════════════════════════════════════

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
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    section: '📦',
    verify: '🔍',
    money: '💰',
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

// ════════════════════════════════════════════════════════════════
// 1. Authentication
// ════════════════════════════════════════════════════════════════

async function testAuthentication() {
  log('═══ نظام المصادقة ═══', 'section');

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

// ════════════════════════════════════════════════════════════════
// 2. Clean All Data (Except Users)
// ════════════════════════════════════════════════════════════════

async function cleanAllData() {
  log('═══ مسح البيانات القديمة ═══', 'section');

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

  log('تم مسح جميع البيانات!', 'success');
  await delay(500);
}

// ════════════════════════════════════════════════════════════════
// 3. Warehouses (المخازن)
// ════════════════════════════════════════════════════════════════

async function testWarehouses() {
  log('═══ إنشاء المخازن ═══', 'section');

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
}

// ════════════════════════════════════════════════════════════════
// 4. Suppliers (الموردين)
// ════════════════════════════════════════════════════════════════

async function testSuppliers() {
  log('═══ إنشاء الموردين ═══', 'section');

  const suppliersToCreate = [
    { name: 'مورد القهوة', contact_person: 'أحمد محمد', phone: '0501234567', email: 'coffee@test.com', address: 'الرياض' },
    { name: 'شركة الألبان', contact_person: 'سعيد علي', phone: '0507654321', email: 'dairy@test.com', address: 'جدة' },
    { name: 'مخبز الحلويات', contact_person: 'خالد عمر', phone: '0509876543', email: 'bakery@test.com', address: 'الدمام' },
  ];

  for (const supplier of suppliersToCreate) {
    await runTest(`إنشاء مورد: ${supplier.name}`, async () => {
      const response = await api.post('/suppliers', supplier);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.suppliers.push({ id, ...supplier });
    });
  }
}

// ════════════════════════════════════════════════════════════════
// 5. Raw Materials (المواد الخام) - بدون مخزون
// ════════════════════════════════════════════════════════════════

async function testRawMaterials() {
  log('═══ إنشاء المواد الخام (بدون مخزون) ═══', 'section');

  if (testData.suppliers.length === 0 || testData.warehouses.length === 0) {
    log('تخطي - لا يوجد موردين أو مخازن', 'warning');
    return;
  }

  const materialsToCreate = [
    { name: 'بن قهوة عربي', unit: 'kg', current_stock: 0, min_stock: 5, cost_per_unit: 100, supplier_id: testData.suppliers[0].id, warehouse_id: testData.warehouses[0].id },
    { name: 'حليب طازج', unit: 'liter', current_stock: 0, min_stock: 10, cost_per_unit: 8, supplier_id: testData.suppliers[1].id, warehouse_id: testData.warehouses[0].id },
    { name: 'سكر أبيض', unit: 'kg', current_stock: 0, min_stock: 5, cost_per_unit: 5, supplier_id: testData.suppliers[0].id, warehouse_id: testData.warehouses[0].id },
    { name: 'شوكولاتة', unit: 'kg', current_stock: 0, min_stock: 3, cost_per_unit: 80, supplier_id: testData.suppliers[2].id, warehouse_id: testData.warehouses[0].id },
    { name: 'كريمة خفق', unit: 'liter', current_stock: 0, min_stock: 5, cost_per_unit: 15, supplier_id: testData.suppliers[1].id, warehouse_id: testData.warehouses[0].id },
  ];

  for (const material of materialsToCreate) {
    await runTest(`إنشاء مادة خام: ${material.name}`, async () => {
      const response = await api.post('/raw-materials', material);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.rawMaterials.push({ id, ...material });
    });
  }

  // Verify our created materials have 0 stock
  await runTest('التحقق أن المخزون = 0', async () => {
    for (const mat of testData.rawMaterials) {
      const response = await api.get(`/raw-materials/${mat.id}`);
      const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock || 0);
      if (stock !== 0) {
        throw new Error(`المادة ${mat.name} لديها مخزون ${stock} بدلاً من 0`);
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════
// 6. Inventory Purchases (شراء المواد الخام)
// ════════════════════════════════════════════════════════════════

async function testInventoryPurchases() {
  log('═══ شراء المواد الخام (زيادة المخزون) ═══', 'section');

  if (testData.rawMaterials.length === 0) {
    log('تخطي - لا توجد مواد خام', 'warning');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Purchase 1: Coffee and Sugar
  await runTest('شراء بن قهوة وسكر', async () => {
    const purchaseData = {
      supplier_id: testData.suppliers[0].id,
      warehouse_id: testData.warehouses[0].id,
      purchase_date: today,
      invoice_number: 'INV-001',
      payment_terms: 'cash',
      items: [
        { raw_material_id: testData.rawMaterials[0].id, quantity: 20, unit: 'kg', unit_cost: 100 }, // بن قهوة
        { raw_material_id: testData.rawMaterials[2].id, quantity: 15, unit: 'kg', unit_cost: 5 },  // سكر
      ],
    };
    const response = await api.post('/inventory-purchases', purchaseData);
    if (!response.data.success) throw new Error(response.data.message);
    testData.inventoryPurchases.push(response.data.data);
  });

  // Purchase 2: Milk and Cream
  await runTest('شراء حليب وكريمة', async () => {
    const purchaseData = {
      supplier_id: testData.suppliers[1].id,
      warehouse_id: testData.warehouses[0].id,
      purchase_date: today,
      invoice_number: 'INV-002',
      payment_terms: 'cash',
      items: [
        { raw_material_id: testData.rawMaterials[1].id, quantity: 50, unit: 'liter', unit_cost: 8 },  // حليب
        { raw_material_id: testData.rawMaterials[4].id, quantity: 20, unit: 'liter', unit_cost: 15 }, // كريمة
      ],
    };
    const response = await api.post('/inventory-purchases', purchaseData);
    if (!response.data.success) throw new Error(response.data.message);
    testData.inventoryPurchases.push(response.data.data);
  });

  // Purchase 3: Chocolate
  await runTest('شراء شوكولاتة', async () => {
    const purchaseData = {
      supplier_id: testData.suppliers[2].id,
      warehouse_id: testData.warehouses[0].id,
      purchase_date: today,
      invoice_number: 'INV-003',
      payment_terms: 'cash',
      items: [
        { raw_material_id: testData.rawMaterials[3].id, quantity: 10, unit: 'kg', unit_cost: 80 }, // شوكولاتة
      ],
    };
    const response = await api.post('/inventory-purchases', purchaseData);
    if (!response.data.success) throw new Error(response.data.message);
    testData.inventoryPurchases.push(response.data.data);
  });

  // Verify stock increased
  log('═══ التحقق من زيادة المخزون ═══', 'verify');

  await runTest('التحقق: بن قهوة = 20 kg', async () => {
    const response = await api.get(`/raw-materials/${testData.rawMaterials[0].id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    if (stock !== 20) throw new Error(`المخزون ${stock} بدلاً من 20`);
  });

  await runTest('التحقق: حليب = 50 liter', async () => {
    const response = await api.get(`/raw-materials/${testData.rawMaterials[1].id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    if (stock !== 50) throw new Error(`المخزون ${stock} بدلاً من 50`);
  });

  await runTest('التحقق: سكر = 15 kg', async () => {
    const response = await api.get(`/raw-materials/${testData.rawMaterials[2].id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    if (stock !== 15) throw new Error(`المخزون ${stock} بدلاً من 15`);
  });

  await runTest('التحقق: شوكولاتة = 10 kg', async () => {
    const response = await api.get(`/raw-materials/${testData.rawMaterials[3].id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    if (stock !== 10) throw new Error(`المخزون ${stock} بدلاً من 10`);
  });

  await runTest('التحقق: كريمة = 20 liter', async () => {
    const response = await api.get(`/raw-materials/${testData.rawMaterials[4].id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    if (stock !== 20) throw new Error(`المخزون ${stock} بدلاً من 20`);
  });
}

// ════════════════════════════════════════════════════════════════
// 7. Categories (الفئات)
// ════════════════════════════════════════════════════════════════

async function testCategories() {
  log('═══ إنشاء الفئات ═══', 'section');

  const categoriesToCreate = [
    { name: 'المشروبات الساخنة', description: 'قهوة، شاي، كابتشينو' },
    { name: 'المشروبات الباردة', description: 'عصائر، سموثي، آيس كوفي' },
    { name: 'الحلويات', description: 'كيك، موكا، شوكولاتة' },
  ];

  for (const category of categoriesToCreate) {
    await runTest(`إنشاء فئة: ${category.name}`, async () => {
      const response = await api.post('/categories', category);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.categories.push({ id, ...category });
    });
  }
}

// ════════════════════════════════════════════════════════════════
// 8. Products (المنتجات)
// ════════════════════════════════════════════════════════════════

async function testProducts() {
  log('═══ إنشاء المنتجات ═══', 'section');

  if (testData.categories.length === 0) {
    log('تخطي - لا توجد فئات', 'warning');
    return;
  }

  const productsToCreate = [
    { name: 'قهوة عربية', category_id: testData.categories[0].id, price: 15, cost_price: 0 },
    { name: 'كابتشينو', category_id: testData.categories[0].id, price: 20, cost_price: 0 },
    { name: 'لاتيه', category_id: testData.categories[0].id, price: 22, cost_price: 0 },
    { name: 'موكا', category_id: testData.categories[0].id, price: 25, cost_price: 0 },
    { name: 'هوت شوكليت', category_id: testData.categories[0].id, price: 18, cost_price: 0 },
  ];

  for (const product of productsToCreate) {
    await runTest(`إنشاء منتج: ${product.name}`, async () => {
      const response = await api.post('/products', product);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.products.push({ id, ...product });
    });
  }
}

// ════════════════════════════════════════════════════════════════
// 9. Product Recipes (وصفات المنتجات - ربط المنتج بالمواد الخام)
// ════════════════════════════════════════════════════════════════

async function testProductRecipes() {
  log('═══ إضافة وصفات المنتجات ═══', 'section');

  if (testData.products.length === 0 || testData.rawMaterials.length === 0) {
    log('تخطي - لا توجد منتجات أو مواد خام', 'warning');
    return;
  }

  // Coffee recipe: 0.02 kg coffee + 0.01 kg sugar
  await runTest('وصفة: قهوة عربية', async () => {
    const recipe = [
      { raw_material_id: testData.rawMaterials[0].id, quantity_needed: 0.02, unit: 'kg' }, // بن قهوة
      { raw_material_id: testData.rawMaterials[2].id, quantity_needed: 0.01, unit: 'kg' }, // سكر
    ];
    await api.put(`/product-recipes/product/${testData.products[0].id}`, { recipe });
  });

  // Cappuccino recipe: 0.02 kg coffee + 0.1 liter milk + 0.01 kg sugar
  await runTest('وصفة: كابتشينو', async () => {
    const recipe = [
      { raw_material_id: testData.rawMaterials[0].id, quantity_needed: 0.02, unit: 'kg' },   // بن قهوة
      { raw_material_id: testData.rawMaterials[1].id, quantity_needed: 0.1, unit: 'liter' }, // حليب
      { raw_material_id: testData.rawMaterials[2].id, quantity_needed: 0.01, unit: 'kg' },  // سكر
    ];
    await api.put(`/product-recipes/product/${testData.products[1].id}`, { recipe });
  });

  // Latte recipe: 0.02 kg coffee + 0.15 liter milk
  await runTest('وصفة: لاتيه', async () => {
    const recipe = [
      { raw_material_id: testData.rawMaterials[0].id, quantity_needed: 0.02, unit: 'kg' },    // بن قهوة
      { raw_material_id: testData.rawMaterials[1].id, quantity_needed: 0.15, unit: 'liter' }, // حليب
    ];
    await api.put(`/product-recipes/product/${testData.products[2].id}`, { recipe });
  });

  // Mocha recipe: 0.02 kg coffee + 0.1 liter milk + 0.02 kg chocolate + 0.02 liter cream
  await runTest('وصفة: موكا', async () => {
    const recipe = [
      { raw_material_id: testData.rawMaterials[0].id, quantity_needed: 0.02, unit: 'kg' },    // بن قهوة
      { raw_material_id: testData.rawMaterials[1].id, quantity_needed: 0.1, unit: 'liter' },  // حليب
      { raw_material_id: testData.rawMaterials[3].id, quantity_needed: 0.02, unit: 'kg' },    // شوكولاتة
      { raw_material_id: testData.rawMaterials[4].id, quantity_needed: 0.02, unit: 'liter' }, // كريمة
    ];
    await api.put(`/product-recipes/product/${testData.products[3].id}`, { recipe });
  });

  // Hot chocolate recipe: 0.03 kg chocolate + 0.15 liter milk + 0.01 kg sugar
  await runTest('وصفة: هوت شوكليت', async () => {
    const recipe = [
      { raw_material_id: testData.rawMaterials[3].id, quantity_needed: 0.03, unit: 'kg' },    // شوكولاتة
      { raw_material_id: testData.rawMaterials[1].id, quantity_needed: 0.15, unit: 'liter' }, // حليب
      { raw_material_id: testData.rawMaterials[2].id, quantity_needed: 0.01, unit: 'kg' },    // سكر
    ];
    await api.put(`/product-recipes/product/${testData.products[4].id}`, { recipe });
  });

  // Verify recipes
  await runTest('التحقق من وصفة الكابتشينو', async () => {
    const response = await api.get(`/product-recipes/product/${testData.products[1].id}`);
    const recipe = response.data.data || response.data;
    if (!recipe || recipe.length !== 3) {
      throw new Error(`عدد المكونات ${recipe?.length} بدلاً من 3`);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// 10. Stock Check & Orders (فحص المخزون وإنشاء الطلبات)
// ════════════════════════════════════════════════════════════════

async function testOrdersAndStockDeduction() {
  log('═══ اختبار الطلبات وخصم المخزون ═══', 'section');

  if (testData.products.length === 0) {
    log('تخطي - لا توجد منتجات', 'warning');
    return;
  }

  // Save stock before orders
  log('حفظ المخزون قبل الطلبات...', 'info');
  for (const material of testData.rawMaterials) {
    const response = await api.get(`/raw-materials/${material.id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    testData.stockBeforeOrder[material.id] = stock;
  }

  // Check stock availability
  await runTest('فحص توفر المخزون للطلب', async () => {
    const response = await api.post('/product-recipes/check-stock', {
      items: [
        { product_id: testData.products[1].id, quantity: 5 }, // 5 كابتشينو
        { product_id: testData.products[3].id, quantity: 3 }, // 3 موكا
      ],
    });
    if (!response.data.available) {
      throw new Error('المخزون غير كافي');
    }
  });

  // Create Order 1: 5 Cappuccinos + 3 Mochas
  await runTest('إنشاء طلب: 5 كابتشينو + 3 موكا', async () => {
    const orderData = {
      items: [
        { product_id: testData.products[1].id, quantity: 5, price: testData.products[1].price },
        { product_id: testData.products[3].id, quantity: 3, price: testData.products[3].price },
      ],
      payment_method: 'cash',
      notes: 'طلب اختباري 1',
    };
    const response = await api.post('/orders/in-store', orderData);
    const order = response.data.data || response.data;
    if (!order?.id) throw new Error('لم يتم إنشاء الطلب');
    testData.orders.push(order);
  });

  // Create Order 2: 10 Arabic Coffee + 2 Lattes
  await runTest('إنشاء طلب: 10 قهوة عربية + 2 لاتيه', async () => {
    const orderData = {
      items: [
        { product_id: testData.products[0].id, quantity: 10, price: testData.products[0].price },
        { product_id: testData.products[2].id, quantity: 2, price: testData.products[2].price },
      ],
      payment_method: 'card',
      notes: 'طلب اختباري 2',
    };
    const response = await api.post('/orders/in-store', orderData);
    const order = response.data.data || response.data;
    if (!order?.id) throw new Error('لم يتم إنشاء الطلب');
    testData.orders.push(order);
  });

  // Create Order 3: 5 Hot Chocolate
  await runTest('إنشاء طلب: 5 هوت شوكليت', async () => {
    const orderData = {
      items: [
        { product_id: testData.products[4].id, quantity: 5, price: testData.products[4].price },
      ],
      payment_method: 'cash',
      notes: 'طلب اختباري 3',
    };
    const response = await api.post('/orders/in-store', orderData);
    const order = response.data.data || response.data;
    if (!order?.id) throw new Error('لم يتم إنشاء الطلب');
    testData.orders.push(order);
  });

  // Wait for stock deduction
  await delay(500);

  // Save stock after orders
  log('حفظ المخزون بعد الطلبات...', 'info');
  for (const material of testData.rawMaterials) {
    const response = await api.get(`/raw-materials/${material.id}`);
    const stock = parseFloat(response.data.data?.current_stock || response.data.current_stock);
    testData.stockAfterOrder[material.id] = stock;
  }

  // Verify stock deduction
  log('═══ التحقق من خصم المخزون ═══', 'verify');

  /*
   * Expected deductions:
   * Order 1: 5 Cappuccino + 3 Mocha
   *   - Coffee: 5*0.02 + 3*0.02 = 0.16 kg
   *   - Milk: 5*0.1 + 3*0.1 = 0.8 liter
   *   - Sugar: 5*0.01 = 0.05 kg
   *   - Chocolate: 3*0.02 = 0.06 kg
   *   - Cream: 3*0.02 = 0.06 liter
   *
   * Order 2: 10 Arabic Coffee + 2 Latte
   *   - Coffee: 10*0.02 + 2*0.02 = 0.24 kg
   *   - Sugar: 10*0.01 = 0.1 kg
   *   - Milk: 2*0.15 = 0.3 liter
   *
   * Order 3: 5 Hot Chocolate
   *   - Chocolate: 5*0.03 = 0.15 kg
   *   - Milk: 5*0.15 = 0.75 liter
   *   - Sugar: 5*0.01 = 0.05 kg
   *
   * Total deductions:
   *   - Coffee: 0.16 + 0.24 = 0.4 kg (20 - 0.4 = 19.6)
   *   - Milk: 0.8 + 0.3 + 0.75 = 1.85 liter (50 - 1.85 = 48.15)
   *   - Sugar: 0.05 + 0.1 + 0.05 = 0.2 kg (15 - 0.2 = 14.8)
   *   - Chocolate: 0.06 + 0.15 = 0.21 kg (10 - 0.21 = 9.79)
   *   - Cream: 0.06 liter (20 - 0.06 = 19.94)
   */

  await runTest('التحقق: خصم بن القهوة (المتوقع: 19.6 kg)', async () => {
    const before = testData.stockBeforeOrder[testData.rawMaterials[0].id];
    const after = testData.stockAfterOrder[testData.rawMaterials[0].id];
    const deducted = before - after;
    const expectedDeduction = 0.4; // 0.16 + 0.24

    log(`   قبل: ${before} | بعد: ${after} | خصم: ${deducted.toFixed(3)}`, 'info');

    if (Math.abs(deducted - expectedDeduction) > 0.01) {
      throw new Error(`الخصم ${deducted.toFixed(3)} بدلاً من ${expectedDeduction}`);
    }
  });

  await runTest('التحقق: خصم الحليب (المتوقع: 48.15 liter)', async () => {
    const before = testData.stockBeforeOrder[testData.rawMaterials[1].id];
    const after = testData.stockAfterOrder[testData.rawMaterials[1].id];
    const deducted = before - after;
    const expectedDeduction = 1.85; // 0.8 + 0.3 + 0.75

    log(`   قبل: ${before} | بعد: ${after} | خصم: ${deducted.toFixed(3)}`, 'info');

    if (Math.abs(deducted - expectedDeduction) > 0.01) {
      throw new Error(`الخصم ${deducted.toFixed(3)} بدلاً من ${expectedDeduction}`);
    }
  });

  await runTest('التحقق: خصم السكر (المتوقع: 14.8 kg)', async () => {
    const before = testData.stockBeforeOrder[testData.rawMaterials[2].id];
    const after = testData.stockAfterOrder[testData.rawMaterials[2].id];
    const deducted = before - after;
    const expectedDeduction = 0.2; // 0.05 + 0.1 + 0.05

    log(`   قبل: ${before} | بعد: ${after} | خصم: ${deducted.toFixed(3)}`, 'info');

    if (Math.abs(deducted - expectedDeduction) > 0.01) {
      throw new Error(`الخصم ${deducted.toFixed(3)} بدلاً من ${expectedDeduction}`);
    }
  });

  await runTest('التحقق: خصم الشوكولاتة (المتوقع: 9.79 kg)', async () => {
    const before = testData.stockBeforeOrder[testData.rawMaterials[3].id];
    const after = testData.stockAfterOrder[testData.rawMaterials[3].id];
    const deducted = before - after;
    const expectedDeduction = 0.21; // 0.06 + 0.15

    log(`   قبل: ${before} | بعد: ${after} | خصم: ${deducted.toFixed(3)}`, 'info');

    if (Math.abs(deducted - expectedDeduction) > 0.01) {
      throw new Error(`الخصم ${deducted.toFixed(3)} بدلاً من ${expectedDeduction}`);
    }
  });

  await runTest('التحقق: خصم الكريمة (المتوقع: 19.94 liter)', async () => {
    const before = testData.stockBeforeOrder[testData.rawMaterials[4].id];
    const after = testData.stockAfterOrder[testData.rawMaterials[4].id];
    const deducted = before - after;
    const expectedDeduction = 0.06;

    log(`   قبل: ${before} | بعد: ${after} | خصم: ${deducted.toFixed(3)}`, 'info');

    if (Math.abs(deducted - expectedDeduction) > 0.01) {
      throw new Error(`الخصم ${deducted.toFixed(3)} بدلاً من ${expectedDeduction}`);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// 11. Expenses (المصروفات)
// ════════════════════════════════════════════════════════════════

async function testExpenses() {
  log('═══ إدارة المصروفات ═══', 'section');

  const today = new Date().toISOString().split('T')[0];
  const expensesToCreate = [
    { description: 'إيجار الشهر', amount: 5000, category: 'rent', expense_date: today },
    { description: 'فاتورة كهرباء', amount: 800, category: 'utilities', expense_date: today },
    { description: 'صيانة ماكينة القهوة', amount: 300, category: 'maintenance', expense_date: today },
  ];

  for (const expense of expensesToCreate) {
    await runTest(`إنشاء مصروف: ${expense.description}`, async () => {
      const response = await api.post('/expenses', expense);
      const id = response.data.data?.id || response.data.id;
      if (!id) throw new Error('لم يتم الحصول على ID');
      testData.expenses.push({ id, ...expense });
    });
  }

  await runTest('جلب إجمالي المصروفات', async () => {
    const response = await api.get('/expenses/total');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ════════════════════════════════════════════════════════════════
// 12. Reports (التقارير)
// ════════════════════════════════════════════════════════════════

async function testReports() {
  log('═══ التقارير ═══', 'section');

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

  await runTest('تقرير الأرباح', async () => {
    const response = await api.get('/reports/profit', {
      params: { start_date: lastMonth, end_date: today },
    });
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('إحصائيات المخزون', async () => {
    const response = await api.get('/reports/inventory/dashboard-stats');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ════════════════════════════════════════════════════════════════
// 13. Other Systems
// ════════════════════════════════════════════════════════════════

async function testOtherSystems() {
  log('═══ أنظمة أخرى ═══', 'section');

  await runTest('جلب التنبيهات', async () => {
    const response = await api.get('/alerts');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب تحويلات المخزون', async () => {
    const response = await api.get('/stock-transfers');
    if (!response.data) throw new Error('لا توجد بيانات');
  });

  await runTest('جلب المستخدمين', async () => {
    const response = await api.get('/users');
    if (!response.data) throw new Error('لا توجد بيانات');
  });
}

// ════════════════════════════════════════════════════════════════
// Summary
// ════════════════════════════════════════════════════════════════

function printSummary() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              📊 ملخص نتائج الاختبار الشامل                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  إجمالي الاختبارات:     ${String(stats.total).padStart(4)} اختبار                          ║`);
  console.log(`║  ✅ نجح:                ${String(stats.passed).padStart(4)} اختبار                          ║`);
  console.log(`║  ❌ فشل:                ${String(stats.failed).padStart(4)} اختبار                          ║`);
  console.log(`║  نسبة النجاح:           ${String(Math.round((stats.passed / stats.total) * 100)).padStart(3)}%                               ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  if (stats.errors.length > 0) {
    console.log('\n❌ الاختبارات الفاشلة:');
    console.log('─'.repeat(65));
    stats.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.test}`);
      console.log(`   السبب: ${err.error}`);
    });
  }

  console.log('\n');

  // Print stock summary
  if (Object.keys(testData.stockBeforeOrder).length > 0) {
    console.log('📦 ملخص حركة المخزون:');
    console.log('─'.repeat(65));
    console.log('المادة الخام'.padEnd(20) + 'قبل'.padStart(10) + 'بعد'.padStart(10) + 'الخصم'.padStart(10));
    console.log('─'.repeat(65));

    testData.rawMaterials.forEach(mat => {
      const before = testData.stockBeforeOrder[mat.id] || 0;
      const after = testData.stockAfterOrder[mat.id] || 0;
      const deducted = before - after;
      console.log(
        mat.name.padEnd(20) +
        before.toFixed(2).padStart(10) +
        after.toFixed(2).padStart(10) +
        deducted.toFixed(2).padStart(10)
      );
    });
    console.log('─'.repeat(65));
  }

  console.log('\n');
  if (stats.failed === 0) {
    console.log('🎉 تهانينا! جميع الاختبارات نجحت!');
    console.log('✨ النظام يعمل بشكل صحيح:');
    console.log('   • المخازن والموردين ✓');
    console.log('   • المواد الخام ✓');
    console.log('   • شراء المخزون (زيادة الكمية) ✓');
    console.log('   • المنتجات والوصفات ✓');
    console.log('   • الطلبات (خصم المخزون) ✓');
    console.log('   • المصروفات والتقارير ✓');
  } else if (stats.passed / stats.total >= 0.8) {
    console.log('👍 أداء جيد! معظم الاختبارات نجحت.');
  } else {
    console.log('⚠️ يوجد مشاكل في النظام، راجع الأخطاء أعلاه.');
  }
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 اختبار شامل لنظام إدارة الكافيه                      ║');
  console.log('║           Full Workflow Integration Test                       ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  الخطوات:                                                      ║');
  console.log('║  1️⃣  تسجيل الدخول                                              ║');
  console.log('║  2️⃣  مسح البيانات القديمة                                      ║');
  console.log('║  3️⃣  إنشاء المخازن والموردين                                   ║');
  console.log('║  4️⃣  إنشاء المواد الخام (مخزون = 0)                            ║');
  console.log('║  5️⃣  شراء مواد خام (زيادة المخزون)                             ║');
  console.log('║  6️⃣  إنشاء الفئات والمنتجات                                    ║');
  console.log('║  7️⃣  ربط المنتجات بالمواد الخام (الوصفات)                      ║');
  console.log('║  8️⃣  إنشاء طلبات (خصم المخزون)                                 ║');
  console.log('║  9️⃣  التحقق من صحة الخصم                                       ║');
  console.log('║  🔟 اختبار باقي الأنظمة                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
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

    // 3-9. Run workflow tests in order
    await testWarehouses();
    await testSuppliers();
    await testRawMaterials();
    await testInventoryPurchases();
    await testCategories();
    await testProducts();
    await testProductRecipes();
    await testOrdersAndStockDeduction();
    await testExpenses();
    await testReports();
    await testOtherSystems();

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\n❌ خطأ غير متوقع:', error.message);
    process.exit(1);
  }
}

runAllTests();
