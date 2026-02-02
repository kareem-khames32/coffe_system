import { useEffect, useState } from 'react';
import { expensesAPI } from '../api/services';
import { Plus, Edit, Trash2, X, DollarSign, Calendar, FileText } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'utilities',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getAll();
      setExpenses(response.data.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (!filterDate) return true;
    return expense.expense_date.startsWith(filterDate);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, data);
        alert('تم تحديث المصروف بنجاح');
      } else {
        await expensesAPI.create(data);
        alert('تم إضافة المصروف بنجاح');
      }
      fetchExpenses();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date.split('T')[0],
      notes: expense.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

    try {
      await expensesAPI.delete(id);
      alert('تم حذف المصروف بنجاح');
      fetchExpenses();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'utilities',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      utilities: '⚡',
      rent: '🏠',
      salaries: '💰',
      maintenance: '🔧',
      supplies: '📦',
      other: '📝',
    };
    return icons[category] || '📝';
  };

  const getCategoryName = (category) => {
    const names = {
      utilities: 'فواتير',
      rent: 'إيجار',
      salaries: 'رواتب',
      maintenance: 'صيانة',
      supplies: 'مستلزمات',
      other: 'أخرى',
    };
    return names[category] || category;
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المصروفات</h1>
          <p className="text-gray-600 mt-1">إدارة المصروفات اليومية</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مصروف جديد
        </button>
      </div>

      {/* Stats & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">إجمالي المصروفات</p>
              <p className="text-3xl font-bold mt-2">{getTotalExpenses().toFixed(2)} ج.م</p>
              <p className="text-red-100 text-sm mt-1">
                {filteredExpenses.length} مصروف
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <DollarSign className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline ml-2" />
            تصفية حسب الشهر
          </label>
          <input
            type="month"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="mt-2 text-sm text-coffee-600 hover:text-coffee-700"
            >
              إزالة التصفية
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-700 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الوصف</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الفئة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المبلغ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">ملاحظات</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(expense.expense_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-coffee-100 text-coffee-700">
                      <span>{getCategoryIcon(expense.category)}</span>
                      {getCategoryName(expense.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-red-600">
                      {parseFloat(expense.amount).toFixed(2)} ج.م
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {expense.notes || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مصروفات</h3>
              <p className="text-gray-500">
                {filterDate ? 'لا توجد مصروفات في هذا الشهر' : 'قم بإضافة أول مصروف'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="مثال: فاتورة كهرباء"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    disabled={loading}
                  >
                    <option value="utilities">⚡ فواتير</option>
                    <option value="rent">🏠 إيجار</option>
                    <option value="salaries">💰 رواتب</option>
                    <option value="maintenance">🔧 صيانة</option>
                    <option value="supplies">📦 مستلزمات</option>
                    <option value="other">📝 أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="100.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ المصروف *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="أي ملاحظات إضافية..."
                    rows="3"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingExpense ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
