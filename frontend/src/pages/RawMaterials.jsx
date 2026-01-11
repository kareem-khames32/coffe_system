import { useEffect, useState } from 'react';
import { rawMaterialsAPI, suppliersAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Package, Search, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [adjustingMaterial, setAdjustingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    current_stock: 0,
    min_stock: 0,
    unit_cost: 0,
    supplier_id: '',
    is_active: true,
  });
  const [adjustData, setAdjustData] = useState({
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, suppliersRes] = await Promise.all([
        rawMaterialsAPI.getAll(),
        suppliersAPI.getActive(),
      ]);
      setMaterials(materialsRes.data.data);
      setSuppliers(suppliersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'low_stock' && material.current_stock <= material.min_stock) ||
      (filterStatus === 'active' && material.is_active) ||
      (filterStatus === 'inactive' && !material.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        unit_cost: parseFloat(formData.unit_cost),
        supplier_id: formData.supplier_id || null,
      };

      if (editingMaterial) {
        await rawMaterialsAPI.update(editingMaterial.id, data);
        alert('تم تحديث المادة بنجاح');
      } else {
        await rawMaterialsAPI.create(data);
        alert('تم إضافة المادة بنجاح');
      }
      fetchData();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await rawMaterialsAPI.adjustStock(adjustingMaterial.id, adjustData);
      alert('تم تعديل المخزون بنجاح');
      fetchData();
      closeAdjustModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      unit: material.unit,
      current_stock: material.current_stock,
      min_stock: material.min_stock,
      unit_cost: material.unit_cost,
      supplier_id: material.supplier_id || '',
      is_active: material.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

    try {
      await rawMaterialsAPI.delete(id);
      alert('تم حذف المادة بنجاح');
      fetchData();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openAdjustModal = (material) => {
    setAdjustingMaterial(material);
    setAdjustData({
      adjustment_type: 'add',
      quantity: 0,
      reason: '',
    });
    setShowAdjustModal(true);
  };

  const openModal = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      description: '',
      unit: '',
      current_stock: 0,
      min_stock: 0,
      unit_cost: 0,
      supplier_id: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMaterial(null);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustingMaterial(null);
  };

  const getStockStatus = (current, min) => {
    if (current === 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'نفذ المخزون' };
    if (current <= min) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'مخزون منخفض' };
    return { color: 'text-green-600', bg: 'bg-green-50', label: 'متوفر' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المواد الخام</h1>
          <p className="text-gray-600 mt-1">إدارة مخزون المواد الخام</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مادة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن مادة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          >
            <option value="all">جميع المواد</option>
            <option value="low_stock">مخزون منخفض</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-700 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">المادة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الوحدة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المخزون الحالي</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الحد الأدنى</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">سعر الوحدة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المورد</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMaterials.map((material) => {
                const stockStatus = getStockStatus(material.current_stock, material.min_stock);
                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-cream-100 p-2 rounded">
                          <Package className="w-5 h-5 text-coffee-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{material.name}</div>
                          {material.description && (
                            <div className="text-sm text-gray-500">{material.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{material.unit}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${stockStatus.bg}`}>
                        {material.current_stock <= material.min_stock && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span className={`font-semibold ${stockStatus.color}`}>
                          {material.current_stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{material.min_stock}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-coffee-600">
                      {material.unit_cost} ج.م
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {material.supplier_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          material.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {material.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAdjustModal(material)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="تعديل المخزون"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مواد</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'لا توجد نتائج مطابقة'
                  : 'قم بإضافة أول مادة خام'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Material Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingMaterial ? 'تعديل المادة' : 'إضافة مادة جديدة'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المادة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوحدة *
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="كجم، لتر، قطعة..."
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المورد
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    disabled={loading}
                  >
                    <option value="">بدون مورد</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المخزون الحالي *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, current_stock: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد الأدنى للمخزون *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
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
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
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
                    <span className="text-sm font-medium text-gray-700">مادة نشطة</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingMaterial ? 'تحديث' : 'إضافة'}
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

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">تعديل مخزون {adjustingMaterial.name}</h2>
              <button
                onClick={closeAdjustModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">المخزون الحالي</div>
                <div className="text-2xl font-bold text-gray-900">
                  {adjustingMaterial.current_stock} {adjustingMaterial.unit}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع التعديل</label>
                <select
                  value={adjustData.adjustment_type}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustment_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                  disabled={loading}
                >
                  <option value="add">إضافة</option>
                  <option value="subtract">خصم</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية *</label>
                <input
                  type="number"
                  step="0.001"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السبب *</label>
                <textarea
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="سبب التعديل..."
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'تأكيد'}
                </button>
                <button
                  type="button"
                  onClick={closeAdjustModal}
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

export default RawMaterials;
