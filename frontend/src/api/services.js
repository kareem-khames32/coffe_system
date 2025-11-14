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
