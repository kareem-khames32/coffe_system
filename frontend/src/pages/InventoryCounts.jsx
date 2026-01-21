import { useState, useEffect, Component } from 'react';
import { inventoryCountsAPI, rawMaterialsAPI, warehousesAPI } from '../api/services';
import {
  ClipboardList,
  Plus,
  X,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

// Error Boundary to catch and display errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('InventoryCounts Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-700 rounded-lg m-4">
          <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
          <pre className="bg-red-100 p-4 rounded overflow-auto text-sm">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const InventoryCountsContent = () => {
  const [activeTab, setActiveTab] = useState('counts');
  const [counts, setCounts] = useState([]);
  const [variances, setVariances] = useState([]);
  const [stats, setStats] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState(null);

  const [createForm, setCreateForm] = useState({
    warehouse_id: '',
    count_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [itemForm, setItemForm] = useState({
    raw_material_id: '',
    counted_quantity: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [materialsRes, warehousesRes] = await Promise.all([
        rawMaterialsAPI.getAll(),
        warehousesAPI.getAll(),
      ]);
      setMaterials(materialsRes.data?.data || []);
      setWarehouses(warehousesRes.data?.data || []);

      if (activeTab === 'counts') {
        await fetchCounts();
      } else if (activeTab === 'variances') {
        await fetchVariances();
      } else if (activeTab === 'stats') {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await inventoryCountsAPI.getAll({});
      setCounts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching counts:', error);
      setCounts([]);
    }
  };

  const fetchVariances = async () => {
    try {
      const response = await inventoryCountsAPI.getVariances({});
      setVariances(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching variances:', error);
      setVariances([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await inventoryCountsAPI.getStats({});
      setStats(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  };

  const handleCreateCount = async (e) => {
    e.preventDefault();
    try {
      await inventoryCountsAPI.create(createForm);
      setShowCreateModal(false);
      setCreateForm({
        warehouse_id: '',
        count_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchCounts();
    } catch (error) {
      console.error('Error creating count:', error);
      alert('حدث خطأ أثناء إنشاء الجرد');
    }
  };

  const handleViewDetails = async (count) => {
    try {
      const response = await inventoryCountsAPI.getById(count.id);
      setSelectedCount(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching count details:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await inventoryCountsAPI.addItem(selectedCount.count.id, itemForm);
      setItemForm({
        raw_material_id: '',
        counted_quantity: '',
        notes: '',
      });
      setShowAddItemModal(false);
      // Refresh details
      handleViewDetails(selectedCount.count);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('حدث خطأ أثناء إضافة المادة');
    }
  };

  const handleCompleteCount = async (id, autoAdjust = false) => {
    if (!confirm(`هل أنت متأكد من إكمال الجرد${autoAdjust ? ' وتطبيق التعديلات تلقائياً' : ''}؟`)) {
      return;
    }

    try {
      await inventoryCountsAPI.complete(id, { auto_adjust: autoAdjust });
      setShowDetailsModal(false);
      setSelectedCount(null);
      fetchCounts();
    } catch (error) {
      console.error('Error completing count:', error);
      alert('حدث خطأ أثناء إكمال الجرد');
    }
  };

  const handleCancelCount = async (id) => {
    if (!confirm('هل أنت متأكد من إلغاء الجرد؟')) return;

    try {
      await inventoryCountsAPI.cancel(id);
      setShowDetailsModal(false);
      setSelectedCount(null);
      fetchCounts();
    } catch (error) {
      console.error('Error cancelling count:', error);
      alert('حدث خطأ أثناء إلغاء الجرد');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'مسودة' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'قيد التنفيذ' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'مكتمل' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغي' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getVarianceBadge = (level) => {
    const badges = {
      high: { bg: 'bg-red-100', text: 'text-red-700', label: 'عالي' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'متوسط' },
      low: { bg: 'bg-green-100', text: 'text-green-700', label: 'منخفض' },
    };
    const badge = badges[level] || badges.low;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const tabs = [
    { id: 'counts', name: 'جميع الجرود', icon: ClipboardList },
    { id: 'variances', name: 'الفروقات', icon: AlertTriangle },
    { id: 'stats', name: 'الإحصائيات', icon: BarChart3 },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">الجرد المخزني</h1>
          <p className="text-gray-600">نظام الجرد الفعلي ومطابقة المخزون</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          جرد جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-coffee-600 border-b-2 border-coffee-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      ) : (
        <>
          {/* Counts List */}
          {activeTab === 'counts' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      رقم الجرد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المستودع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      عدد المواد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الفروقات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {counts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        لا توجد جرود
                      </td>
                    </tr>
                  ) : (
                    counts.map((count) => (
                      <tr key={count.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          جرد #{count.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {count.warehouse_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {count.count_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(count.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count.items_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {count.variance_count > 0 && (
                            <span className="text-orange-600 font-medium">
                              {count.variance_count} فرق
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(count)}
                            className="text-coffee-600 hover:text-coffee-700 font-medium"
                          >
                            التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Variances */}
          {activeTab === 'variances' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      رقم الجرد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المادة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المتوقع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الفعلي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الفرق
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      النسبة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المستوى
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variances.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        لا توجد فروقات
                      </td>
                    </tr>
                  ) : (
                    variances.map((variance, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          جرد #{variance.count_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {variance.material_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variance.system_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variance.counted_quantity}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          variance.variance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {variance.variance > 0 ? '+' : ''}{variance.variance}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          Math.abs(variance.variance_percentage || 0) > 10 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {(variance.variance_percentage || 0).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getVarianceBadge(variance.variance_level)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Statistics */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(stats.summary || []).map((item) => (
                  <div key={item.status} className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-sm text-gray-600 mb-2">{getStatusBadge(item.status)}</p>
                    <p className="text-3xl font-bold text-coffee-600">{item.count}</p>
                  </div>
                ))}
              </div>

              {/* Variance Summary */}
              {stats.variance_summary && stats.variance_summary.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">ملخص الفروقات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.variance_summary.map((item) => (
                      <div key={item.variance_level} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {getVarianceBadge(item.variance_level)}
                        </p>
                        <p className="text-2xl font-bold text-coffee-600">{item.count}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          متوسط الفرق: {parseFloat(item.avg_variance_pct).toFixed(2)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Count Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إنشاء جرد جديد</h2>
            <form onSubmit={handleCreateCount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المستودع *
                </label>
                <select
                  value={createForm.warehouse_id}
                  onChange={(e) => setCreateForm({ ...createForm, warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
                <input
                  type="date"
                  value={createForm.count_date}
                  onChange={(e) => setCreateForm({ ...createForm, count_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                >
                  إنشاء
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">تفاصيل الجرد</h2>
                <p className="text-sm text-gray-600">جرد #{selectedCount.count.id}</p>
              </div>
              <div className="flex gap-2">
                {['draft', 'in_progress'].includes(selectedCount.count.status) && (
                  <>
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      إضافة مادة
                    </button>
                    <button
                      onClick={() => handleCompleteCount(selectedCount.count.id, false)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      إكمال
                    </button>
                    <button
                      onClick={() => handleCompleteCount(selectedCount.count.id, true)}
                      className="bg-coffee-600 text-white px-3 py-1 rounded text-sm hover:bg-coffee-700"
                    >
                      إكمال + تعديل
                    </button>
                    <button
                      onClick={() => handleCancelCount(selectedCount.count.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      إلغاء
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">المستودع</p>
                <p className="font-medium">{selectedCount.count.warehouse_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-medium">{selectedCount.count.count_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                {getStatusBadge(selectedCount.count.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">بواسطة</p>
                <p className="font-medium">{selectedCount.count.counted_by_name}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      المادة
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      المتوقع
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      الفعلي
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      الفرق
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCount.items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        لم تتم إضافة مواد بعد
                      </td>
                    </tr>
                  ) : (
                    selectedCount.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">{item.material_name}</td>
                        <td className="px-4 py-2 text-sm">{item.system_quantity}</td>
                        <td className="px-4 py-2 text-sm">{item.counted_quantity}</td>
                        <td className={`px-4 py-2 text-sm font-medium ${
                          item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {item.variance > 0 ? '+' : ''}{item.variance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة مادة للجرد</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المادة الخام *
                </label>
                <select
                  value={itemForm.raw_material_id}
                  onChange={(e) => setItemForm({ ...itemForm, raw_material_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">اختر المادة</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {m.current_stock} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكمية الفعلية *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={itemForm.counted_quantity}
                  onChange={(e) => setItemForm({ ...itemForm, counted_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
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

// Wrapper component with ErrorBoundary
const InventoryCounts = () => (
  <ErrorBoundary>
    <InventoryCountsContent />
  </ErrorBoundary>
);

export default InventoryCounts;
