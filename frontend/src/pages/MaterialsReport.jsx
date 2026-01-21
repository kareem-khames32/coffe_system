import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { inventoryReportsAPI } from '../api/services';
import {
  Package,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Activity,
  Download,
} from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const MaterialsReport = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'summary';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [summary, setSummary] = useState(null);
  const [materialsByValue, setMaterialsByValue] = useState([]);
  const [lowStockMaterials, setLowStockMaterials] = useState([]);
  const [outOfStockMaterials, setOutOfStockMaterials] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [noMovement, setNoMovement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consumptionDays, setConsumptionDays] = useState(30);
  const [noMovementDays, setNoMovementDays] = useState(60);

  useEffect(() => {
    fetchData();
  }, [activeTab, consumptionDays, noMovementDays]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      switch (activeTab) {
        case 'summary':
          const summaryRes = await inventoryReportsAPI.getMaterialsSummary();
          setSummary(summaryRes.data.data);
          break;
        case 'by-value':
          const byValueRes = await inventoryReportsAPI.getMaterialsByValue();
          setMaterialsByValue(byValueRes.data.data);
          break;
        case 'low-stock':
          const lowStockRes = await inventoryReportsAPI.getLowStockMaterials();
          setLowStockMaterials(lowStockRes.data.data);
          break;
        case 'out-of-stock':
          const outOfStockRes = await inventoryReportsAPI.getOutOfStockMaterials();
          setOutOfStockMaterials(outOfStockRes.data.data);
          break;
        case 'consumption':
          const consumptionRes = await inventoryReportsAPI.getMaterialsConsumption(consumptionDays);
          setConsumption(consumptionRes.data.data);
          break;
        case 'no-movement':
          const noMovementRes = await inventoryReportsAPI.getNoMovementMaterials(noMovementDays);
          setNoMovement(noMovementRes.data.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching materials report:', error);
      setError(error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    let csvContent = '';
    let filename = 'materials-report';

    switch (activeTab) {
      case 'summary':
        if (!summary) return alert('لا توجد بيانات للتصدير');
        filename = 'materials-summary';
        csvContent = 'التقرير,القيمة\n';
        csvContent += `إجمالي المواد,${summary.total_materials || 0}\n`;
        csvContent += `القيمة الإجمالية,${formatCurrency(summary.total_value)} ج.م\n`;
        csvContent += `مواد قليلة المخزون,${summary.low_stock_count || 0}\n`;
        csvContent += `مواد نفذت,${summary.out_of_stock_count || 0}\n`;
        break;

      case 'by-value':
        if (!materialsByValue.length) return alert('لا توجد بيانات للتصدير');
        filename = 'materials-by-value';
        csvContent = 'الترتيب,اسم المادة,المخزون الحالي,الوحدة,سعر الوحدة,القيمة الإجمالية\n';
        materialsByValue.forEach((m, i) => {
          csvContent += `${i + 1},${m.name},${m.current_stock},${m.unit},${formatCurrency(m.unit_cost)},${formatCurrency(m.total_value)}\n`;
        });
        break;

      case 'low-stock':
        if (!lowStockMaterials.length) return alert('لا توجد بيانات للتصدير');
        filename = 'low-stock-materials';
        csvContent = 'اسم المادة,المخزون الحالي,الحد الأدنى,الوحدة,المستودع\n';
        lowStockMaterials.forEach((m) => {
          csvContent += `${m.name},${m.current_stock},${m.min_stock || '-'},${m.unit},${m.warehouse_name || '-'}\n`;
        });
        break;

      case 'out-of-stock':
        if (!outOfStockMaterials.length) return alert('لا توجد بيانات للتصدير');
        filename = 'out-of-stock-materials';
        csvContent = 'اسم المادة,المخزون الحالي,الوحدة,المستودع,المورد\n';
        outOfStockMaterials.forEach((m) => {
          csvContent += `${m.name},${m.current_stock},${m.unit},${m.warehouse_name || '-'},${m.supplier_name || '-'}\n`;
        });
        break;

      case 'consumption':
        if (!consumption.length) return alert('لا توجد بيانات للتصدير');
        filename = `consumption-report-${consumptionDays}-days`;
        csvContent = 'اسم المادة,الكمية المستهلكة,الوحدة,القيمة,المخزون الحالي,معدل الاستهلاك اليومي\n';
        consumption.forEach((m) => {
          csvContent += `${m.material_name},${formatCurrency(m.total_consumed)},${m.unit},${formatCurrency(m.consumption_value)},${formatCurrency(m.current_stock)},${formatCurrency(m.daily_rate)}\n`;
        });
        break;

      case 'no-movement':
        if (!noMovement.length) return alert('لا توجد بيانات للتصدير');
        filename = `no-movement-${noMovementDays}-days`;
        csvContent = 'اسم المادة,المخزون الحالي,الوحدة,القيمة,آخر حركة\n';
        noMovement.forEach((m) => {
          const lastMovement = m.last_movement ? new Date(m.last_movement).toLocaleDateString('ar-EG') : 'لا يوجد';
          csvContent += `${m.name},${m.current_stock},${m.unit},${formatCurrency(m.total_value)},${lastMovement}\n`;
        });
        break;

      default:
        return alert('لا توجد بيانات للتصدير');
    }

    // Add UTF-8 BOM for Arabic support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const tabs = [
    { id: 'summary', name: 'الملخص العام', icon: Package },
    { id: 'by-value', name: 'حسب القيمة', icon: DollarSign },
    { id: 'low-stock', name: 'مخزون قليل', icon: AlertTriangle },
    { id: 'out-of-stock', name: 'نفذ المخزون', icon: AlertCircle },
    { id: 'consumption', name: 'الاستهلاك', icon: TrendingDown },
    { id: 'no-movement', name: 'بدون حركة', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <Package className="w-8 h-8" />
            تقارير المواد الخام
          </h1>
          <p className="text-amber-700 mt-1">عرض كافة تقارير وإحصائيات المواد الخام</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          تصدير Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-2">
        <div className="flex flex-wrap gap-2">
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
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">حدث خطأ</h2>
            <p className="text-amber-700 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="إجمالي المواد"
                value={summary.total_materials || 0}
                icon={Package}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="القيمة الإجمالية"
                value={`${formatCurrency(summary.total_value)} ج.م`}
                icon={DollarSign}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatCard
                title="مواد قليلة المخزون"
                value={summary.low_stock_count || 0}
                icon={AlertTriangle}
                color="bg-gradient-to-br from-orange-500 to-orange-600"
              />
              <StatCard
                title="مواد نفذت"
                value={summary.out_of_stock_count || 0}
                icon={AlertCircle}
                color="bg-gradient-to-br from-red-500 to-red-600"
              />
            </div>
          )}

          {/* By Value Tab */}
          {activeTab === 'by-value' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        اسم المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المخزون الحالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        سعر الوحدة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        القيمة الإجمالية
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المستودع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {materialsByValue.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                          لا توجد مواد
                        </td>
                      </tr>
                    ) : (
                      materialsByValue.map((material, index) => (
                        <tr key={material.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-amber-900 bg-coffee-100 px-3 py-1 rounded-full">
                                #{index + 1}
                              </span>
                              <span className="font-semibold text-amber-900">{material.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(material.current_stock)} {material.unit}
                          </td>
                          <td className="px-6 py-4 text-green-600 font-semibold">
                            {formatCurrency(material.unit_cost)} ج.م
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold text-lg">
                            {formatCurrency(material.total_value)} ج.م
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {material.warehouse_name || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Stock Tab */}
          {activeTab === 'low-stock' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-orange-50 to-yellow-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        اسم المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المخزون الحالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الحد الأدنى
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        النقص
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        قيمة النقص
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المورد
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {lowStockMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ جميع المواد فوق الحد الأدنى
                        </td>
                      </tr>
                    ) : (
                      lowStockMaterials.map((material) => (
                        <tr key={material.id} className="hover:bg-orange-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {material.name}
                          </td>
                          <td className="px-6 py-4 text-orange-600 font-semibold">
                            {formatCurrency(material.current_stock)} {material.unit}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(material.min_stock)} {material.unit}
                          </td>
                          <td className="px-6 py-4 text-red-600 font-bold">
                            {formatCurrency(material.shortage)} {material.unit}
                          </td>
                          <td className="px-6 py-4 text-red-600 font-bold">
                            {formatCurrency(material.shortage_value)} ج.م
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {material.supplier_name || '-'}
                            {material.supplier_phone && (
                              <div className="text-xs text-gray-500">{material.supplier_phone}</div>
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

          {/* Out of Stock Tab */}
          {activeTab === 'out-of-stock' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        اسم المادة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الحد الأدنى
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الوحدة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المستودع
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المورد
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {outOfStockMaterials.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ لا توجد مواد نفذت من المخزون
                        </td>
                      </tr>
                    ) : (
                      outOfStockMaterials.map((material) => (
                        <tr key={material.id} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-amber-900">{material.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {formatCurrency(material.min_stock)} {material.unit}
                          </td>
                          <td className="px-6 py-4 text-amber-700">{material.unit}</td>
                          <td className="px-6 py-4 text-amber-700">
                            {material.warehouse_name || '-'}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {material.supplier_name || '-'}
                            {material.supplier_phone && (
                              <div className="text-xs text-gray-500">{material.supplier_phone}</div>
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

          {/* Consumption Tab */}
          {activeTab === 'consumption' && (
            <>
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
                <label className="block text-amber-900 font-semibold mb-2">الفترة الزمنية:</label>
                <select
                  value={consumptionDays}
                  onChange={(e) => setConsumptionDays(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                >
                  <option value={7}>آخر 7 أيام</option>
                  <option value={14}>آخر 14 يوم</option>
                  <option value={30}>آخر 30 يوم</option>
                  <option value={60}>آخر 60 يوم</option>
                  <option value={90}>آخر 90 يوم</option>
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          اسم المادة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          الكمية المستهلكة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          القيمة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          المخزون الحالي
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          معدل الاستهلاك اليومي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-amber-100">
                      {consumption.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                            لا توجد بيانات استهلاك لهذه الفترة
                          </td>
                        </tr>
                      ) : (
                        consumption.map((material) => (
                          <tr key={material.id} className="hover:bg-amber-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-amber-900">
                              {material.material_name}
                            </td>
                            <td className="px-6 py-4 text-red-600 font-bold">
                              {formatCurrency(material.total_consumed)} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-red-600 font-semibold">
                              {formatCurrency(material.consumption_value)} ج.م
                            </td>
                            <td className="px-6 py-4 text-amber-700">
                              {formatCurrency(material.current_stock)} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-blue-600 font-semibold">
                              {formatCurrency(material.daily_rate)} {material.unit}/يوم
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* No Movement Tab */}
          {activeTab === 'no-movement' && (
            <>
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
                <label className="block text-amber-900 font-semibold mb-2">
                  المواد التي لم تتحرك منذ:
                </label>
                <select
                  value={noMovementDays}
                  onChange={(e) => setNoMovementDays(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                >
                  <option value={30}>30 يوم</option>
                  <option value={60}>60 يوم</option>
                  <option value={90}>90 يوم</option>
                  <option value={180}>180 يوم</option>
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          اسم المادة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          المخزون الحالي
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          قيمة المخزون
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          آخر حركة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          عدد الأيام
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-amber-100">
                      {noMovement.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-green-600 font-semibold">
                            ✓ جميع المواد لها حركة نشطة
                          </td>
                        </tr>
                      ) : (
                        noMovement.map((material) => (
                          <tr key={material.id} className="hover:bg-amber-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-amber-900">
                              {material.name}
                            </td>
                            <td className="px-6 py-4 text-amber-700">
                              {formatCurrency(material.current_stock)} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-green-600 font-semibold">
                              {formatCurrency(material.stock_value)} ج.م
                            </td>
                            <td className="px-6 py-4 text-amber-700">
                              {material.last_transaction_date
                                ? new Date(material.last_transaction_date).toLocaleDateString('ar-EG')
                                : 'لا توجد حركة'}
                            </td>
                            <td className="px-6 py-4 text-red-600 font-bold">
                              {material.days_since_last_transaction || '-'} يوم
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-amber-700 text-sm font-semibold">{title}</p>
          <p className="text-3xl font-bold mt-2 text-amber-900">{value}</p>
        </div>
        <div className={`${color} p-4 rounded-full shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

export default MaterialsReport;
