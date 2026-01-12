import { useEffect, useState } from 'react';
import { warehousesAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Warehouse, Search, MapPin, FileText } from 'lucide-react';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingWarehouse) {
        await warehousesAPI.update(editingWarehouse.id, formData);
        alert('تم تحديث المستودع بنجاح');
      } else {
        await warehousesAPI.create(formData);
        alert('تم إضافة المستودع بنجاح');
      }
      fetchWarehouses();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location || '',
      description: warehouse.description || '',
      is_active: warehouse.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستودع؟')) return;

    try {
      await warehousesAPI.delete(id);
      alert('تم حذف المستودع بنجاح');
      fetchWarehouses();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      location: '',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستودعات</h1>
          <p className="text-gray-600 mt-1">إدارة المستودعات والفروع</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مستودع جديد
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن مستودع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-coffee-100 p-3 rounded-lg">
                  <Warehouse className="w-6 h-6 text-coffee-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{warehouse.name}</h3>
                  {warehouse.location && (
                    <p className="text-sm text-gray-600">{warehouse.location}</p>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  warehouse.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {warehouse.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {warehouse.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{warehouse.location}</span>
                </div>
              )}
              {warehouse.description && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4 mt-0.5" />
                  <span className="line-clamp-2">{warehouse.description}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(warehouse)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                <Edit className="w-4 h-4" />
                تعديل
              </button>
              <button
                onClick={() => handleDelete(warehouse.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWarehouses.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Warehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد مستودعات</h3>
          <p className="text-gray-500">
            {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'قم بإضافة أول مستودع'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingWarehouse ? 'تعديل المستودع' : 'إضافة مستودع جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستودع *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="مثال: المستودع الرئيسي"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموقع / الفرع
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="مثال: فرع المعادي"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="وصف مختصر للمستودع"
                    rows="3"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4 text-coffee-600 border-gray-300 rounded focus:ring-coffee-500"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-700">مستودع نشط</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingWarehouse ? 'تحديث' : 'إضافة'}
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

export default Warehouses;
