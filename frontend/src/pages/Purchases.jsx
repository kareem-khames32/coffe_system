import { useEffect, useState } from 'react';
import { purchasesAPI } from '../api/services';
import { Plus, Edit, Trash2, X, ShoppingBasket, Package, DollarSign } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    item_description: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    // Auto-calculate total
    if (formData.quantity && formData.unit_price) {
      const total = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
      setFormData((prev) => ({ ...prev, total_amount: total.toFixed(2) }));
    }
  }, [formData.quantity, formData.unit_price]);

  const fetchPurchases = async () => {
    try {
      const response = await purchasesAPI.getAll();
      setPurchases(response.data.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        total_amount: parseFloat(formData.total_amount),
      };

      if (editingPurchase) {
        await purchasesAPI.update(editingPurchase.id, data);
        alert('تم تحديث عملية الشراء بنجاح');
      } else {
        await purchasesAPI.create(data);
        alert('تم إضافة عملية الشراء بنجاح');
      }
      fetchPurchases();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier_name: purchase.supplier_name,
      item_description: purchase.item_description,
      quantity: purchase.quantity,
      unit_price: purchase.unit_price,
      total_amount: purchase.total_amount,
      purchase_date: purchase.purchase_date.split('T')[0],
      notes: purchase.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف عملية الشراء هذه؟')) return;

    try {
      await purchasesAPI.delete(id);
      alert('تم حذف عملية الشراء بنجاح');
      fetchPurchases();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingPurchase(null);
    setFormData({
      supplier_name: '',
      item_description: '',
      quantity: '',
      unit_price: '',
      total_amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPurchase(null);
  };

  const getTotalPurchases = () => {
    return purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total_amount), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المشتريات</h1>
          <p className="text-gray-600 mt-1">إدارة مشتريات المقهى</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة عملية شراء
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">إجمالي المشتريات</p>
              <p className="text-3xl font-bold mt-2">{getTotalPurchases().toFixed(2)} ج.م</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <DollarSign className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">عدد العمليات</p>
              <p className="text-3xl font-bold mt-2">{purchases.length}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <ShoppingBasket className="w-10 h-10" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">متوسط قيمة الشراء</p>
              <p className="text-3xl font-bold mt-2">
                {purchases.length > 0 ? (getTotalPurchases() / purchases.length).toFixed(2) : '0.00'} ج.م
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <Package className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-700 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المورد</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الصنف</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الكمية</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">سعر الوحدة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجمالي</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(purchase.purchase_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-coffee-100 p-2 rounded-lg">
                        <ShoppingBasket className="w-4 h-4 text-coffee-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{purchase.supplier_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {purchase.item_description}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {purchase.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {parseFloat(purchase.unit_price).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-green-600">
                      {parseFloat(purchase.total_amount).toFixed(2)} ج.م
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
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

          {purchases.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBasket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مشتريات</h3>
              <p className="text-gray-500">قم بإضافة أول عملية شراء</p>
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
                {editingPurchase ? 'تعديل عملية الشراء' : 'إضافة عملية شراء جديدة'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المورد *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="مثال: شركة البن المصري"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الشراء *
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الصنف *
                  </label>
                  <input
                    type="text"
                    value={formData.item_description}
                    onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="مثال: بن برازيلي - 25 كيلو"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="25"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر الوحدة (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="50.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الإجمالي (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 outline-none"
                    placeholder="يتم الحساب تلقائياً"
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
                  {loading ? 'جاري الحفظ...' : editingPurchase ? 'تحديث' : 'إضافة'}
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

export default Purchases;
