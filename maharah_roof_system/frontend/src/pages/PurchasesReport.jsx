import { useEffect, useState } from 'react';
import { inventoryReportsAPI, suppliersAPI } from '../api/services';
import {
  ShoppingCart,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Download,
  AlertCircle,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const PurchasesReport = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [purchases, setPurchases] = useState([]);
  const [dailyPurchases, setDailyPurchases] = useState([]);
  const [monthlyPurchases, setMonthlyPurchases] = useState([]);
  const [topMaterials, setTopMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dailyDays, setDailyDays] = useState(30);
  const [monthlyMonths, setMonthlyMonths] = useState(6);
  const [topDays, setTopDays] = useState(30);
  const [topLimit, setTopLimit] = useState(10);

  // Summary stats
  const [totalAmount, setTotalAmount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, fromDate, toDate, selectedSupplier, dailyDays, monthlyMonths, topDays, topLimit]);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getActive();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      switch (activeTab) {
        case 'list':
          const params = {};
          if (fromDate) params.from = fromDate;
          if (toDate) params.to = toDate;
          if (selectedSupplier) params.supplier_id = selectedSupplier;

          const purchasesRes = await inventoryReportsAPI.getPurchasesReport(params);
          setPurchases(purchasesRes.data.data.purchases);
          setTotalAmount(purchasesRes.data.data.total);
          setPurchaseCount(purchasesRes.data.data.count);
          break;

        case 'daily':
          const dailyRes = await inventoryReportsAPI.getDailyPurchases(dailyDays);
          setDailyPurchases(dailyRes.data.data);
          break;

        case 'monthly':
          const monthlyRes = await inventoryReportsAPI.getMonthlyPurchases(monthlyMonths);
          setMonthlyPurchases(monthlyRes.data.data);
          break;

        case 'top-materials':
          const topRes = await inventoryReportsAPI.getTopPurchasedMaterials(topDays, topLimit);
          setTopMaterials(topRes.data.data);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching purchases report:', error);
      setError(error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedSupplier('');
  };

  const exportToExcel = () => {
    alert('سيتم تنفيذ تصدير Excel قريباً');
  };

  const tabs = [
    { id: 'list', name: 'قائمة المشتريات', icon: ShoppingCart },
    { id: 'daily', name: 'يومي', icon: Calendar },
    { id: 'monthly', name: 'شهري', icon: BarChart3 },
    { id: 'top-materials', name: 'الأكثر شراءً', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            تقارير المشتريات
          </h1>
          <p className="text-amber-700 mt-1">عرض وتحليل مشتريات المخزون</p>
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

      {/* Filters for List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية المشتريات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">من تاريخ:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-semibold mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-semibold mb-2">المورد:</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
              >
                <option value="">جميع الموردين</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-amber-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                إعادة تعيين
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {activeTab === 'list' && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                <p className="text-blue-100 text-sm">عدد المشتريات</p>
                <p className="text-2xl font-bold">{purchaseCount}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
                <p className="text-green-100 text-sm">الإجمالي</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)} ج.م</p>
              </div>
            </div>
          )}
        </div>
      )}

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
          {/* Purchases List */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المورد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        عدد المواد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المبلغ الإجمالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المستخدم
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-amber-700">
                          لا توجد مشتريات تطابق المعايير المحددة
                        </td>
                      </tr>
                    ) : (
                      purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {purchase.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(purchase.purchase_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {purchase.supplier_name}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">
                            {purchase.items_count} مادة
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold">
                            {formatCurrency(purchase.total_amount)} ج.م
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {purchase.created_by_name || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Purchases */}
          {activeTab === 'daily' && (
            <>
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
                <label className="block text-amber-900 font-semibold mb-2">الفترة الزمنية:</label>
                <select
                  value={dailyDays}
                  onChange={(e) => setDailyDays(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                >
                  <option value={7}>آخر 7 أيام</option>
                  <option value={14}>آخر 14 يوم</option>
                  <option value={30}>آخر 30 يوم</option>
                  <option value={60}>آخر 60 يوم</option>
                  <option value={90}>آخر 90 يوم</option>
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-4">
                  المشتريات اليومية - آخر {dailyDays} يوم
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyPurchases}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="purchase_date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `${formatCurrency(value)} ج.م`}
                      labelStyle={{ direction: 'rtl' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_amount"
                      stroke="#d97706"
                      strokeWidth={3}
                      name="إجمالي المشتريات"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Monthly Purchases */}
          {activeTab === 'monthly' && (
            <>
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
                <label className="block text-amber-900 font-semibold mb-2">عدد الأشهر:</label>
                <select
                  value={monthlyMonths}
                  onChange={(e) => setMonthlyMonths(Number(e.target.value))}
                  className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                >
                  <option value={3}>آخر 3 أشهر</option>
                  <option value={6}>آخر 6 أشهر</option>
                  <option value={12}>آخر 12 شهر</option>
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-4">
                  المشتريات الشهرية - آخر {monthlyMonths} شهر
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyPurchases}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `${formatCurrency(value)} ج.م`}
                      labelStyle={{ direction: 'rtl' }}
                    />
                    <Legend />
                    <Bar dataKey="total_amount" fill="#d97706" name="إجمالي المشتريات" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Top Materials */}
          {activeTab === 'top-materials' && (
            <>
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">الفترة:</label>
                    <select
                      value={topDays}
                      onChange={(e) => setTopDays(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    >
                      <option value={7}>آخر 7 أيام</option>
                      <option value={30}>آخر 30 يوم</option>
                      <option value={60}>آخر 60 يوم</option>
                      <option value={90}>آخر 90 يوم</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">العدد:</label>
                    <select
                      value={topLimit}
                      onChange={(e) => setTopLimit(Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    >
                      <option value={5}>أعلى 5 مواد</option>
                      <option value={10}>أعلى 10 مواد</option>
                      <option value={20}>أعلى 20 مادة</option>
                      <option value={50}>أعلى 50 مادة</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          الترتيب
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          اسم المادة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          الكمية المشتراة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          عدد المشتريات
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          إجمالي القيمة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                          متوسط السعر
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-amber-100">
                      {topMaterials.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-amber-700">
                            لا توجد مشتريات لهذه الفترة
                          </td>
                        </tr>
                      ) : (
                        topMaterials.map((material, index) => (
                          <tr key={material.material_id} className="hover:bg-amber-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center">
                                <span className="font-bold text-amber-900 bg-coffee-100 px-3 py-1 rounded-full">
                                  #{index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-amber-900">
                              {material.material_name}
                            </td>
                            <td className="px-6 py-4 text-blue-600 font-semibold">
                              {formatCurrency(material.total_quantity)} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-purple-600 font-semibold">
                              {material.purchase_count} مرة
                            </td>
                            <td className="px-6 py-4 text-green-600 font-bold">
                              {formatCurrency(material.total_value)} ج.م
                            </td>
                            <td className="px-6 py-4 text-amber-700 font-semibold">
                              {formatCurrency(material.avg_price)} ج.م
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

export default PurchasesReport;
