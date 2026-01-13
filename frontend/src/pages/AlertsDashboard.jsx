import { useState, useEffect } from 'react';
import { alertsAPI, rawMaterialsAPI } from '../api/services';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

const AlertsDashboard = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [thresholds, setThresholds] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdForm, setThresholdForm] = useState({
    raw_material_id: '',
    low_stock_threshold: 10,
    critical_stock_threshold: 5,
    expiry_warning_days: 30,
    enabled: true,
  });

  // Filters
  const [filters, setFilters] = useState({
    alert_type: '',
    severity: '',
    is_resolved: false,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'alerts') {
        await fetchAlerts();
        await fetchSummary();
      } else if (activeTab === 'thresholds') {
        await fetchThresholds();
        const materialsRes = await rawMaterialsAPI.getAll();
        setMaterials(materialsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    const response = await alertsAPI.getAll(filters);
    setAlerts(response.data.data);
  };

  const fetchSummary = async () => {
    const response = await alertsAPI.getUnresolvedSummary();
    setSummary(response.data.data);
  };

  const fetchThresholds = async () => {
    const response = await alertsAPI.getThresholds({});
    setThresholds(response.data.data);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertsAPI.markAsRead(id);
      fetchData();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleResolve = async (id) => {
    const notes = prompt('ملاحظات الحل (اختياري):');
    try {
      await alertsAPI.resolve(id, { notes });
      fetchData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا التنبيه؟')) return;
    try {
      await alertsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    if (!confirm('هل تريد فحص النظام وإنشاء التنبيهات التلقائية؟')) return;
    try {
      const response = await alertsAPI.generateAuto();
      alert(`تم إنشاء ${response.data.data.alerts_created} تنبيه جديد`);
      fetchData();
    } catch (error) {
      console.error('Error generating alerts:', error);
      alert('حدث خطأ أثناء إنشاء التنبيهات');
    }
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    try {
      await alertsAPI.setThreshold(thresholdForm);
      setShowThresholdModal(false);
      setThresholdForm({
        raw_material_id: '',
        low_stock_threshold: 10,
        critical_stock_threshold: 5,
        expiry_warning_days: 30,
        enabled: true,
      });
      fetchThresholds();
    } catch (error) {
      console.error('Error saving threshold:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleDeleteThreshold = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحدود؟')) return;
    try {
      await alertsAPI.deleteThreshold(id);
      fetchThresholds();
    } catch (error) {
      console.error('Error deleting threshold:', error);
    }
  };

  const getAlertTypeLabel = (type) => {
    const types = {
      low_stock: 'مخزون منخفض',
      expiry_warning: 'تحذير انتهاء صلاحية',
      overdue_payment: 'دفعة متأخرة',
      transfer_pending: 'تحويل معلق',
      count_variance: 'فرق جرد',
      custom: 'مخصص',
    };
    return types[type] || type;
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'حرج' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'تحذير' },
      info: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'معلومات' },
    };
    const badge = badges[severity] || badges.info;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const tabs = [
    { id: 'alerts', name: 'التنبيهات', icon: Bell },
    { id: 'thresholds', name: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التنبيهات</h1>
          <p className="text-gray-600">مركز إدارة التنبيهات والإشعارات</p>
        </div>
        <button
          onClick={handleGenerateAlerts}
          className="bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          فحص وإنشاء تنبيهات
        </button>
      </div>

      {/* Summary Cards */}
      {summary && activeTab === 'alerts' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">إجمالي التنبيهات</p>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-coffee-600">
              {summary.totals.total_alerts}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">تنبيهات حرجة</p>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {summary.totals.critical_count}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">تحذيرات</p>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {summary.totals.warning_count}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">معلومات</p>
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {summary.totals.info_count}
            </p>
          </div>
        </div>
      )}

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
          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع التنبيه
                    </label>
                    <select
                      value={filters.alert_type}
                      onChange={(e) => setFilters({ ...filters, alert_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">جميع الأنواع</option>
                      <option value="low_stock">مخزون منخفض</option>
                      <option value="expiry_warning">تحذير انتهاء صلاحية</option>
                      <option value="overdue_payment">دفعة متأخرة</option>
                      <option value="transfer_pending">تحويل معلق</option>
                      <option value="count_variance">فرق جرد</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأهمية
                    </label>
                    <select
                      value={filters.severity}
                      onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">جميع المستويات</option>
                      <option value="critical">حرج</option>
                      <option value="warning">تحذير</option>
                      <option value="info">معلومات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة
                    </label>
                    <select
                      value={filters.is_resolved}
                      onChange={(e) =>
                        setFilters({ ...filters, is_resolved: e.target.value === 'true' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="false">غير محلولة</option>
                      <option value="true">محلولة</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={fetchData}
                      className="w-full bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد تنبيهات</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`bg-white rounded-lg shadow-md p-4 ${
                        !alert.is_read ? 'border-r-4 border-coffee-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getAlertIcon(alert.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                              {getSeverityBadge(alert.severity)}
                              <span className="text-xs text-gray-500">
                                {getAlertTypeLabel(alert.alert_type)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                {new Date(alert.created_at).toLocaleString('ar-EG')}
                              </span>
                              {alert.warehouse_name && (
                                <span>المستودع: {alert.warehouse_name}</span>
                              )}
                              {alert.is_resolved && (
                                <span className="text-green-600 font-medium">
                                  ✓ تم الحل
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(alert.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="تحديد كمقروء"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!alert.is_resolved && (
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="text-green-600 hover:text-green-700"
                              title="حل"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="text-red-600 hover:text-red-700"
                            title="حذف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowThresholdModal(true)}
                  className="bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                >
                  إضافة حدود جديدة
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المادة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المخزون الحالي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        حد تحذير
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        حد حرج
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        أيام انتهاء
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
                    {thresholds.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          لا توجد حدود مُعرّفة
                        </td>
                      </tr>
                    ) : (
                      thresholds.map((threshold) => (
                        <tr key={threshold.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {threshold.material_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {threshold.current_stock} {threshold.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {threshold.low_stock_threshold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {threshold.critical_stock_threshold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {threshold.expiry_warning_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {threshold.enabled ? (
                              <span className="text-green-600 text-sm">مفعّل</span>
                            ) : (
                              <span className="text-gray-400 text-sm">معطّل</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteThreshold(threshold.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Add/Edit Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">تعيين حدود التنبيه</h2>
            <form onSubmit={handleSaveThreshold} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المادة الخام *
                </label>
                <select
                  value={thresholdForm.raw_material_id}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, raw_material_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد التحذير (مخزون منخفض) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={thresholdForm.low_stock_threshold}
                  onChange={(e) =>
                    setThresholdForm({
                      ...thresholdForm,
                      low_stock_threshold: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الحرج (مخزون حرج) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={thresholdForm.critical_stock_threshold}
                  onChange={(e) =>
                    setThresholdForm({
                      ...thresholdForm,
                      critical_stock_threshold: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أيام تحذير انتهاء الصلاحية *
                </label>
                <input
                  type="number"
                  value={thresholdForm.expiry_warning_days}
                  onChange={(e) =>
                    setThresholdForm({
                      ...thresholdForm,
                      expiry_warning_days: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={thresholdForm.enabled}
                  onChange={(e) =>
                    setThresholdForm({ ...thresholdForm, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-coffee-600"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">
                  تفعيل التنبيهات
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-coffee-600 text-white px-4 py-2 rounded-lg hover:bg-coffee-700"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowThresholdModal(false)}
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

export default AlertsDashboard;
