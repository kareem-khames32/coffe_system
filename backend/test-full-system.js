const axios = require('axios');

// ════════════════════════════════════════════════════════════════
// COMPREHENSIVE SYSTEM TEST - Tests EVERYTHING in the system
// ════════════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let testResults = [];
let testData = {
    // Auth & Users
    user: null,
    cashier: null,

    // Products & Categories
    category: null,
    product1: null,
    product2: null,

    // Inventory
    warehouse: null,
    supplier1: null,
    supplier2: null,
    rawMaterial1: null,
    rawMaterial2: null,
    rawMaterial3: null,
    purchase1: null,
    purchase2: null,
    payment1: null,
    payment2: null,
    batch1: null,
    batch2: null,

    // Recipes
    recipe1: null,
    recipe2: null,

    // Orders
    orderDineIn: null,
    orderTakeaway: null,
    orderDelivery: null,

    // Stock Transfers
    stockTransfer: null,

    // Settings & Features
    settings: null,
    offer: null,
    dailyDiscount: null,
    expense: null
};

// Helper functions
const log = (message, color = 'white') => {
    const colors = {
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        magenta: '\x1b[35m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Update token in headers
api.interceptors.request.use(config => {
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const recordTest = (name, passed, details = '') => {
    testResults.push({ name, passed, details });
    if (passed) {
        log(`✅ ${name}`, 'green');
    } else {
        log(`❌ ${name} - ${details}`, 'red');
    }
};

// ════════════════════════════════════════════════════════════════
// PHASE 1: AUTHENTICATION & USERS
// ════════════════════════════════════════════════════════════════

async function testAuthentication() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 1: AUTHENTICATION & USER MANAGEMENT                ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 1: Login
    try {
        log('\n[1] Testing Admin Login...', 'cyan');
        const response = await api.post('/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (response.data.success && response.data.data.token) {
            token = response.data.data.token;
            testData.user = response.data.data.user;
            recordTest('Admin Login', true);
        } else {
            recordTest('Admin Login', false, 'No token received');
            return false;
        }
    } catch (error) {
        recordTest('Admin Login', false, error.response?.data?.message || error.message);
        return false;
    }

    // Test 2: Get Current User
    try {
        log('\n[2] Testing Get Current User...', 'cyan');
        const response = await api.get('/auth/me');

        if (response.data.success) {
            recordTest('Get Current User', true);
        } else {
            recordTest('Get Current User', false, 'Failed to get user');
        }
    } catch (error) {
        recordTest('Get Current User', false, error.response?.data?.message || error.message);
    }

    return true;
}

// ════════════════════════════════════════════════════════════════
// PHASE 2: CATEGORIES & PRODUCTS
// ════════════════════════════════════════════════════════════════

async function testProductManagement() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 2: CATEGORIES & PRODUCTS                            ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 3: Create Category
    try {
        log('\n[3] Testing Create Category...', 'cyan');
        const response = await api.post('/categories', {
            name: 'مشروبات ساخنة',
            description: 'قهوة وشاي ومشروبات ساخنة',
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.category = response.data.data;
            recordTest('Create Category', true);
        } else {
            recordTest('Create Category', false, 'No category data');
        }
    } catch (error) {
        recordTest('Create Category', false, error.response?.data?.message || error.message);
    }

    // Test 4: Get Categories
    try {
        log('\n[4] Testing Get Categories...', 'cyan');
        const response = await api.get('/categories');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Categories', true);
        } else {
            recordTest('Get Categories', false, 'No categories data');
        }
    } catch (error) {
        recordTest('Get Categories', false, error.response?.data?.message || error.message);
    }

    // Test 5: Create Product 1
    try {
        log('\n[5] Testing Create Product (Espresso)...', 'cyan');
        const response = await api.post('/products', {
            name: 'إسبريسو',
            name_en: 'Espresso',
            description: 'قهوة إسبريسو إيطالية',
            category_id: testData.category?.id || 1,
            price: 25.00,
            cost_price: 10.00,
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.product1 = response.data.data;
            recordTest('Create Product (Espresso)', true);
        } else {
            recordTest('Create Product (Espresso)', false, 'No product data');
        }
    } catch (error) {
        recordTest('Create Product (Espresso)', false, error.response?.data?.message || error.message);
    }

    // Test 6: Create Product 2
    try {
        log('\n[6] Testing Create Product (Cappuccino)...', 'cyan');
        const response = await api.post('/products', {
            name: 'كابتشينو',
            name_en: 'Cappuccino',
            description: 'كابتشينو كلاسيكي',
            category_id: testData.category?.id || 1,
            price: 30.00,
            cost_price: 12.00,
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.product2 = response.data.data;
            recordTest('Create Product (Cappuccino)', true);
        } else {
            recordTest('Create Product (Cappuccino)', false, 'No product data');
        }
    } catch (error) {
        recordTest('Create Product (Cappuccino)', false, error.response?.data?.message || error.message);
    }

    // Test 7: Get Products
    try {
        log('\n[7] Testing Get Products...', 'cyan');
        const response = await api.get('/products');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Products', true);
        } else {
            recordTest('Get Products', false, 'No products data');
        }
    } catch (error) {
        recordTest('Get Products', false, error.response?.data?.message || error.message);
    }

    // Test 8: Update Product
    try {
        log('\n[8] Testing Update Product...', 'cyan');
        const response = await api.put(`/products/${testData.product1.id}`, {
            ...testData.product1,
            price: 28.00
        });

        if (response.data.success) {
            recordTest('Update Product', true);
        } else {
            recordTest('Update Product', false, 'Update failed');
        }
    } catch (error) {
        recordTest('Update Product', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 3: INVENTORY MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function testInventoryManagement() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 3: INVENTORY MANAGEMENT                             ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 9: Create Warehouse
    try {
        log('\n[9] Testing Create Warehouse...', 'cyan');
        const response = await api.post('/warehouses', {
            name: 'المخزن الرئيسي',
            location: 'الدور الأرضي',
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.warehouse = response.data.data;
            recordTest('Create Warehouse', true);
        } else {
            recordTest('Create Warehouse', false, 'No warehouse data');
        }
    } catch (error) {
        recordTest('Create Warehouse', false, error.response?.data?.message || error.message);
    }

    // Test 10: Create Supplier 1
    try {
        log('\n[10] Testing Create Supplier (Coffee Supplier)...', 'cyan');
        const response = await api.post('/suppliers', {
            name: 'مورد القهوة العربية',
            contact_person: 'أحمد محمد',
            phone: '01234567890',
            email: 'coffee@supplier.com',
            address: 'القاهرة، مصر',
            payment_terms: 'credit_30',
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.supplier1 = response.data.data;
            recordTest('Create Supplier (Coffee)', true);
        } else {
            recordTest('Create Supplier (Coffee)', false, 'No supplier data');
        }
    } catch (error) {
        recordTest('Create Supplier (Coffee)', false, error.response?.data?.message || error.message);
    }

    // Test 11: Create Supplier 2
    try {
        log('\n[11] Testing Create Supplier (Milk Supplier)...', 'cyan');
        const response = await api.post('/suppliers', {
            name: 'مورد الألبان',
            contact_person: 'محمود علي',
            phone: '01098765432',
            email: 'milk@supplier.com',
            address: 'الإسكندرية، مصر',
            payment_terms: 'credit_7',
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.supplier2 = response.data.data;
            recordTest('Create Supplier (Milk)', true);
        } else {
            recordTest('Create Supplier (Milk)', false, 'No supplier data');
        }
    } catch (error) {
        recordTest('Create Supplier (Milk)', false, error.response?.data?.message || error.message);
    }

    // Test 12: Get Suppliers
    try {
        log('\n[12] Testing Get Suppliers...', 'cyan');
        const response = await api.get('/suppliers');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Suppliers', true);
        } else {
            recordTest('Get Suppliers', false, 'No suppliers data');
        }
    } catch (error) {
        recordTest('Get Suppliers', false, error.response?.data?.message || error.message);
    }

    // Test 13: Create Raw Material 1 (Coffee Beans)
    try {
        log('\n[13] Testing Create Raw Material (Coffee Beans)...', 'cyan');
        const response = await api.post('/raw-materials', {
            name: 'بن عربي',
            name_en: 'Arabic Coffee Beans',
            unit: 'kg',
            minimum_stock: 5,
            current_stock: 0,
            warehouse_id: testData.warehouse?.id || 1,
            notes: 'بن عربي فاخر'
        });

        if (response.data.success && response.data.data) {
            testData.rawMaterial1 = response.data.data;
            recordTest('Create Raw Material (Coffee Beans)', true);
        } else {
            recordTest('Create Raw Material (Coffee Beans)', false, 'No material data');
        }
    } catch (error) {
        recordTest('Create Raw Material (Coffee Beans)', false, error.response?.data?.message || error.message);
    }

    // Test 14: Create Raw Material 2 (Milk)
    try {
        log('\n[14] Testing Create Raw Material (Milk)...', 'cyan');
        const response = await api.post('/raw-materials', {
            name: 'حليب كامل الدسم',
            name_en: 'Whole Milk',
            unit: 'liter',
            minimum_stock: 10,
            current_stock: 0,
            warehouse_id: testData.warehouse?.id || 1,
            notes: 'حليب طازج'
        });

        if (response.data.success && response.data.data) {
            testData.rawMaterial2 = response.data.data;
            recordTest('Create Raw Material (Milk)', true);
        } else {
            recordTest('Create Raw Material (Milk)', false, 'No material data');
        }
    } catch (error) {
        recordTest('Create Raw Material (Milk)', false, error.response?.data?.message || error.message);
    }

    // Test 15: Create Raw Material 3 (Sugar)
    try {
        log('\n[15] Testing Create Raw Material (Sugar)...', 'cyan');
        const response = await api.post('/raw-materials', {
            name: 'سكر أبيض',
            name_en: 'White Sugar',
            unit: 'kg',
            minimum_stock: 5,
            current_stock: 0,
            warehouse_id: testData.warehouse?.id || 1,
            notes: 'سكر ناعم'
        });

        if (response.data.success && response.data.data) {
            testData.rawMaterial3 = response.data.data;
            recordTest('Create Raw Material (Sugar)', true);
        } else {
            recordTest('Create Raw Material (Sugar)', false, 'No material data');
        }
    } catch (error) {
        recordTest('Create Raw Material (Sugar)', false, error.response?.data?.message || error.message);
    }

    // Test 16: Get Raw Materials
    try {
        log('\n[16] Testing Get Raw Materials...', 'cyan');
        const response = await api.get('/raw-materials');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Raw Materials', true);
        } else {
            recordTest('Get Raw Materials', false, 'No materials data');
        }
    } catch (error) {
        recordTest('Get Raw Materials', false, error.response?.data?.message || error.message);
    }

    // Test 17: Create Purchase with Credit Payment (30 days)
    try {
        log('\n[17] Testing Create Purchase with Credit Payment...', 'cyan');
        const today = new Date().toISOString().split('T')[0];
        const response = await api.post('/inventory-purchases', {
            supplier_id: testData.supplier1?.id,
            warehouse_id: testData.warehouse?.id,
            purchase_date: today,
            payment_terms: 'credit_30',
            notes: 'شراء بن عربي - آجل 30 يوم',
            items: [
                {
                    raw_material_id: testData.rawMaterial1?.id,
                    quantity: 50,
                    unit: 'kg',
                    unit_cost: 100.00
                }
            ]
        });

        if (response.data.success && response.data.data) {
            testData.purchase1 = response.data.data;
            recordTest('Create Purchase (Credit 30 days)', true);
        } else {
            recordTest('Create Purchase (Credit 30 days)', false, 'No purchase data');
        }
    } catch (error) {
        recordTest('Create Purchase (Credit 30 days)', false, error.response?.data?.message || error.message);
    }

    // Test 18: Verify Auto Payment Creation
    try {
        log('\n[18] Testing Auto Payment Creation...', 'cyan');
        const response = await api.get('/supplier-payments');

        if (response.data.success && Array.isArray(response.data.data)) {
            const autoPayment = response.data.data.find(p =>
                p.purchase_id === testData.purchase1?.id
            );

            if (autoPayment) {
                testData.payment1 = autoPayment;
                recordTest('Auto Payment Creation', true);
            } else {
                recordTest('Auto Payment Creation', false, 'Payment not created automatically');
            }
        } else {
            recordTest('Auto Payment Creation', false, 'Could not fetch payments');
        }
    } catch (error) {
        recordTest('Auto Payment Creation', false, error.response?.data?.message || error.message);
    }

    // Test 19: Create Purchase with Cash Payment
    try {
        log('\n[19] Testing Create Purchase with Cash Payment...', 'cyan');
        const today = new Date().toISOString().split('T')[0];
        const response = await api.post('/inventory-purchases', {
            supplier_id: testData.supplier2?.id,
            warehouse_id: testData.warehouse?.id,
            purchase_date: today,
            payment_terms: 'cash',
            notes: 'شراء حليب - نقدي',
            items: [
                {
                    raw_material_id: testData.rawMaterial2?.id,
                    quantity: 30,
                    unit: 'liter',
                    unit_cost: 50.00
                }
            ]
        });

        if (response.data.success && response.data.data) {
            testData.purchase2 = response.data.data;
            recordTest('Create Purchase (Cash)', true);
        } else {
            recordTest('Create Purchase (Cash)', false, 'No purchase data');
        }
    } catch (error) {
        recordTest('Create Purchase (Cash)', false, error.response?.data?.message || error.message);
    }

    // Test 20: Get Purchases
    try {
        log('\n[20] Testing Get Purchases...', 'cyan');
        const response = await api.get('/inventory-purchases');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Purchases', true);
        } else {
            recordTest('Get Purchases', false, 'No purchases data');
        }
    } catch (error) {
        recordTest('Get Purchases', false, error.response?.data?.message || error.message);
    }

    // Test 21: Get Material Batches (FIFO)
    try {
        log('\n[21] Testing Get Material Batches (FIFO)...', 'cyan');
        const response = await api.get('/material-batches');

        if (response.data.success && Array.isArray(response.data.data)) {
            const coffeeBatch = response.data.data.find(b =>
                b.raw_material_id === testData.rawMaterial1?.id
            );
            if (coffeeBatch) {
                testData.batch1 = coffeeBatch;
            }
            recordTest('Get Material Batches', true);
        } else {
            recordTest('Get Material Batches', false, 'No batches data');
        }
    } catch (error) {
        recordTest('Get Material Batches', false, error.response?.data?.message || error.message);
    }

    // Test 22: Make Payment Installment
    try {
        log('\n[22] Testing Make Payment Installment...', 'cyan');
        const today = new Date().toISOString().split('T')[0];
        const response = await api.post('/supplier-payments', {
            supplier_id: testData.supplier1?.id,
            purchase_id: testData.purchase1?.id,
            amount: 1000.00,
            payment_date: today,
            payment_method: 'cash',
            notes: 'دفعة أولى'
        });

        if (response.data.success) {
            recordTest('Make Payment Installment', true);
        } else {
            recordTest('Make Payment Installment', false, 'Payment failed');
        }
    } catch (error) {
        recordTest('Make Payment Installment', false, error.response?.data?.message || error.message);
    }

    // Test 23: Get Supplier Payments
    try {
        log('\n[23] Testing Get Supplier Payments...', 'cyan');
        const response = await api.get('/supplier-payments');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Supplier Payments', true);
        } else {
            recordTest('Get Supplier Payments', false, 'No payments data');
        }
    } catch (error) {
        recordTest('Get Supplier Payments', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 4: PRODUCT RECIPES
// ════════════════════════════════════════════════════════════════

async function testProductRecipes() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 4: PRODUCT RECIPES                                  ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 24: Create Recipe for Espresso (Coffee Beans)
    try {
        log('\n[24] Testing Create Recipe (Espresso - Coffee Beans)...', 'cyan');
        const response = await api.put(`/product-recipes/product/${testData.product1?.id}`, {
            recipe: [
                {
                    raw_material_id: testData.rawMaterial1?.id,
                    quantity_needed: 0.020,
                    unit: 'kg'
                }
            ]
        });

        if (response.data.success) {
            testData.recipe1 = response.data.data;
            recordTest('Create Recipe (Espresso)', true);
        } else {
            recordTest('Create Recipe (Espresso)', false, 'Recipe creation failed');
        }
    } catch (error) {
        recordTest('Create Recipe (Espresso)', false, error.response?.data?.message || error.message);
    }

    // Test 25: Create Recipe for Cappuccino (Coffee Beans + Milk)
    try {
        log('\n[25] Testing Create Recipe (Cappuccino - Coffee + Milk)...', 'cyan');
        const response = await api.put(`/product-recipes/product/${testData.product2?.id}`, {
            recipe: [
                {
                    raw_material_id: testData.rawMaterial1?.id,
                    quantity_needed: 0.020,
                    unit: 'kg'
                },
                {
                    raw_material_id: testData.rawMaterial2?.id,
                    quantity_needed: 0.200,
                    unit: 'liter'
                }
            ]
        });

        if (response.data.success) {
            testData.recipe2 = response.data.data;
            recordTest('Create Recipe (Cappuccino)', true);
        } else {
            recordTest('Create Recipe (Cappuccino)', false, 'Recipe creation failed');
        }
    } catch (error) {
        recordTest('Create Recipe (Cappuccino)', false, error.response?.data?.message || error.message);
    }

    // Test 26: Get Product Recipe
    try {
        log('\n[26] Testing Get Product Recipe...', 'cyan');
        const response = await api.get(`/product-recipes/product/${testData.product1?.id}`);

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Product Recipe', true);
        } else {
            recordTest('Get Product Recipe', false, 'No recipe data');
        }
    } catch (error) {
        recordTest('Get Product Recipe', false, error.response?.data?.message || error.message);
    }

    // Test 27: Check Stock Availability
    try {
        log('\n[27] Testing Check Stock Availability...', 'cyan');
        const response = await api.post('/product-recipes/check-stock', {
            products: [
                { product_id: testData.product1?.id, quantity: 10 },
                { product_id: testData.product2?.id, quantity: 5 }
            ]
        });

        if (response.data.success) {
            recordTest('Check Stock Availability', true);
        } else {
            recordTest('Check Stock Availability', false, 'Stock check failed');
        }
    } catch (error) {
        recordTest('Check Stock Availability', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 5: ORDERS & STOCK DEDUCTION
// ════════════════════════════════════════════════════════════════

async function testOrdersAndStockDeduction() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 5: ORDERS & AUTOMATIC STOCK DEDUCTION              ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Get stock before orders
    let stockBefore = {};
    try {
        const response = await api.get('/raw-materials');
        if (response.data.success) {
            response.data.data.forEach(material => {
                stockBefore[material.id] = material.current_stock;
            });
        }
    } catch (error) {
        log('Warning: Could not get stock before orders', 'yellow');
    }

    // Test 28: Create Dine-In Order
    try {
        log('\n[28] Testing Create Dine-In Order...', 'cyan');
        const response = await api.post('/orders/in-store', {
            order_type: 'dine-in',
            table_number: '5',
            customer_name: 'أحمد محمد',
            items: [
                {
                    product_id: testData.product1?.id,
                    quantity: 2,
                    price: 28.00
                },
                {
                    product_id: testData.product2?.id,
                    quantity: 3,
                    price: 30.00
                }
            ]
        });

        if (response.data.success && response.data.data) {
            testData.orderDineIn = response.data.data;
            recordTest('Create Dine-In Order', true);
        } else {
            recordTest('Create Dine-In Order', false, 'No order data');
        }
    } catch (error) {
        recordTest('Create Dine-In Order', false, error.response?.data?.message || error.message);
    }

    // Test 29: Verify Stock Deduction (FIFO)
    try {
        log('\n[29] Testing Verify Stock Deduction (FIFO)...', 'cyan');
        const response = await api.get('/raw-materials');

        if (response.data.success && Array.isArray(response.data.data)) {
            const coffeeMaterial = response.data.data.find(m => m.id === testData.rawMaterial1?.id);
            const milkMaterial = response.data.data.find(m => m.id === testData.rawMaterial2?.id);

            // Expected deduction:
            // 2 Espresso = 2 * 0.020 kg = 0.040 kg coffee
            // 3 Cappuccino = 3 * 0.020 kg = 0.060 kg coffee + 3 * 0.200 liter = 0.600 liter milk
            // Total: 0.100 kg coffee, 0.600 liter milk

            const coffeeDeducted = stockBefore[coffeeMaterial?.id] - coffeeMaterial?.current_stock;
            const milkDeducted = stockBefore[milkMaterial?.id] - milkMaterial?.current_stock;

            if (Math.abs(coffeeDeducted - 0.100) < 0.001 && Math.abs(milkDeducted - 0.600) < 0.001) {
                recordTest('Verify Stock Deduction (FIFO)', true);
                log(`   ✓ Coffee deducted: ${coffeeDeducted} kg (expected: 0.100 kg)`, 'green');
                log(`   ✓ Milk deducted: ${milkDeducted} liter (expected: 0.600 liter)`, 'green');
            } else {
                recordTest('Verify Stock Deduction (FIFO)', false,
                    `Coffee: ${coffeeDeducted} kg (expected 0.100), Milk: ${milkDeducted} liter (expected 0.600)`);
            }

            // Update stock for next test
            stockBefore = {};
            response.data.data.forEach(material => {
                stockBefore[material.id] = material.current_stock;
            });
        } else {
            recordTest('Verify Stock Deduction (FIFO)', false, 'Could not verify stock');
        }
    } catch (error) {
        recordTest('Verify Stock Deduction (FIFO)', false, error.response?.data?.message || error.message);
    }

    // Test 30: Create Takeaway Order
    try {
        log('\n[30] Testing Create Takeaway Order...', 'cyan');
        const response = await api.post('/orders/in-store', {
            order_type: 'takeaway',
            customer_name: 'فاطمة علي',
            customer_phone: '01234567890',
            items: [
                {
                    product_id: testData.product2?.id,
                    quantity: 5,
                    price: 30.00
                }
            ]
        });

        if (response.data.success && response.data.data) {
            testData.orderTakeaway = response.data.data;
            recordTest('Create Takeaway Order', true);
        } else {
            recordTest('Create Takeaway Order', false, 'No order data');
        }
    } catch (error) {
        recordTest('Create Takeaway Order', false, error.response?.data?.message || error.message);
    }

    // Test 31: Get Orders
    try {
        log('\n[31] Testing Get Orders...', 'cyan');
        const response = await api.get('/orders');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Orders', true);
        } else {
            recordTest('Get Orders', false, 'No orders data');
        }
    } catch (error) {
        recordTest('Get Orders', false, error.response?.data?.message || error.message);
    }

    // Test 32: Get Order by ID
    try {
        log('\n[32] Testing Get Order by ID...', 'cyan');
        const response = await api.get(`/orders/${testData.orderDineIn?.id}`);

        if (response.data.success && response.data.data) {
            recordTest('Get Order by ID', true);
        } else {
            recordTest('Get Order by ID', false, 'No order data');
        }
    } catch (error) {
        recordTest('Get Order by ID', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 6: REPORTS & DASHBOARD
// ════════════════════════════════════════════════════════════════

async function testReportsAndDashboard() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 6: REPORTS & DASHBOARD                              ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 33: Get Dashboard Stats
    try {
        log('\n[33] Testing Get Dashboard Stats...', 'cyan');
        const response = await api.get('/reports/dashboard');

        if (response.data.success && response.data.data) {
            recordTest('Get Dashboard Stats', true);
        } else {
            recordTest('Get Dashboard Stats', false, 'No dashboard data');
        }
    } catch (error) {
        recordTest('Get Dashboard Stats', false, error.response?.data?.message || error.message);
    }

    // Test 34: Get Sales Report
    try {
        log('\n[34] Testing Get Sales Report...', 'cyan');
        const today = new Date().toISOString().split('T')[0];
        const response = await api.get(`/reports/sales?start_date=${today}&end_date=${today}`);

        if (response.data.success) {
            recordTest('Get Sales Report', true);
        } else {
            recordTest('Get Sales Report', false, 'No sales report');
        }
    } catch (error) {
        recordTest('Get Sales Report', false, error.response?.data?.message || error.message);
    }

    // Test 35: Get Inventory Report
    try {
        log('\n[35] Testing Get Inventory Report...', 'cyan');
        const response = await api.get('/reports/inventory');

        if (response.data.success) {
            recordTest('Get Inventory Report', true);
        } else {
            recordTest('Get Inventory Report', false, 'No inventory report');
        }
    } catch (error) {
        recordTest('Get Inventory Report', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 7: SETTINGS, OFFERS & DISCOUNTS
// ════════════════════════════════════════════════════════════════

async function testSettingsAndOffers() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 7: SETTINGS, OFFERS & DAILY DISCOUNTS              ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 36: Get Settings
    try {
        log('\n[36] Testing Get Settings...', 'cyan');
        const response = await api.get('/settings');

        if (response.data.success && response.data.data) {
            testData.settings = response.data.data;
            recordTest('Get Settings', true);
        } else {
            recordTest('Get Settings', false, 'No settings data');
        }
    } catch (error) {
        recordTest('Get Settings', false, error.response?.data?.message || error.message);
    }

    // Test 37: Update Settings
    try {
        log('\n[37] Testing Update Settings...', 'cyan');
        const response = await api.put('/settings', {
            cafe_name: 'مقهى الاختبار',
            cafe_phone: '01234567890',
            cafe_address: 'القاهرة، مصر'
        });

        if (response.data.success) {
            recordTest('Update Settings', true);
        } else {
            recordTest('Update Settings', false, 'Update failed');
        }
    } catch (error) {
        recordTest('Update Settings', false, error.response?.data?.message || error.message);
    }

    // Test 38: Create Offer
    try {
        log('\n[38] Testing Create Offer...', 'cyan');
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const response = await api.post('/offers', {
            name: 'خصم الصيف',
            description: 'خصم 20% على جميع المشروبات',
            offer_type: 'percentage',
            discount_value: 20,
            start_date: today.toISOString().split('T')[0],
            end_date: nextMonth.toISOString().split('T')[0],
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.offer = response.data.data;
            recordTest('Create Offer', true);
        } else {
            recordTest('Create Offer', false, 'No offer data');
        }
    } catch (error) {
        recordTest('Create Offer', false, error.response?.data?.message || error.message);
    }

    // Test 39: Get Offers
    try {
        log('\n[39] Testing Get Offers...', 'cyan');
        const response = await api.get('/offers');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Offers', true);
        } else {
            recordTest('Get Offers', false, 'No offers data');
        }
    } catch (error) {
        recordTest('Get Offers', false, error.response?.data?.message || error.message);
    }

    // Test 40: Create Daily Discount
    try {
        log('\n[40] Testing Create Daily Discount...', 'cyan');
        const today = new Date().toISOString().split('T')[0];

        const response = await api.post('/daily-discounts', {
            name: 'خصم اليوم',
            description: 'خصم خاص لليوم',
            discount_type: 'percentage',
            discount_value: 15,
            target_date: today,
            is_active: true
        });

        if (response.data.success && response.data.data) {
            testData.dailyDiscount = response.data.data;
            recordTest('Create Daily Discount', true);
        } else {
            recordTest('Create Daily Discount', false, 'No discount data');
        }
    } catch (error) {
        recordTest('Create Daily Discount', false, error.response?.data?.message || error.message);
    }

    // Test 41: Get Daily Discounts
    try {
        log('\n[41] Testing Get Daily Discounts...', 'cyan');
        const response = await api.get('/daily-discounts');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Daily Discounts', true);
        } else {
            recordTest('Get Daily Discounts', false, 'No discounts data');
        }
    } catch (error) {
        recordTest('Get Daily Discounts', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 8: EXPENSES
// ════════════════════════════════════════════════════════════════

async function testExpenses() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 8: EXPENSES                                         ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 42: Create Expense
    try {
        log('\n[42] Testing Create Expense...', 'cyan');
        const response = await api.post('/expenses', {
            description: 'فاتورة كهرباء',
            amount: 500.00,
            category: 'utilities',
            expense_date: new Date().toISOString().split('T')[0],
            notes: 'فاتورة شهرية'
        });

        if (response.data.success && response.data.data) {
            testData.expense = response.data.data;
            recordTest('Create Expense', true);
        } else {
            recordTest('Create Expense', false, 'No expense data');
        }
    } catch (error) {
        recordTest('Create Expense', false, error.response?.data?.message || error.message);
    }

    // Test 43: Get Expenses
    try {
        log('\n[43] Testing Get Expenses...', 'cyan');
        const response = await api.get('/expenses');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Expenses', true);
        } else {
            recordTest('Get Expenses', false, 'No expenses data');
        }
    } catch (error) {
        recordTest('Get Expenses', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// PHASE 9: STOCK TRANSFERS
// ════════════════════════════════════════════════════════════════

async function testStockTransfers() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  PHASE 9: STOCK TRANSFERS                                  ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════╝', 'magenta');

    // Test 44: Get Stock Transfers
    try {
        log('\n[44] Testing Get Stock Transfers...', 'cyan');
        const response = await api.get('/stock-transfers');

        if (response.data.success && Array.isArray(response.data.data)) {
            recordTest('Get Stock Transfers', true);
        } else {
            recordTest('Get Stock Transfers', false, 'No transfers data');
        }
    } catch (error) {
        recordTest('Get Stock Transfers', false, error.response?.data?.message || error.message);
    }
}

// ════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ════════════════════════════════════════════════════════════════

async function runAllTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║  COMPREHENSIVE SYSTEM TEST - TESTING EVERYTHING            ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    log('Starting at: ' + new Date().toLocaleString('ar-EG'), 'blue');

    const startTime = Date.now();

    try {
        // Phase 1: Authentication
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            log('\n❌ Authentication failed. Cannot continue testing.', 'red');
            return;
        }

        // Phase 2: Products & Categories
        await testProductManagement();

        // Phase 3: Inventory Management
        await testInventoryManagement();

        // Phase 4: Product Recipes
        await testProductRecipes();

        // Phase 5: Orders & Stock Deduction
        await testOrdersAndStockDeduction();

        // Phase 6: Reports & Dashboard
        await testReportsAndDashboard();

        // Phase 7: Settings & Offers
        await testSettingsAndOffers();

        // Phase 8: Expenses
        await testExpenses();

        // Phase 9: Stock Transfers
        await testStockTransfers();

    } catch (error) {
        log('\n❌ Unexpected error during testing:', 'red');
        console.error(error);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print summary
    log('\n\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║  TEST SUMMARY                                              ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    const total = testResults.length;

    log(`\n✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, 'red');
    log(`📊 Total:  ${total}`, 'cyan');
    log(`⏱️  Duration: ${duration}s`, 'cyan');

    if (failed > 0) {
        log('\n❌ Failed Tests:', 'red');
        testResults.filter(t => !t.passed).forEach((test, index) => {
            log(`${index + 1}. ${test.name}`, 'red');
            if (test.details) {
                log(`   ${test.details}`, 'yellow');
            }
        });
    } else {
        log('\n🎉 All tests passed! System is working perfectly!', 'green');
    }

    log('\nFinished at: ' + new Date().toLocaleString('ar-EG'), 'blue');
}

// Run tests
runAllTests().catch(error => {
    log('\n❌ Fatal error:', 'red');
    console.error(error);
    process.exit(1);
});
