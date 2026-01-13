import { useState, useEffect } from 'react';
import { fifoAPI, rawMaterialsAPI, warehousesAPI } from '../api/services';
import {
  Package,
  History,
  BarChart3,
  Plus,
  Calendar,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';

const FIFOManagement = () => {
  const [activeTab, setActiveTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [consumptionHistory, setConsumptionHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [consumeForm, setConsumeForm] = useState({
    quantity_consumed: '',
    consumption_type: 'production',
    notes: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    material_id: '',
    warehouse_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'batches') {
        await fetchBatches();
      } else if (activeTab === 'history') {
        await fetchHistory();
      } else if (activeTab === 'stats') {
        await fetchStats();
      }

      // Load materials and warehouses for filters
      const [materialsRes, warehousesRes] = await Promise.all([
        rawMaterialsAPI.getAll(),
        warehousesAPI.getAll(),
      ]);
      setMaterials(materialsRes.data.data);
      setWarehouses(warehousesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    const response = await fifoAPI.getAvailableBatches(filters);
    setBatches(response.data.data);
  };

  const fetchHistory = async () => {
    const response = await fifoAPI.getConsumptionHistory(filters);
    setConsumptionHistory(response.data.data);
  };

  const fetchStats = async () => {
    const response = await fifoAPI.getConsumptionStats(filters);
    setStats(response.data.data);
  };

  const handleRecordConsumption = async (e) => {
    e.preventDefault();
    try {
      await fifoAPI.recordConsumption({
        batch_id: selectedBatch.id,
        ...consumeForm,
      });
      setShowConsumeModal(false);
      setSelectedBatch(null);
      setConsumeForm({
        quantity_consumed: '',
        consumption_type: 'production',
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error recording consumption:', error);
      alert('حدث خطأ أثناء تسجيل الاستهلاك');
    }
  };

  const openConsumeModal = (batch) => {
    setSelectedBatch(batch);
    setShowConsumeModal(true);
  };

  const getConsumptionTypeLabel = (type) => {
    const types = {
      production: 'إنتاج',
      adjustment: 'تعديل',
      sale: 'بيع',
      waste: 'هدر',
    };
    return types[type] || type;
  };

  const tabs = [
    { id: 'batches', name: 'الدفعات المتاحة', icon: Package },
    { id: 'history', name: 'سجل الاستهلاك', icon: History },
    { id: 'stats', name: 'الإحصائيات', icon: BarChart3 },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">إدارة FIFO</h1>
        <p className="text-gray-600">نظام الوارد أولاً صادر أولاً لاستهلاك المواد الخام</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المادة الخام
            </label>
            <select
              value={filters.material_id}
              onChange={(e) => setFilters({ ...filters, material_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">جميع المواد</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المستودع</label>
            <select
              value={filters.warehouse_id}
              onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">جميع المستودعات</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
            >
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      ) : (
        <>
          {/* Available Batches Tab */}
          {activeTab === 'batches' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        رقم الدفعة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المستودع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الكمية المتبقية
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        تاريخ الإنتاج
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        تاريخ الانتهاء
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          لا توجد دفعات متاحة
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {batch.batch_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {batch.material_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {batch.warehouse_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {batch.remaining_quantity} {batch.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {batch.production_date || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {batch.expiry_date || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {batch.days_until_expiry !== null && batch.days_until_expiry <= 30 && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                batch.days_until_expiry <= 7
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                <AlertTriangle className="w-3 h-3 ml-1" />
                                {batch.days_until_expiry} يوم متبقي
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openConsumeModal(batch)}
                              className="text-coffee-600 hover:text-coffee-700 font-medium"
                            >
                              تسجيل استهلاك
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Consumption History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        رقم الدفعة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المستودع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الكمية المستهلكة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        نوع الاستهلاك
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المستخدم
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consumptionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          لا يوجد سجل استهلاك
                        </td>
                      </tr>
                    ) : (
                      consumptionHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(record.consumption_date).toLocaleString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.batch_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.material_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.warehouse_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.quantity_consumed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {getConsumptionTypeLabel(record.consumption_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.consumed_by_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* By Material */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-coffee-600" />
                  الاستهلاك حسب المادة
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          المادة
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          إجمالي الاستهلاك
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          عدد الدفعات
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          عدد المرات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.by_material.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.name}</td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {parseFloat(item.total_consumed).toFixed(2)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.batches_used}</td>
                          <td className="px-4 py-2 text-sm">{item.consumption_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Type */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">الاستهلاك حسب النوع</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {stats.by_type.map((item) => (
                    <div key={item.consumption_type} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        {getConsumptionTypeLabel(item.consumption_type)}
                      </p>
                      <p className="text-2xl font-bold text-coffee-600">{item.count}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        الكمية: {parseFloat(item.total_quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Consume Modal */}
      {showConsumeModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">تسجيل استهلاك من دفعة</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                الدفعة: <span className="font-medium">{selectedBatch.batch_number}</span>
              </p>
              <p className="text-sm text-gray-600">
                المادة: <span className="font-medium">{selectedBatch.material_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                المتبقي:{' '}
                <span className="font-medium">
                  {selectedBatch.remaining_quantity} {selectedBatch.unit}
                </span>
              </p>
            </div>

            <form onSubmit={handleRecordConsumption} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكمية المستهلكة *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={consumeForm.quantity_consumed}
                  onChange={(e) =>
                    setConsumeForm({ ...consumeForm, quantity_consumed: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500"
                  required
                  max={selectedBatch.remaining_quantity}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الاستهلاك *
                </label>
                <select
                  value={consumeForm.consumption_type}
                  onChange={(e) =>
                    setConsumeForm({ ...consumeForm, consumption_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500"
                  required
                >
                  <option value="production">إنتاج</option>
                  <option value="adjustment">تعديل</option>
                  <option value="sale">بيع</option>
                  <option value="waste">هدر</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={consumeForm.notes}
                  onChange={(e) => setConsumeForm({ ...consumeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                >
                  تسجيل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConsumeModal(false);
                    setSelectedBatch(null);
                  }}
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

export default FIFOManagement;
