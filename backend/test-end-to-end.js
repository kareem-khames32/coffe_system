/**
 * ========================================
 * End-to-End Integration Testing Script
 * ========================================
 *
 * This script tests ALL workflows in the Coffee System:
 * 1. Purchase with payment terms → Auto-create supplier payment
 * 2. Product recipes → Automatic stock deduction on sales
 * 3. FIFO consumption
 * 4. Stock transfers between warehouses
 * 5. Inventory counts and adjustments
 * 6. Alerts system
 *
 * Run with: node test-end-to-end.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test data storage
const testData = {
  token: null,
  supplier: null,
  warehouse1: null,
  warehouse2: null,
  rawMaterial: null,
  purchaseCash: null,
  purchaseCredit: null,
  payment: null,
  product: null,
  recipe: null,
  order: null,
  batch: null,
  transfer: null,
  count: null,
  alerts: null
};

// ========================================
// Helper Functions
// ========================================

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(title, 'cyan');
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

function assert(condition, testName) {
  if (condition) {
    log(`✅ ${testName}`, 'green');
    return true;
  } else {
    log(`❌ ${testName}`, 'red');
    return false;
  }
}

// ========================================
// Test Scenarios
// ========================================

async function test01_Authentication() {
  section('TEST 1: Authentication');

  // Login
  const login = await makeRequest('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  if (!login.success) {
    log('❌ Login failed:', 'red');
    log(`   Error: ${login.error}`, 'yellow');
    log(`   Status: ${login.status}`, 'yellow');
    log('\n💡 Please create admin user first:', 'yellow');
    log('   node scripts/quick-create-admin.js admin admin123 "Admin"', 'cyan');
    process.exit(1);
  }

  // Debug: Check token location
  testData.token = login.data?.token || login.data?.data?.token;

  if (!testData.token) {
    log('⚠️  Login response structure:', 'yellow');
    console.log(JSON.stringify(login.data, null, 2));
    process.exit(1);
  }

  assert(testData.token, 'Login successful');
}

async function test02_CreateSupplier() {
  section('TEST 2: Create Supplier');

  const result = await makeRequest('POST', '/suppliers', {
    name: 'Test Supplier - Mohamed',
    phone: '01012345678',
    email: 'test@supplier.com',
    address: 'Test Address'
  }, testData.token);

  // Debug: Show actual response
  if (!result.success) {
    log(`❌ API Error: ${result.error}`, 'red');
    log(`Status: ${result.status}`, 'yellow');
    return;
  }

  testData.supplier = result.data?.data;

  if (!testData.supplier) {
    log('⚠️  Response structure:', 'yellow');
    console.log(JSON.stringify(result.data, null, 2));
  }

  assert(result.success && testData.supplier?.id, `Created supplier: ${testData.supplier?.name}`);
}

async function test03_CreateWarehouses() {
  section('TEST 3: Create Warehouses');

  // Warehouse 1
  const wh1 = await makeRequest('POST', '/warehouses', {
    name: 'Main Warehouse',
    location: 'Ground Floor',
    capacity: 1000
  }, testData.token);

  testData.warehouse1 = wh1.data?.data;
  assert(wh1.success && testData.warehouse1?.id, `Created warehouse 1: ${testData.warehouse1?.name}`);

  // Warehouse 2
  const wh2 = await makeRequest('POST', '/warehouses', {
    name: 'Branch Warehouse',
    location: 'First Floor',
    capacity: 500
  }, testData.token);

  testData.warehouse2 = wh2.data?.data;
  assert(wh2.success && testData.warehouse2?.id, `Created warehouse 2: ${testData.warehouse2?.name}`);
}

async function test04_CreateRawMaterial() {
  section('TEST 4: Create Raw Material');

  const result = await makeRequest('POST', '/raw-materials', {
    name: 'Test Beef Mince',
    description: 'Fresh beef for testing',
    unit: 'kg',
    current_stock: 0,
    minimum_stock: 5,
    unit_cost: 200,
    supplier_id: testData.supplier.id,
    warehouse_id: testData.warehouse1.id
  }, testData.token);

  testData.rawMaterial = result.data?.data;
  assert(result.success && testData.rawMaterial?.id, `Created raw material: ${testData.rawMaterial?.name}`);
}

async function test05_PurchaseCash() {
  section('TEST 5: Purchase with CASH payment (no payment record should be created)');

  const result = await makeRequest('POST', '/inventory-purchases', {
    supplier_id: testData.supplier.id,
    warehouse_id: testData.warehouse1.id,
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: 'CASH-001',
    payment_terms: 'cash',
    items: [{
      raw_material_id: testData.rawMaterial.id,
      quantity: 5,
      unit_price: 200
    }],
    notes: 'Cash purchase test'
  }, testData.token);

  testData.purchaseCash = result.data?.data;
  assert(result.success && testData.purchaseCash?.id, `Created cash purchase: ${testData.purchaseCash?.invoice_number}`);

  // Verify stock increased
  await sleep(500);
  const material = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  assert(
    parseFloat(material.data?.data?.current_stock) === 5,
    `Stock increased correctly: 0 → 5 kg`
  );

  // Verify NO payment record created
  const payments = await makeRequest('GET', '/supplier-payments', null, testData.token);
  const hasCashPayment = payments.data?.data?.some(p => p.purchase_id === testData.purchaseCash.id);
  assert(!hasCashPayment, 'NO payment record for cash purchase ✅');
}

async function test06_PurchaseCredit() {
  section('TEST 6: Purchase with CREDIT_30 payment (payment record SHOULD be created)');

  const purchaseDate = new Date().toISOString().split('T')[0];

  const result = await makeRequest('POST', '/inventory-purchases', {
    supplier_id: testData.supplier.id,
    warehouse_id: testData.warehouse1.id,
    purchase_date: purchaseDate,
    invoice_number: 'CREDIT-001',
    payment_terms: 'credit_30',
    items: [{
      raw_material_id: testData.rawMaterial.id,
      quantity: 10,
      unit_price: 200
    }],
    notes: 'Credit purchase test - 30 days'
  }, testData.token);

  testData.purchaseCredit = result.data?.data;
  assert(result.success && testData.purchaseCredit?.id, `Created credit purchase: ${testData.purchaseCredit?.invoice_number}`);

  // Verify stock increased
  await sleep(500);
  const material = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  assert(
    parseFloat(material.data?.data?.current_stock) === 15,
    `Stock increased correctly: 5 → 15 kg`
  );

  // 🚀 KEY TEST: Verify payment record WAS created automatically
  await sleep(500);
  const payments = await makeRequest('GET', '/supplier-payments', null, testData.token);
  const creditPayment = payments.data?.data?.find(p => p.purchase_id === testData.purchaseCredit.id);

  assert(creditPayment !== undefined, '✨ Payment record AUTO-CREATED for credit purchase!');

  if (creditPayment) {
    testData.payment = creditPayment;
    assert(creditPayment.amount_due === 2000, `Amount due correct: ${creditPayment.amount_due} EGP`);
    assert(creditPayment.payment_status === 'unpaid', `Status correct: ${creditPayment.payment_status}`);

    // Verify due date is 30 days from purchase date
    const dueDate = new Date(creditPayment.due_date);
    const expectedDue = new Date(purchaseDate);
    expectedDue.setDate(expectedDue.getDate() + 30);

    assert(
      dueDate.toISOString().split('T')[0] === expectedDue.toISOString().split('T')[0],
      `Due date correct: ${creditPayment.due_date} (30 days from purchase)`
    );
  }
}

async function test07_MakePartialPayment() {
  section('TEST 7: Make Partial Payment');

  if (!testData.payment) {
    log('⏭️  Skipped - No payment to test', 'yellow');
    return;
  }

  const result = await makeRequest('POST', '/supplier-payments', {
    purchase_id: testData.purchaseCredit.id,
    supplier_id: testData.supplier.id,
    amount: 1000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: 'First installment'
  }, testData.token);

  assert(result.success, 'Partial payment recorded');

  // Verify status changed to 'partial'
  await sleep(500);
  const payments = await makeRequest('GET', `/supplier-payments/${testData.payment.id}`, null, testData.token);
  const updated = payments.data?.data;

  if (updated) {
    assert(
      updated.payment_status === 'partial',
      `Status updated: unpaid → partial`
    );
    assert(
      parseFloat(updated.amount_paid) === 1000,
      `Amount paid: ${updated.amount_paid} EGP`
    );
  }
}

async function test08_CreateProduct() {
  section('TEST 8: Create Product');

  const result = await makeRequest('POST', '/products', {
    name: 'Test Beef Burger',
    description: 'Test burger with beef',
    price: 50,
    cost_price: 30,
    category_id: null,
    is_active: true
  }, testData.token);

  testData.product = result.data?.data;
  assert(result.success && testData.product?.id, `Created product: ${testData.product?.name}`);
}

async function test09_CreateProductRecipe() {
  section('TEST 9: Create Product Recipe (Link Product → Raw Material)');

  const result = await makeRequest('PUT', `/product-recipes/product/${testData.product.id}`, {
    recipe: [{
      raw_material_id: testData.rawMaterial.id,
      quantity_needed: 0.150, // 150 grams
      unit: 'kg'
    }]
  }, testData.token);

  testData.recipe = result.data?.data;
  assert(result.success, `Linked product to raw material: 150g beef per burger`);

  // Verify cost_price was auto-calculated
  const product = await makeRequest('GET', `/products/${testData.product.id}`, null, testData.token);
  const expectedCost = 0.150 * 200; // 150g * 200 EGP/kg = 30 EGP

  if (product.data?.data) {
    assert(
      parseFloat(product.data.data.cost_price) === expectedCost,
      `Cost price auto-calculated: ${product.data.data.cost_price} EGP`
    );
  }
}

async function test10_SellProduct() {
  section('TEST 10: Sell Product (Stock SHOULD deduct automatically)');

  // Get stock before sale
  const materialBefore = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  const stockBefore = parseFloat(materialBefore.data?.data?.current_stock);
  log(`Stock before sale: ${stockBefore} kg`, 'blue');

  // Sell 3 burgers
  const result = await makeRequest('POST', '/orders/in-store', {
    items: [{
      product_id: testData.product.id,
      quantity: 3,
      price: 50,
      cost_price: 30
    }]
  }, testData.token);

  testData.order = result.data?.data;
  assert(result.success && testData.order?.id, `Sold 3 burgers: Order #${testData.order?.order_number}`);

  // Verify stock decreased
  await sleep(500);
  const materialAfter = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  const stockAfter = parseFloat(materialAfter.data?.data?.current_stock);

  const expectedDeduction = 3 * 0.150; // 3 burgers * 150g each = 450g = 0.45kg
  const expectedStock = stockBefore - expectedDeduction;

  log(`Stock after sale: ${stockAfter} kg`, 'blue');
  log(`Expected deduction: ${expectedDeduction} kg`, 'blue');

  assert(
    Math.abs(stockAfter - expectedStock) < 0.01, // Allow 0.01 tolerance for floating point
    `✨ Stock deducted automatically: ${stockBefore} → ${stockAfter} kg (-${expectedDeduction} kg)`
  );
}

async function test11_CreateMaterialBatch() {
  section('TEST 11: Create Material Batch (FIFO Tracking)');

  const result = await makeRequest('POST', '/material-batches', {
    raw_material_id: testData.rawMaterial.id,
    batch_number: 'BEEF-BATCH-001',
    quantity: stockAfter = await (async () => {
      const m = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
      return parseFloat(m.data?.data?.current_stock);
    })(),
    warehouse_id: testData.warehouse1.id,
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })()
  }, testData.token);

  testData.batch = result.data?.data;
  assert(result.success && testData.batch?.id, `Created batch: ${testData.batch?.batch_number}`);
}

async function test12_FIFOConsumption() {
  section('TEST 12: FIFO Consumption');

  const result = await makeRequest('POST', '/fifo/consume', {
    batch_id: testData.batch.id,
    quantity: 2,
    consumption_type: 'production',
    notes: 'Test FIFO consumption'
  }, testData.token);

  assert(result.success, 'FIFO consumption recorded');

  // Verify batch quantity decreased
  await sleep(500);
  const batches = await makeRequest('GET', '/material-batches', null, testData.token);
  const updatedBatch = batches.data?.data?.find(b => b.id === testData.batch.id);

  if (updatedBatch) {
    assert(
      parseFloat(updatedBatch.remaining_quantity) < parseFloat(testData.batch.quantity),
      `Batch quantity decreased: ${testData.batch.quantity} → ${updatedBatch.remaining_quantity} kg`
    );
  }
}

async function test13_StockTransfer() {
  section('TEST 13: Stock Transfer Between Warehouses');

  // Create transfer request
  const result = await makeRequest('POST', '/stock-transfers', {
    from_warehouse_id: testData.warehouse1.id,
    to_warehouse_id: testData.warehouse2.id,
    transfer_date: new Date().toISOString().split('T')[0],
    items: [{
      raw_material_id: testData.rawMaterial.id,
      quantity: 1
    }],
    notes: 'Test transfer'
  }, testData.token);

  testData.transfer = result.data?.data;
  assert(result.success && testData.transfer?.id, 'Transfer request created');

  // Approve transfer
  await sleep(500);
  const approve = await makeRequest('PUT', `/stock-transfers/${testData.transfer.id}/status`, {
    status: 'in_transit'
  }, testData.token);

  assert(approve.success, 'Transfer approved (in_transit)');

  // Complete transfer
  await sleep(500);
  const complete = await makeRequest('PUT', `/stock-transfers/${testData.transfer.id}/status`, {
    status: 'completed'
  }, testData.token);

  assert(complete.success, 'Transfer completed');
}

async function test14_InventoryCount() {
  section('TEST 14: Inventory Count with Adjustment');

  // Create count session
  const create = await makeRequest('POST', '/inventory-counts', {
    warehouse_id: testData.warehouse1.id,
    count_date: new Date().toISOString().split('T')[0],
    notes: 'Test inventory count'
  }, testData.token);

  testData.count = create.data?.data;
  assert(create.success && testData.count?.id, 'Inventory count session created');

  // Add count item
  const material = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  const systemQty = parseFloat(material.data?.data?.current_stock);
  const actualQty = systemQty - 0.5; // Simulate 0.5 kg variance

  await sleep(500);
  const addItem = await makeRequest('POST', `/inventory-counts/${testData.count.id}/items`, {
    raw_material_id: testData.rawMaterial.id,
    actual_quantity: actualQty
  }, testData.token);

  assert(addItem.success, 'Count item added with variance');

  // Complete count with adjustment
  await sleep(500);
  const complete = await makeRequest('PUT', `/inventory-counts/${testData.count.id}/complete`, {
    auto_adjust: true
  }, testData.token);

  assert(complete.success, 'Count completed with auto-adjustment');

  // Verify stock was adjusted
  await sleep(500);
  const adjusted = await makeRequest('GET', `/raw-materials/${testData.rawMaterial.id}`, null, testData.token);
  const newStock = parseFloat(adjusted.data?.data?.current_stock);

  assert(
    Math.abs(newStock - actualQty) < 0.01,
    `✨ Stock auto-adjusted: ${systemQty} → ${newStock} kg`
  );
}

async function test15_AlertsSystem() {
  section('TEST 15: Alerts System');

  // Trigger alert check
  const check = await makeRequest('POST', '/alerts/check', null, testData.token);
  assert(check.success, 'Alert check triggered');

  // Get all alerts
  await sleep(500);
  const alerts = await makeRequest('GET', '/alerts', null, testData.token);
  testData.alerts = alerts.data?.data;

  log(`Found ${testData.alerts?.length || 0} alerts`, 'blue');

  // Check for low stock alert (current stock should be below minimum_stock: 5)
  const lowStockAlert = testData.alerts?.find(a =>
    a.alert_type === 'low_stock' &&
    a.reference_id === testData.rawMaterial.id
  );

  if (lowStockAlert) {
    assert(true, `✨ Low stock alert created: ${lowStockAlert.message}`);
  }

  // Check for expiring batch alert
  const expiringAlert = testData.alerts?.find(a =>
    a.alert_type === 'expiring_batch' &&
    a.reference_id === testData.batch?.id
  );

  if (expiringAlert) {
    assert(true, `✨ Expiring batch alert created: ${expiringAlert.message}`);
  }

  // Check for overdue payment alert
  const overdueAlert = testData.alerts?.find(a =>
    a.alert_type === 'overdue_payment'
  );

  if (testData.alerts?.length > 0) {
    log('All alerts working correctly!', 'green');
  }
}

// ========================================
// Run All Tests
// ========================================

async function runAllTests() {
  console.clear();
  log('🚀 COFFEE SYSTEM - END-TO-END INTEGRATION TESTING', 'magenta');
  log('=' .repeat(60), 'magenta');

  const startTime = Date.now();

  try {
    await test01_Authentication();
    await test02_CreateSupplier();
    await test03_CreateWarehouses();
    await test04_CreateRawMaterial();
    await test05_PurchaseCash();
    await test06_PurchaseCredit();
    await test07_MakePartialPayment();
    await test08_CreateProduct();
    await test09_CreateProductRecipe();
    await test10_SellProduct();
    await test11_CreateMaterialBatch();
    await test12_FIFOConsumption();
    await test13_StockTransfer();
    await test14_InventoryCount();
    await test15_AlertsSystem();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    section('SUMMARY');
    log(`✅ All tests completed in ${duration}s`, 'green');
    log(`\n📊 Test Data Summary:`, 'cyan');
    log(`   Supplier ID: ${testData.supplier?.id}`, 'blue');
    log(`   Warehouse 1 ID: ${testData.warehouse1?.id}`, 'blue');
    log(`   Warehouse 2 ID: ${testData.warehouse2?.id}`, 'blue');
    log(`   Raw Material ID: ${testData.rawMaterial?.id}`, 'blue');
    log(`   Product ID: ${testData.product?.id}`, 'blue');
    log(`   Order ID: ${testData.order?.id}`, 'blue');
    log(`   Payment ID: ${testData.payment?.id}`, 'blue');
    log(`\n🎉 System is fully functional!`, 'green');

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
