const axios = require('axios');

// ════════════════════════════════════════════════════════════════
// Complete System Workflow Testing
// ════════════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let testData = {
    supplier: null,
    rawMaterial: null,
    purchase: null,
    payment: null,
    product: null,
    recipe: null,
    order: null
};

// Helper function
const log = (message, color = 'white') => {
    const colors = {
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// ════════════════════════════════════════════════════════════════
// Test Functions
// ════════════════════════════════════════════════════════════════

async function login() {
    log('\n📝 STEP 1: Login as admin...', 'cyan');
    try {
        const response = await api.post('/auth/login', {
            username: 'admin',
            password: '123456'
        });

        if (response.data.success) {
            token = response.data.data.token;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            log('✅ Login successful!', 'green');
            return true;
        }
    } catch (error) {
        log('❌ Login failed!', 'red');
        console.error('Full error:', error.message);
        console.error('Error code:', error.code);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

async function addSupplier() {
    log('\n🏪 STEP 2: Adding supplier "مورد القهوة"...', 'cyan');
    try {
        const response = await api.post('/suppliers', {
            name: 'مورد القهوة',
            contact_person: 'أحمد محمد',
            phone: '01012345678',
            address: 'القاهرة، مصر',
            is_active: 1
        });

        testData.supplier = response.data.data;
        log(`✅ Supplier added! ID: ${testData.supplier.id}`, 'green');
        return true;
    } catch (error) {
        log('❌ Failed to add supplier: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function addRawMaterial() {
    log('\n☕ STEP 3: Adding raw material "بن عربي"...', 'cyan');
    try {
        const response = await api.post('/raw-materials', {
            name: 'بن عربي فاخر',
            description: 'بن عربي أصلي من اليمن',
            unit: 'كيلو',
            current_stock: 0,
            min_stock: 5,
            unit_cost: 100,
            supplier_id: testData.supplier.id,
            warehouse_id: 1,
            is_active: 1
        });

        testData.rawMaterial = response.data.data;
        log(`✅ Raw material added! ID: ${testData.rawMaterial.id}`, 'green');
        log(`   Initial stock: ${testData.rawMaterial.current_stock} كيلو`, 'white');
        return true;
    } catch (error) {
        log('❌ Failed to add raw material: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function createPurchaseWithCredit() {
    log('\n💰 STEP 4: Creating purchase (10kg) with CREDIT_30 payment...', 'cyan');
    try {
        const response = await api.post('/inventory-purchases', {
            supplier_id: testData.supplier.id,
            warehouse_id: 1,
            purchase_date: new Date().toISOString().split('T')[0],
            invoice_number: 'INV-TEST-001',
            payment_terms: 'credit_30',  // ⬅️ CRITICAL: Credit 30 days
            notes: 'Test purchase with credit payment',
            items: [
                {
                    raw_material_id: testData.rawMaterial.id,
                    quantity: 10,
                    unit: 'كيلو',
                    unit_cost: 100
                }
            ]
        });

        testData.purchase = response.data.data;
        log(`✅ Purchase created! ID: ${testData.purchase.id}`, 'green');
        log(`   Total amount: ${testData.purchase.total_amount} EGP`, 'white');
        log(`   Payment terms: CREDIT_30`, 'yellow');
        return true;
    } catch (error) {
        log('❌ Failed to create purchase: ' + (error.response?.data?.message || error.message), 'red');
        if (error.response?.data) {
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function checkPaymentAutoCreated() {
    log('\n🔍 STEP 5: Checking if supplier payment was AUTO-CREATED...', 'cyan');
    try {
        const response = await api.get('/supplier-payments');

        const payments = response.data.data;
        const autoPayment = payments.find(p => p.purchase_id === testData.purchase.id);

        if (autoPayment) {
            testData.payment = autoPayment;
            log('✅ Payment AUTO-CREATED successfully!', 'green');
            log(`   Payment ID: ${autoPayment.id}`, 'white');
            log(`   Amount due: ${autoPayment.amount_due} EGP`, 'white');
            log(`   Status: ${autoPayment.payment_status}`, 'white');
            log(`   Due date: ${autoPayment.due_date}`, 'white');
            return true;
        } else {
            log('❌ Payment was NOT auto-created!', 'red');
            return false;
        }
    } catch (error) {
        log('❌ Failed to check payments: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function checkStockIncreased() {
    log('\n📊 STEP 6: Verifying stock increased after purchase...', 'cyan');
    try {
        const response = await api.get(`/raw-materials/${testData.rawMaterial.id}`);
        const material = response.data.data;

        log(`   Previous stock: 0 كيلو`, 'white');
        log(`   Current stock: ${material.current_stock} كيلو`, 'white');

        if (parseFloat(material.current_stock) === 10) {
            log('✅ Stock increased correctly!', 'green');
            return true;
        } else {
            log(`❌ Stock is ${material.current_stock}, expected 10`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ Failed to check stock: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function getOrCreateProduct() {
    log('\n📦 STEP 7: Getting/Creating product "قهوة تركي"...', 'cyan');
    try {
        // Try to get existing product
        const listResponse = await api.get('/products');
        const existingProduct = listResponse.data.data.find(p => p.name === 'قهوة تركي');

        if (existingProduct) {
            testData.product = existingProduct;
            log(`✅ Using existing product! ID: ${testData.product.id}`, 'green');
            return true;
        }

        // Create new product if not exists
        const response = await api.post('/products', {
            name: 'قهوة تركي',
            category_id: 1,
            price: 15,
            cost_price: 5,
            description: 'قهوة تركية أصلية',
            is_available: 1,
            is_active: 1
        });

        testData.product = response.data.data;
        log(`✅ Product created! ID: ${testData.product.id}`, 'green');
        return true;
    } catch (error) {
        log('❌ Failed to get/create product: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function createProductRecipe() {
    log('\n🔗 STEP 8: Linking product to raw material (recipe)...', 'cyan');
    try {
        const response = await api.post('/product-recipes', {
            product_id: testData.product.id,
            raw_material_id: testData.rawMaterial.id,
            quantity_needed: 0.02,  // 20 grams (0.02 kg) per cup
            unit: 'كيلو',
            notes: 'وصفة قهوة تركي - 20 جرام لكل فنجان'
        });

        testData.recipe = response.data.data;
        log('✅ Recipe created!', 'green');
        log(`   Product: قهوة تركي`, 'white');
        log(`   Material: بن عربي فاخر`, 'white');
        log(`   Quantity needed: 0.02 كيلو (20 جرام) per unit`, 'white');
        return true;
    } catch (error) {
        log('❌ Failed to create recipe: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

async function createSaleOrder() {
    log('\n🛒 STEP 9: Creating sale order (5 cups of قهوة تركي)...', 'cyan');
    try {
        const orderNumber = 'ORD-' + Date.now();
        const response = await api.post('/orders', {
            order_number: orderNumber,
            order_type: 'dine-in',
            table_number: '5',
            customer_name: 'عميل تجريبي',
            items: [
                {
                    product_id: testData.product.id,
                    quantity: 5,  // 5 cups
                    unit_price: 15,
                    subtotal: 75
                }
            ],
            subtotal: 75,
            discount_amount: 0,
            tax_amount: 0,
            total_amount: 75,
            payment_method: 'cash',
            payment_status: 'paid',
            order_status: 'completed'
        });

        testData.order = response.data.data;
        log('✅ Sale order created!', 'green');
        log(`   Order number: ${orderNumber}`, 'white');
        log(`   Items: 5x قهوة تركي`, 'white');
        log(`   Total: 75 EGP`, 'white');
        return true;
    } catch (error) {
        log('❌ Failed to create order: ' + (error.response?.data?.message || error.message), 'red');
        if (error.response?.data) {
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function verifyStockDeduction() {
    log('\n🔍 STEP 10: Verifying raw material stock DECREASED...', 'cyan');
    try {
        const response = await api.get(`/raw-materials/${testData.rawMaterial.id}`);
        const material = response.data.data;

        const expectedDeduction = 0.02 * 5; // 0.1 kg (100 grams)
        const expectedStock = 10 - expectedDeduction;

        log(`   Stock before sale: 10 كيلو`, 'white');
        log(`   Expected deduction: ${expectedDeduction} كيلو (5 cups × 20g)`, 'white');
        log(`   Current stock: ${material.current_stock} كيلو`, 'white');
        log(`   Expected stock: ${expectedStock} كيلو`, 'white');

        const actualStock = parseFloat(material.current_stock);
        if (Math.abs(actualStock - expectedStock) < 0.01) {
            log('✅ Stock deduction working correctly!', 'green');
            return true;
        } else {
            log(`❌ Stock deduction failed! Current: ${actualStock}, Expected: ${expectedStock}`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ Failed to verify stock: ' + (error.response?.data?.message || error.message), 'red');
        return false;
    }
}

// ════════════════════════════════════════════════════════════════
// Main Test Runner
// ════════════════════════════════════════════════════════════════

async function runCompleteTest() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     COMPLETE SYSTEM WORKFLOW TESTING                       ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    const tests = [
        { name: 'Login', fn: login },
        { name: 'Add Supplier', fn: addSupplier },
        { name: 'Add Raw Material', fn: addRawMaterial },
        { name: 'Create Purchase (Credit 30)', fn: createPurchaseWithCredit },
        { name: 'Verify Payment Auto-Created', fn: checkPaymentAutoCreated },
        { name: 'Verify Stock Increased', fn: checkStockIncreased },
        { name: 'Get/Create Product', fn: getOrCreateProduct },
        { name: 'Create Product Recipe', fn: createProductRecipe },
        { name: 'Create Sale Order', fn: createSaleOrder },
        { name: 'Verify Stock Deduction', fn: verifyStockDeduction }
    ];

    for (const test of tests) {
        const success = await test.fn();
        results.tests.push({ name: test.name, success });

        if (success) {
            results.passed++;
        } else {
            results.failed++;
            log(`\n⚠️  Test "${test.name}" failed. Stopping...`, 'red');
            break;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     TEST SUMMARY                                           ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    log(`\n✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`📊 Total:  ${results.tests.length}\n`, 'cyan');

    results.tests.forEach((test, index) => {
        const icon = test.success ? '✅' : '❌';
        const color = test.success ? 'green' : 'red';
        log(`${icon} ${index + 1}. ${test.name}`, color);
    });

    if (results.failed === 0) {
        log('\n🎉 ALL TESTS PASSED! System is working correctly!', 'green');
    } else {
        log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
    }

    log('\n');
}

// Run tests
runCompleteTest().catch(error => {
    log('Fatal error: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});
