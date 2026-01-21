import { useEffect, useState } from 'react';
import { stockTransfersAPI, warehousesAPI, rawMaterialsAPI } from '../api/services';
import {
  Truck,
  Package,
  AlertCircle,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  BarChart3,
  Eye,
  Trash2,
} from 'lucide-react';

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const StockTransfers = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [transfers, setTransfers] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [stats, setStats] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState({
    raw_material_id: '',
    quantity: '',
    unit: '',
    notes: '',
  });

  useEffect(() => {
    fetchWarehouses();
    fetchMaterials();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getActive();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await rawMaterialsAPI.getActive();
      setMaterials(response.data.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await stockTransfersAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'all') {
        const response = await stockTransfersAPI.getAll();
        setTransfers(response.data.data);
      } else if (activeTab === 'pending') {
        const response = await stockTransfersAPI.getPending();
        setPendingTransfers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.raw_material_id || !currentItem.quantity) {
      alert('المادة والكمية مطلوبة');
      return;
    }

    const material = materials.find((m) => m.id === parseInt(currentItem.raw_material_id));
    if (!material) return;

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...currentItem,
          material_name: material.name,
          unit: material.unit,
        },
      ],
    });

    setCurrentItem({
      raw_material_id: '',
      quantity: '',
      unit: '',
      notes: '',
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('يجب إضافة مادة واحدة على الأقل');
      return;
    }

    try {
      await stockTransfersAPI.create(formData);
      alert('تم إنشاء النقلية بنجاح');
      setShowCreateModal(false);
      setFormData({
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
      });
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error.response?.data?.message || 'فشل في إنشاء النقلية');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذه النقلية؟')) return;

    try {
      await stockTransfersAPI.approve(id);
      alert('تمت الموافقة بنجاح');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert('فشل في الموافقة');
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('هل تم استلام هذه النقلية بالفعل؟')) return;

    try {
      await stockTransfersAPI.complete(id);
      alert('تم استلام النقلية بنجاح');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error completing transfer:', error);
      alert('فشل في الاستلام');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;

    try {
      await stockTransfersAPI.cancel(id, { reason });
      alert('تم إلغاء النقلية');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      alert('فشل في الإلغاء');
    }
  };

  const handleViewDetails = async (transfer) => {
    try {
      const response = await stockTransfersAPI.getById(transfer.id);
      setSelectedTransfer(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      alert('فشل في تحميل التفاصيل');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'معلق' },
      in_transit: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'في الطريق' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'مكتمل' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغي' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-semibold`}>
        {badge.label}
      </span>
    );
  };

  const tabs = [
    { id: 'all', name: 'جميع النقليات', icon: Truck },
    { id: 'pending', name: 'معلقة', icon: Clock },
    { id: 'stats', name: 'الإحصائيات', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <Truck className="w-8 h-8" />
            نقل المخزون
          </h1>
          <p className="text-amber-700 mt-1">إدارة نقل المواد بين المستودعات</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إنشاء نقلية
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
        </div>
      ) : (
        <>
          {/* All Transfers */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم النقلية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        من
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        إلى
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        عدد المواد
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-amber-700">
                          لا توجد نقليات
                        </td>
                      </tr>
                    ) : (
                      transfers.map((transfer) => (
                        <tr key={transfer.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {transfer.transfer_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">
                            {transfer.from_warehouse_name}
                          </td>
                          <td className="px-6 py-4 text-amber-900">{transfer.to_warehouse_name}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(transfer.transfer_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">
                            {transfer.items_count} مادة
                          </td>
                          <td className="px-6 py-4 text-center">{getStatusBadge(transfer.status)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(transfer)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {transfer.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(transfer.id)}
                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    title="الموافقة"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(transfer.id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="إلغاء"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {transfer.status === 'in_transit' && (
                                <>
                                  <button
                                    onClick={() => handleComplete(transfer.id)}
                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    title="استلام"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(transfer.id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="إلغاء"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
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

          {/* Pending Transfers */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-yellow-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم النقلية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        من
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        إلى
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        عدد المواد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        طلب بواسطة
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {pendingTransfers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ لا توجد نقليات معلقة
                        </td>
                      </tr>
                    ) : (
                      pendingTransfers.map((transfer) => (
                        <tr key={transfer.id} className="hover:bg-yellow-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {transfer.transfer_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">{transfer.from_warehouse}</td>
                          <td className="px-6 py-4 text-amber-900">{transfer.to_warehouse}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(transfer.transfer_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">
                            {transfer.items_count} مادة
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {transfer.requested_by_name}
                          </td>
                          <td className="px-6 py-4 text-center">{getStatusBadge(transfer.status)}</td>
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
                    <p className="text-blue-100 text-sm font-semibold">إجمالي النقليات</p>
                    <p className="text-3xl font-bold mt-2">{stats.total_transfers}</p>
                  </div>
                  <Truck className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-semibold">معلقة</p>
                    <p className="text-3xl font-bold mt-2">{stats.pending_transfers}</p>
                  </div>
                  <Clock className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-semibold">في الطريق</p>
                    <p className="text-3xl font-bold mt-2">{stats.in_transit_transfers}</p>
                  </div>
                  <ArrowRight className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-semibold">مكتملة</p>
                    <p className="text-3xl font-bold mt-2">{stats.completed_transfers}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-semibold">ملغاة</p>
                    <p className="text-3xl font-bold mt-2">{stats.cancelled_transfers}</p>
                  </div>
                  <XCircle className="w-12 h-12 opacity-80" />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">إنشاء نقلية جديدة</h2>

            <form onSubmit={handleCreateTransfer} className="space-y-6">
              {/* Transfer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    من مستودع <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.from_warehouse_id}
                    onChange={(e) =>
                      setFormData({ ...formData, from_warehouse_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
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
                  <label className="block text-amber-900 font-semibold mb-2">
                    إلى مستودع <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.to_warehouse_id}
                    onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
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
                  <label className="block text-amber-900 font-semibold mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  />
                </div>
              </div>

              {/* Add Item */}
              <div className="border-t-2 border-amber-200 pt-4">
                <h3 className="text-lg font-bold text-amber-900 mb-4">إضافة مواد</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-amber-900 font-semibold mb-2">المادة</label>
                    <select
                      value={currentItem.raw_material_id}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, raw_material_id: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    >
                      <option value="">اختر المادة</option>
                      {materials
                        .filter((m) => m.warehouse_id === parseInt(formData.from_warehouse_id))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (المخزون: {formatCurrency(m.current_stock)} {m.unit})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">الكمية</label>
                    <input
                      type="number"
                      step="0.001"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="border-2 border-amber-200 rounded-lg p-4">
                  <h4 className="font-bold text-amber-900 mb-3">المواد المضافة:</h4>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                      >
                        <div>
                          <span className="font-semibold text-amber-900">{item.material_name}</span>
                          <span className="text-amber-700 ml-3">
                            {formatCurrency(item.quantity)} {item.unit}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-amber-900 font-semibold mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  rows="3"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg font-semibold"
                >
                  إنشاء النقلية
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-amber-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">
              تفاصيل النقلية: {selectedTransfer.transfer.transfer_number}
            </h2>

            {/* Transfer Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-amber-700 text-sm">من:</p>
                <p className="font-bold text-amber-900">
                  {selectedTransfer.transfer.from_warehouse_name}
                </p>
              </div>
              <div>
                <p className="text-amber-700 text-sm">إلى:</p>
                <p className="font-bold text-amber-900">
                  {selectedTransfer.transfer.to_warehouse_name}
                </p>
              </div>
              <div>
                <p className="text-amber-700 text-sm">التاريخ:</p>
                <p className="font-bold text-amber-900">
                  {new Date(selectedTransfer.transfer.transfer_date).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <div>
                <p className="text-amber-700 text-sm">الحالة:</p>
                {getStatusBadge(selectedTransfer.transfer.status)}
              </div>
            </div>

            {/* Items */}
            <div className="border-t-2 border-amber-200 pt-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">المواد:</h3>
              <div className="space-y-2">
                {selectedTransfer.items.map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">{item.material_name}</span>
                      <span className="text-amber-700 font-semibold">
                        {formatCurrency(item.quantity)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 bg-gray-200 text-amber-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfers;
