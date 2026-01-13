import axios from './axios';

// Auth
export const authAPI = {
  login: (username, password) => axios.post('/auth/login', { username, password }),
  getCurrentUser: () => axios.get('/auth/me'),
};

// Users
export const usersAPI = {
  getAll: () => axios.get('/users'),
  getById: (id) => axios.get(`/users/${id}`),
  create: (data) => axios.post('/users', data),
  update: (id, data) => axios.put(`/users/${id}`, data),
  delete: (id) => axios.delete(`/users/${id}`),
};

// Categories
export const categoriesAPI = {
  getAll: () => axios.get('/categories'),
  getById: (id) => axios.get(`/categories/${id}`),
  create: (data) => axios.post('/categories', data),
  update: (id, data) => axios.put(`/categories/${id}`, data),
  delete: (id) => axios.delete(`/categories/${id}`),
};

// Products
export const productsAPI = {
  getAll: () => axios.get('/products'),
  getAvailable: () => axios.get('/products/available'),
  getLowStock: () => axios.get('/products/low-stock'),
  getById: (id) => axios.get(`/products/${id}`),
  getByCategory: (categoryId) => axios.get(`/products/category/${categoryId}`),
  create: (data) => axios.post('/products', data),
  update: (id, data) => axios.put(`/products/${id}`, data),
  updateStock: (id, stock) => axios.patch(`/products/${id}/stock`, { stock }),
  delete: (id) => axios.delete(`/products/${id}`),
};

// Orders
export const ordersAPI = {
  getAll: (params) => axios.get('/orders', { params }),
  getPendingCount: () => axios.get('/orders/pending-count'),
  getById: (id) => axios.get(`/orders/${id}`),
  getEditHistory: (id) => axios.get(`/orders/${id}/history`),
  trackOrder: (orderNumber) => axios.get(`/orders/track/${orderNumber}`),
  createInStore: (data) => axios.post('/orders/in-store', data),
  createOnline: (data) => axios.post('/orders/online', data),
  updateStatus: (id, status) => axios.put(`/orders/${id}/status`, { status }),
  edit: (id, data) => axios.put(`/orders/${id}/edit`, data),
  cancel: (id) => axios.delete(`/orders/${id}`),
};

// Offers
export const offersAPI = {
  getAll: () => axios.get('/offers'),
  getActive: () => axios.get('/offers/active'),
  getById: (id) => axios.get(`/offers/${id}`),
  create: (data) => axios.post('/offers', data),
  update: (id, data) => axios.put(`/offers/${id}`, data),
  delete: (id) => axios.delete(`/offers/${id}`),
};

// Daily Discounts
export const dailyDiscountsAPI = {
  getAll: () => axios.get('/daily-discounts'),
  getActive: () => axios.get('/daily-discounts/active'),
  getForDate: (date) => axios.get('/daily-discounts/date', { params: { date } }),
  getById: (id) => axios.get(`/daily-discounts/${id}`),
  create: (data) => axios.post('/daily-discounts', data),
  update: (id, data) => axios.put(`/daily-discounts/${id}`, data),
  delete: (id) => axios.delete(`/daily-discounts/${id}`),
};

// Expenses
export const expensesAPI = {
  getAll: (params) => axios.get('/expenses', { params }),
  getTotal: (params) => axios.get('/expenses/total', { params }),
  getById: (id) => axios.get(`/expenses/${id}`),
  create: (data) => axios.post('/expenses', data),
  update: (id, data) => axios.put(`/expenses/${id}`, data),
  delete: (id) => axios.delete(`/expenses/${id}`),
};

// Purchases
export const purchasesAPI = {
  getAll: (params) => axios.get('/purchases', { params }),
  getTotal: (params) => axios.get('/purchases/total', { params }),
  getById: (id) => axios.get(`/purchases/${id}`),
  create: (data) => axios.post('/purchases', data),
  update: (id, data) => axios.put(`/purchases/${id}`, data),
  delete: (id) => axios.delete(`/purchases/${id}`),
};

// Settings
export const settingsAPI = {
  getAll: () => axios.get('/settings'),
  getByKey: (key) => axios.get(`/settings/${key}`),
  updateSingle: (key, value) => axios.put(`/settings/${key}`, { setting_key: key, setting_value: value }),
  updateMultiple: (data) => axios.put('/settings', data),
  delete: (key) => axios.delete(`/settings/${key}`),
  uploadLogo: (formData) => axios.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteLogo: () => axios.delete('/settings/logo/delete'),
};

// Reports
export const reportsAPI = {
  getDashboard: () => axios.get('/reports/dashboard'),
  getSales: (params) => axios.get('/reports/sales', { params }),
  getProducts: (params) => axios.get('/reports/products', { params }),
  getProfit: (params) => axios.get('/reports/profit', { params }),
  getCategories: (params) => axios.get('/reports/categories', { params }),
  getCustomers: (params) => axios.get('/reports/customers', { params }),
  getPurchasesAndExpenses: (params) => axios.get('/reports/purchases-expenses', { params }),
};

// Suppliers
export const suppliersAPI = {
  getAll: () => axios.get('/suppliers'),
  getActive: () => axios.get('/suppliers/active'),
  getById: (id) => axios.get(`/suppliers/${id}`),
  create: (data) => axios.post('/suppliers', data),
  update: (id, data) => axios.put(`/suppliers/${id}`, data),
  delete: (id) => axios.delete(`/suppliers/${id}`),
};

// Raw Materials
export const rawMaterialsAPI = {
  getAll: () => axios.get('/raw-materials'),
  getActive: () => axios.get('/raw-materials/active'),
  getLowStock: () => axios.get('/raw-materials/low-stock'),
  getById: (id) => axios.get(`/raw-materials/${id}`),
  create: (data) => axios.post('/raw-materials', data),
  update: (id, data) => axios.put(`/raw-materials/${id}`, data),
  adjustStock: (id, data) => axios.patch(`/raw-materials/${id}/adjust`, data),
  delete: (id) => axios.delete(`/raw-materials/${id}`),
};

// Warehouses
export const warehousesAPI = {
  getAll: () => axios.get('/warehouses'),
  getActive: () => axios.get('/warehouses/active'),
  getById: (id) => axios.get(`/warehouses/${id}`),
  create: (data) => axios.post('/warehouses', data),
  update: (id, data) => axios.put(`/warehouses/${id}`, data),
  delete: (id) => axios.delete(`/warehouses/${id}`),
};

// Inventory Purchases
export const inventoryPurchasesAPI = {
  getAll: () => axios.get('/inventory-purchases'),
  getById: (id) => axios.get(`/inventory-purchases/${id}`),
  create: (data) => axios.post('/inventory-purchases', data),
  delete: (id) => axios.delete(`/inventory-purchases/${id}`),
};

// Product Recipes
export const recipesAPI = {
  getProductRecipe: (productId) => axios.get(`/recipes/product/${productId}`),
  updateProductRecipe: (productId, recipe) => axios.put(`/recipes/product/${productId}`, { recipe }),
  checkStockAvailability: (items) => axios.post('/recipes/check-stock', { items }),
};

// Inventory Reports
export const inventoryReportsAPI = {
  // Dashboard
  getDashboardStats: () => axios.get('/reports/inventory/dashboard-stats'),

  // Warehouses Reports
  getWarehousesReport: () => axios.get('/reports/inventory/warehouses'),
  getWarehouseDetails: (id) => axios.get(`/reports/inventory/warehouses/${id}/details`),
  getWarehouseTransactions: (id, params) => axios.get(`/reports/inventory/warehouses/${id}/transactions`, { params }),

  // Raw Materials Reports
  getMaterialsSummary: () => axios.get('/reports/inventory/materials/summary'),
  getMaterialsByValue: () => axios.get('/reports/inventory/materials/by-value'),
  getLowStockMaterials: () => axios.get('/reports/inventory/materials/low-stock'),
  getOutOfStockMaterials: () => axios.get('/reports/inventory/materials/out-of-stock'),
  getNoMovementMaterials: (days) => axios.get('/reports/inventory/materials/no-movement', { params: { days } }),
  getMaterialTransactions: (id, params) => axios.get(`/reports/inventory/materials/${id}/transactions`, { params }),
  getMaterialsConsumption: (days) => axios.get('/reports/inventory/materials/consumption', { params: { days } }),

  // Suppliers Reports
  getSuppliersSummary: () => axios.get('/reports/inventory/suppliers/summary'),
  getSupplierDetails: (id) => axios.get(`/reports/inventory/suppliers/${id}/details`),
  getSupplierPurchases: (id, params) => axios.get(`/reports/inventory/suppliers/${id}/purchases`, { params }),
  getSupplierMaterials: (id) => axios.get(`/reports/inventory/suppliers/${id}/materials`),

  // Purchases Reports
  getPurchasesReport: (params) => axios.get('/reports/inventory/purchases', { params }),
  getDailyPurchases: (days) => axios.get('/reports/inventory/purchases/daily', { params: { days } }),
  getMonthlyPurchases: (months) => axios.get('/reports/inventory/purchases/monthly', { params: { months } }),
  getTopPurchasedMaterials: (days, limit) => axios.get('/reports/inventory/purchases/top-materials', { params: { days, limit } }),
  getMaterialPriceHistory: (id) => axios.get(`/reports/inventory/purchases/material/${id}/price-history`),
};
