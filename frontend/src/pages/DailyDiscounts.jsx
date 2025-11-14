import { useEffect, useState } from 'react';
import { dailyDiscountsAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Calendar, Percent, DollarSign, Tag } from 'lucide-react';

const DailyDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    target_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await dailyDiscountsAPI.getAll();
      setDiscounts(response.data.data);
    } catch (error) {
      console.error('Error fetching daily discounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        target_date: formData.target_date,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        await dailyDiscountsAPI.update(editingDiscount.id, data);
        alert('تم تحديث الخصم بنجاح');
      } else {
        await dailyDiscountsAPI.create(data);
        alert('تم إضافة الخصم بنجاح');
      }
      fetchDiscounts();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || '',
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      target_date: discount.target_date ? discount.target_date.split('T')[0] : '',
      is_active: discount.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخصم؟')) return;

    try {
      await dailyDiscountsAPI.delete(id);
      alert('تم حذف الخصم بنجاح');
      fetchDiscounts();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const toggleStatus = async (discount) => {
    try {
      await dailyDiscountsAPI.update(discount.id, {
        ...discount,
        is_active: !discount.is_active,
      });
      fetchDiscounts();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      target_date: '',
      is_active: true,
    });
  };

  const isDatePassed = (date) => {
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  const isToday = (date) => {
    const targetDate = new Date(date);
    const today = new Date();
    return (
      targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الخصومات اليومية</h1>
          <p className="text-gray-600 mt-1">إدارة الخصومات على أيام محددة</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة خصم
        </button>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <div
            key={discount.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
              discount.is_active && isToday(discount.target_date)
                ? 'border-green-500'
                : discount.is_active
                ? 'border-blue-500'
                : 'border-gray-300 opacity-60'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {discount.name}
                  </h3>
                  {discount.description && (
                    <p className="text-sm text-gray-600">{discount.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(discount)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Discount Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  {discount.discount_type === 'percentage' ? (
                    <Percent className="w-5 h-5 text-purple-600" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">قيمة الخصم</p>
                    <p className="text-lg font-bold text-purple-600">
                      {discount.discount_value}
                      {discount.discount_type === 'percentage' ? '%' : ' ج.م'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">التاريخ</p>
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(discount.target_date).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 flex-wrap">
                  {isToday(discount.target_date) && discount.is_active && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      نشط اليوم
                    </span>
                  )}
                  {isDatePassed(discount.target_date) && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      منتهي
                    </span>
                  )}
                  {!isDatePassed(discount.target_date) && !isToday(discount.target_date) && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      قادم
                    </span>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => toggleStatus(discount)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    discount.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {discount.is_active ? 'مفعل' : 'معطل'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {discounts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">لا توجد خصومات يومية</p>
          <p className="text-gray-500 text-sm mt-2">ابدأ بإضافة خصم لأيام محددة</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDiscount ? 'تعديل الخصم' : 'إضافة خصم جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الخصم *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="مثلاً: خصم العطلة الأسبوعية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  rows="2"
                  placeholder="وصف الخصم (اختياري)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع الخصم *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  قيمة الخصم *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder={
                    formData.discount_type === 'percentage' ? 'مثلاً: 15' : 'مثلاً: 50'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الخصم *
                </label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={(e) =>
                    setFormData({ ...formData, target_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-coffee-600 border-gray-300 rounded focus:ring-coffee-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  مفعل
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingDiscount ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDiscounts;
