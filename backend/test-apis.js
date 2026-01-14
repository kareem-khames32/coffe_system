// Quick API Test Script
// Run: node test-apis.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

async function testAPI(name, method, endpoint, data = null, auth = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      ...(data && { data }),
      ...(auth && { headers: { Authorization: `Bearer ${auth}` } }),
    };

    const response = await axios(config);
    console.log(`${colors.green}✅ ${name}${colors.reset}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`${colors.red}❌ ${name}${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'No message'}`);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🔍 Testing Coffee System APIs...\n');
  console.log('='.repeat(50));

  let token = null;

  // Test 1: Health Check
  await testAPI('Health Check', 'GET', '/health');

  // Test 2: Login (get token for other tests)
  console.log('\n📝 Authentication:');
  const loginResult = await testAPI(
    'Login',
    'POST',
    '/auth/login',
    { username: 'admin', password: 'admin123' }
  );

  if (loginResult.success) {
    token = loginResult.data.token;
    console.log(`   Token received: ${token.substring(0, 20)}...`);
  } else {
    console.log(`${colors.yellow}⚠️  No token - skipping authenticated tests${colors.reset}`);
  }

  // Test 3: Basic Inventory APIs
  console.log('\n📦 Basic Inventory:');
  await testAPI('Get Suppliers', 'GET', '/suppliers', null, token);
  await testAPI('Get Warehouses', 'GET', '/warehouses', null, token);
  await testAPI('Get Raw Materials', 'GET', '/raw-materials', null, token);

  // Test 4: Phase 1 APIs
  console.log('\n💰 Phase 1 - Payments & Batches:');
  await testAPI('Get Supplier Payments', 'GET', '/supplier-payments', null, token);
  await testAPI('Get Unpaid Purchases', 'GET', '/supplier-payments/unpaid-purchases', null, token);
  await testAPI('Get Material Batches', 'GET', '/material-batches', null, token);
  await testAPI('Get Expiring Batches', 'GET', '/material-batches/expiring?days=30', null, token);
  await testAPI('Get Stock Transfers', 'GET', '/stock-transfers', null, token);
  await testAPI('Get Pending Transfers', 'GET', '/stock-transfers/pending', null, token);

  // Test 5: Phase 2 APIs
  console.log('\n🚀 Phase 2 - FIFO, Counts, Alerts:');
  await testAPI('Get Available Batches (FIFO)', 'GET', '/fifo/available-batches', null, token);
  await testAPI('Get Consumption History', 'GET', '/fifo/consumption-history', null, token);
  await testAPI('Get Inventory Counts', 'GET', '/inventory-counts', null, token);
  await testAPI('Get Count Variances', 'GET', '/inventory-counts/variances/all', null, token);
  await testAPI('Get Alerts', 'GET', '/alerts', null, token);
  await testAPI('Get Unresolved Alerts', 'GET', '/alerts/unresolved/summary', null, token);
  await testAPI('Get Alert Thresholds', 'GET', '/alerts/thresholds', null, token);

  // Test 6: Reports
  console.log('\n📊 Reports:');
  await testAPI('Get Dashboard Stats', 'GET', '/reports/inventory/dashboard-stats', null, token);
  await testAPI('Get Materials Summary', 'GET', '/reports/inventory/materials/summary', null, token);

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Test Complete!\n');
}

// Run tests
runTests().catch(console.error);
