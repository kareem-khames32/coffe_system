const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testData = {
    warehouseId: null,
    supplierId: null,
    rawMaterialId: null,
    purchaseId: null,
    productId: null,
    orderId: null
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

function logTest(test, passed, error = null) {
    if (passed) {
        log(`✅ ${test}`, 'green');
    } else {
        log(`❌ ${test}`, 'red');
        if (error) log(`   Error: ${error.message || error}`, 'red');
    }
}

// Login
async function login() {
    logSection('🔐 AUTHENTICATION');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        authToken = response.data.token;
        logTest('Login successful', true);
        return true;
    } catch (error) {
        logTest('Login', false, error.response?.data || error);
        return false;
    }
}

// Test Warehouses
async function testWarehouses() {
    logSection('🏢 WAREHOUSES');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Warehouse
    try {
        const response = await axios.post(`${BASE_URL}/warehouses`, {
            name: 'Test Warehouse',
            location: 'Test Location',
            description: 'Test Description'
        }, { headers });
        testData.warehouseId = response.data.data.id;
        logTest('Create Warehouse', true);
    } catch (error) {
        logTest('Create Warehouse', false, error.response?.data);
    }

    // Get All Warehouses
    try {
        const response = await axios.get(`${BASE_URL}/warehouses`, { headers });
        logTest(`Get All Warehouses (Found: ${response.data.data.length})`, true);
    } catch (error) {
        logTest('Get All Warehouses', false, error.response?.data);
    }

    // Get Warehouse by ID
    if (testData.warehouseId) {
        try {
            await axios.get(`${BASE_URL}/warehouses/${testData.warehouseId}`, { headers });
            logTest('Get Warehouse by ID', true);
        } catch (error) {
            logTest('Get Warehouse by ID', false, error.response?.data);
        }
    }

    // Update Warehouse
    if (testData.warehouseId) {
        try {
            await axios.put(`${BASE_URL}/warehouses/${testData.warehouseId}`, {
                name: 'Updated Test Warehouse',
                location: 'Updated Location'
            }, { headers });
            logTest('Update Warehouse', true);
        } catch (error) {
            logTest('Update Warehouse', false, error.response?.data);
        }
    }
}

// Test Suppliers
async function testSuppliers() {
    logSection('🚚 SUPPLIERS');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Supplier
    try {
        const response = await axios.post(`${BASE_URL}/suppliers`, {
            name: 'Test Supplier',
            contact_person: 'Test Contact',
            phone: '0123456789',
            email: 'test@supplier.com',
            address: 'Test Address'
        }, { headers });
        testData.supplierId = response.data.data.id;
        logTest('Create Supplier', true);
    } catch (error) {
        logTest('Create Supplier', false, error.response?.data);
    }

    // Get All Suppliers
    try {
        const response = await axios.get(`${BASE_URL}/suppliers`, { headers });
        logTest(`Get All Suppliers (Found: ${response.data.data.length})`, true);
    } catch (error) {
        logTest('Get All Suppliers', false, error.response?.data);
    }

    // Get Supplier by ID
    if (testData.supplierId) {
        try {
            await axios.get(`${BASE_URL}/suppliers/${testData.supplierId}`, { headers });
            logTest('Get Supplier by ID', true);
        } catch (error) {
            logTest('Get Supplier by ID', false, error.response?.data);
        }
    }

    // Update Supplier
    if (testData.supplierId) {
        try {
            await axios.put(`${BASE_URL}/suppliers/${testData.supplierId}`, {
                name: 'Updated Test Supplier',
                phone: '0987654321'
            }, { headers });
            logTest('Update Supplier', true);
        } catch (error) {
            logTest('Update Supplier', false, error.response?.data);
        }
    }
}

// Test Raw Materials
async function testRawMaterials() {
    logSection('📦 RAW MATERIALS');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Raw Material
    try {
        const response = await axios.post(`${BASE_URL}/raw-materials`, {
            name: 'Test Material',
            description: 'Test Description',
            unit: 'kg',
            current_stock: 100,
            min_stock: 10,
            unit_cost: 5.50,
            supplier_id: testData.supplierId,
            warehouse_id: testData.warehouseId
        }, { headers });
        testData.rawMaterialId = response.data.data.id;
        logTest('Create Raw Material', true);
    } catch (error) {
        logTest('Create Raw Material', false, error.response?.data);
    }

    // Get All Raw Materials
    try {
        const response = await axios.get(`${BASE_URL}/raw-materials`, { headers });
        logTest(`Get All Raw Materials (Found: ${response.data.data.length})`, true);
    } catch (error) {
        logTest('Get All Raw Materials', false, error.response?.data);
    }

    // Get Raw Material by ID
    if (testData.rawMaterialId) {
        try {
            await axios.get(`${BASE_URL}/raw-materials/${testData.rawMaterialId}`, { headers });
            logTest('Get Raw Material by ID', true);
        } catch (error) {
            logTest('Get Raw Material by ID', false, error.response?.data);
        }
    }

    // Update Raw Material
    if (testData.rawMaterialId) {
        try {
            await axios.put(`${BASE_URL}/raw-materials/${testData.rawMaterialId}`, {
                name: 'Updated Test Material',
                unit_cost: 6.00
            }, { headers });
            logTest('Update Raw Material', true);
        } catch (error) {
            logTest('Update Raw Material', false, error.response?.data);
        }
    }

    // Get Low Stock Materials
    try {
        const response = await axios.get(`${BASE_URL}/raw-materials/low-stock`, { headers });
        logTest(`Get Low Stock Materials (Found: ${response.data.data?.length || 0})`, true);
    } catch (error) {
        logTest('Get Low Stock Materials', false, error.response?.data);
    }
}

// Test Inventory Purchases
async function testInventoryPurchases() {
    logSection('🛒 INVENTORY PURCHASES');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Create Purchase
    try {
        const response = await axios.post(`${BASE_URL}/inventory/purchases`, {
            supplier_id: testData.supplierId,
            warehouse_id: testData.warehouseId,
            purchase_date: new Date().toISOString().split('T')[0],
            items: [
                {
                    raw_material_id: testData.rawMaterialId,
                    quantity: 50,
                    unit: 'kg',
                    unit_cost: 5.50
                }
            ],
            payment_terms: 'cash',
            notes: 'Test Purchase'
        }, { headers });
        testData.purchaseId = response.data.data.id;
        logTest('Create Purchase', true);
    } catch (error) {
        logTest('Create Purchase', false, error.response?.data);
    }

    // Get All Purchases
    try {
        const response = await axios.get(`${BASE_URL}/inventory/purchases`, { headers });
        logTest(`Get All Purchases (Found: ${response.data.data?.purchases?.length || 0})`, true);
    } catch (error) {
        logTest('Get All Purchases', false, error.response?.data);
    }

    // Get Purchase by ID
    if (testData.purchaseId) {
        try {
            await axios.get(`${BASE_URL}/inventory/purchases/${testData.purchaseId}`, { headers });
            logTest('Get Purchase by ID', true);
        } catch (error) {
            logTest('Get Purchase by ID', false, error.response?.data);
        }
    }

    // Get Unpaid Purchases
    try {
        const response = await axios.get(`${BASE_URL}/inventory/purchases/unpaid`, { headers });
        logTest(`Get Unpaid Purchases (Found: ${response.data.data?.length || 0})`, true);
    } catch (error) {
        logTest('Get Unpaid Purchases', false, error.response?.data);
    }
}

// Test Products
async function testProducts() {
    logSection('☕ PRODUCTS');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Get All Products
    try {
        const response = await axios.get(`${BASE_URL}/products`, { headers });
        if (response.data.data && response.data.data.length > 0) {
            testData.productId = response.data.data[0].id;
        }
        logTest(`Get All Products (Found: ${response.data.data?.length || 0})`, true);
    } catch (error) {
        logTest('Get All Products', false, error.response?.data);
    }

    // Check Stock Availability
    if (testData.productId) {
        try {
            await axios.post(`${BASE_URL}/products/check-stock`, {
                products: [
                    { product_id: testData.productId, quantity: 2 }
                ]
            }, { headers });
            logTest('Check Stock Availability', true);
        } catch (error) {
            logTest('Check Stock Availability', false, error.response?.data);
        }
    }
}

// Test Orders (with material deduction)
async function testOrders() {
    logSection('🛍️ ORDERS (Material Deduction Test)');
    const headers = { Authorization: `Bearer ${authToken}` };

    if (!testData.productId) {
        logTest('Create Order', false, 'No product available for testing');
        return;
    }

    // Get stock before order
    let stockBefore = 0;
    try {
        const response = await axios.get(`${BASE_URL}/raw-materials`, { headers });
        const material = response.data.data.find(m => m.name.includes('بن'));
        if (material) {
            stockBefore = parseFloat(material.current_stock);
            log(`📊 Stock Before Order: ${stockBefore} ${material.unit}`, 'yellow');
        }
    } catch (error) {
        log('Could not get stock before order', 'red');
    }

    // Create Order
    try {
        const response = await axios.post(`${BASE_URL}/orders`, {
            order_type: 'in-store',
            items: [
                { product_id: testData.productId, quantity: 2, price: 30 }
            ]
        }, { headers });
        testData.orderId = response.data.data.order_id;
        logTest('Create Order', true);
    } catch (error) {
        logTest('Create Order', false, error.response?.data);
    }

    // Get stock after order
    try {
        const response = await axios.get(`${BASE_URL}/raw-materials`, { headers });
        const material = response.data.data.find(m => m.name.includes('بن'));
        if (material) {
            const stockAfter = parseFloat(material.current_stock);
            log(`📊 Stock After Order: ${stockAfter} ${material.unit}`, 'yellow');
            const deducted = stockBefore - stockAfter;
            if (deducted > 0) {
                log(`✅ Materials Deducted: ${deducted} ${material.unit}`, 'green');
            } else {
                log(`❌ No materials deducted!`, 'red');
            }
        }
    } catch (error) {
        log('Could not get stock after order', 'red');
    }

    // Get Order by ID
    if (testData.orderId) {
        try {
            const response = await axios.get(`${BASE_URL}/orders/${testData.orderId}`, { headers });
            const total = response.data.data.total || response.data.data.total_amount;
            logTest(`Get Order by ID (Total: ${total} ج.م)`, true);
        } catch (error) {
            logTest('Get Order by ID', false, error.response?.data);
        }
    }
}

// Test Reports
async function testReports() {
    logSection('📊 REPORTS');
    const headers = { Authorization: `Bearer ${authToken}` };

    // Sales Report
    try {
        const response = await axios.get(`${BASE_URL}/reports/sales`, { headers });
        logTest(`Sales Report (Total Sales: ${response.data.data?.totalSales || 0} ج.م)`, true);
    } catch (error) {
        logTest('Sales Report', false, error.response?.data);
    }

    // Inventory Report
    try {
        const response = await axios.get(`${BASE_URL}/reports/inventory`, { headers });
        logTest(`Inventory Report (Low Stock Items: ${response.data.data?.lowStockMaterials?.length || 0})`, true);
    } catch (error) {
        logTest('Inventory Report', false, error.response?.data);
    }

    // Purchase Report
    try {
        const response = await axios.get(`${BASE_URL}/reports/purchases`, { headers });
        logTest(`Purchase Report`, true);
    } catch (error) {
        logTest('Purchase Report', false, error.response?.data);
    }
}

// Test Dashboard
async function testDashboard() {
    logSection('📈 DASHBOARD');
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        const response = await axios.get(`${BASE_URL}/dashboard/stats`, { headers });
        logTest('Dashboard Stats', true);
        log(`   - Total Orders: ${response.data.data?.totalOrders || 0}`, 'blue');
        log(`   - Total Sales: ${response.data.data?.totalSales || 0} ج.م`, 'blue');
        log(`   - Low Stock Items: ${response.data.data?.lowStockCount || 0}`, 'blue');
    } catch (error) {
        logTest('Dashboard Stats', false, error.response?.data);
    }
}

// Main Test Runner
async function runAllTests() {
    console.clear();
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         COMPREHENSIVE INVENTORY SYSTEM TESTS              ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    const loginSuccess = await login();
    if (!loginSuccess) {
        log('\n❌ Cannot proceed without authentication', 'red');
        return;
    }

    await testWarehouses();
    await testSuppliers();
    await testRawMaterials();
    await testInventoryPurchases();
    await testProducts();
    await testOrders();
    await testReports();
    await testDashboard();

    logSection('🎯 TEST SUMMARY');
    log('All tests completed! Review results above.', 'green');
    log('\n💡 TIP: Check each section for ✅ (pass) or ❌ (fail) markers\n', 'yellow');
}

// Run tests
runAllTests().catch(error => {
    log('\n❌ Fatal Error:', 'red');
    console.error(error);
});
