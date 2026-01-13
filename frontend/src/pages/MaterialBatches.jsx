import { useEffect, useState } from 'react';
import { materialBatchesAPI, rawMaterialsAPI, warehousesAPI } from '../api/services';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  XCircle,
  BarChart3,
  DollarSign,
} from 'lucide-react';

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const MaterialBatches = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [batches, setBatches] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expiringDays, setExpiringDays] = useState(30);

  // Form data
  const [formData, setFormData] = useState({
    raw_material_id: '',
    batch_number: '',
    quantity: '',
    unit: '',
    production_date: '',
    expiry_date: '',
    warehouse_id: '',
    unit_cost: '',
    notes: '',
  });

  useEffect(() => {
    fetchMaterials();
    fetchWarehouses();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, expiringDays]);

  const fetchMaterials = async () => {
    try {
      const response = await rawMaterialsAPI.getActive();
      setMaterials(response.data.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getActive();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await materialBatchesAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'all') {
        const response = await materialBatchesAPI.getAll({ status: 'active' });
        setBatches(response.data.data);
      } else if (activeTab === 'expiring') {
        const response = await materialBatchesAPI.getExpiring(expiringDays);
        setExpiringBatches(response.data.data);
      } else if (activeTab === 'expired') {
        const response = await materialBatchesAPI.getExpired();
        setExpiredBatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();

    try {
      await materialBatchesAPI.addBatch(formData);
      alert('تم إضافة الدفعة بنجاح');
      setShowAddModal(false);
      setFormData({
        raw_material_id: '',
        batch_number: '',
        quantity: '',
        unit: '',
        production_date: '',
        expiry_date: '',
        warehouse_id: '',
        unit_cost: '',
        notes: '',
      });
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error adding batch:', error);
      alert(error.response?.data?.message || 'فشل في إضافة الدفعة');
    }
  };

  const handleDisposeBatch = async (id) => {
    const reason = prompt('سبب التخلص من الدفعة:');
    if (!reason) return;

    try {
      await materialBatchesAPI.disposeBatch(id, { disposal_reason: reason });
      alert('تم التخلص من الدفعة بنجاح');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error disposing batch:', error);
      alert('فشل في التخلص من الدفعة');
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;

    try {
      await materialBatchesAPI.deleteBatch(id);
      alert('تم حذف الدفعة بنجاح');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('فشل في حذف الدفعة');
    }
  };

  const handleMaterialChange = (materialId) => {
    const material = materials.find((m) => m.id === parseInt(materialId));
    if (material) {
      setFormData({
        ...formData,
        raw_material_id: materialId,
        unit: material.unit,
        warehouse_id: material.warehouse_id || '',
      });
    }
  };

  const tabs = [
    { id: 'all', name: 'جميع الدفعات', icon: Package },
    { id: 'expiring', name: 'قرب الانتهاء', icon: AlertTriangle },
    { id: 'expired', name: 'منتهية الصلاحية', icon: AlertCircle },
    { id: 'stats', name: 'الإحصائيات', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <Package className="w-8 h-8" />
            دفعات المواد الخام
          </h1>
          <p className="text-amber-700 mt-1">تتبع تواريخ الصلاحية وإدارة الدفعات</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة دفعة
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-coffee-600 to-coffee-500 text-white shadow-lg'
                  : 'bg-gray-100 text-amber-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expiring Days Filter */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
          <label className="block text-amber-900 font-semibold mb-2">عرض الدفعات التي تنتهي خلال:</label>
          <select
            value={expiringDays}
            onChange={(e) => setExpiringDays(Number(e.target.value))}
            className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
          >
            <option value={7}>7 أيام</option>
            <option value={14}>14 يوم</option>
            <option value={30}>30 يوم</option>
            <option value={60}>60 يوم</option>
            <option value={90}>90 يوم</option>
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
        </div>
      ) : (
        <>
          {/* All Batches */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الدفعة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الكمية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الإنتاج
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المستودع
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        القيمة
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-amber-700">
                          لا توجد دفعات
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {batch.batch_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">{batch.material_name}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(batch.quantity)} {batch.unit}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {batch.production_date
                              ? new Date(batch.production_date).toLocaleDateString('ar-EG')
                              : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {batch.expiry_date ? (
                              <div>
                                <div className="text-amber-700">
                                  {new Date(batch.expiry_date).toLocaleDateString('ar-EG')}
                                </div>
                                {batch.days_until_expiry !== null && (
                                  <div
                                    className={`text-xs font-semibold ${
                                      batch.days_until_expiry <= 7
                                        ? 'text-red-600'
                                        : batch.days_until_expiry <= 30
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                    }`}
                                  >
                                    {batch.days_until_expiry > 0
                                      ? `باقي ${batch.days_until_expiry} يوم`
                                      : `منتهي منذ ${Math.abs(batch.days_until_expiry)} يوم`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {batch.warehouse_name || '-'}
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold">
                            {formatCurrency(batch.total_value)} ج.م
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {batch.days_until_expiry !== null && batch.days_until_expiry <= 0 && (
                                <button
                                  onClick={() => handleDisposeBatch(batch.id)}
                                  className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                                  title="التخلص من الدفعة"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBatch(batch.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expiring Batches */}
          {activeTab === 'expiring' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-orange-50 to-yellow-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الدفعة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الكمية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        باقي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المستودع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {expiringBatches.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ لا توجد دفعات قرب الانتهاء
                        </td>
                      </tr>
                    ) : (
                      expiringBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-orange-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {batch.batch_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">{batch.material_name}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(batch.quantity)} {batch.unit}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(batch.expiry_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                batch.days_until_expiry <= 7
                                  ? 'bg-red-100 text-red-700'
                                  : batch.days_until_expiry <= 14
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {batch.days_until_expiry} يوم
                            </span>
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {batch.warehouse_name || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expired Batches */}
          {activeTab === 'expired' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الدفعة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الكمية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        منتهي منذ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {expiredBatches.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ لا توجد دفعات منتهية
                        </td>
                      </tr>
                    ) : (
                      expiredBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {batch.batch_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">{batch.material_name}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(batch.quantity)} {batch.unit}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(batch.expiry_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              {batch.days_expired} يوم
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {batch.status === 'disposed' ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                تم التخلص
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                منتهي
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-semibold">إجمالي الدفعات</p>
                    <p className="text-3xl font-bold mt-2">{stats.total_batches}</p>
                  </div>
                  <Package className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-semibold">دفعات نشطة</p>
                    <p className="text-3xl font-bold mt-2">{stats.active_batches}</p>
                  </div>
                  <Package className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-semibold">تنتهي قريباً (30 يوم)</p>
                    <p className="text-3xl font-bold mt-2">{stats.expiring_soon}</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-semibold">منتهية الصلاحية</p>
                    <p className="text-3xl font-bold mt-2">{stats.expired_batches}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm font-semibold">تم التخلص منها</p>
                    <p className="text-3xl font-bold mt-2">{stats.disposed_batches}</p>
                  </div>
                  <XCircle className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-semibold">القيمة الإجمالية</p>
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(stats.total_value)} ج.م
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 opacity-80" />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">إضافة دفعة جديدة</h2>

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    المادة الخام <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.raw_material_id}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  >
                    <option value="">اختر المادة</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    رقم الدفعة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    الكمية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    الوحدة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">تاريخ الإنتاج</label>
                  <input
                    type="date"
                    value={formData.production_date}
                    onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">المستودع</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  >
                    <option value="">اختر المستودع</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">تكلفة الوحدة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-900 font-semibold mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg font-semibold"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-amber-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
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

export default MaterialBatches;
