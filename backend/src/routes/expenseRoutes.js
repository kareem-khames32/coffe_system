const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', checkPermission('can_view_reports'), expenseController.getAllExpenses);
router.get('/total', checkPermission('can_view_reports'), expenseController.getTotalExpenses);
router.get('/:id', checkPermission('can_view_reports'), expenseController.getExpenseById);

router.post('/', checkPermission('can_add_expenses'), expenseController.createExpense);
router.put('/:id', checkPermission('can_add_expenses'), expenseController.updateExpense);
router.delete('/:id', checkPermission('can_add_expenses'), expenseController.deleteExpense);

module.exports = router;
