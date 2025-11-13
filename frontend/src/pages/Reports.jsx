import { useEffect, useState } from 'react';
import { reportsAPI } from '../api/services';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, FileText } from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getSales(dateRange.start_date, dateRange.end_date);
      setSalesReport(response.data.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6f4e37', '#8b6f47', '#d4a574', '#e8c992', '#f5deb3'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-600 mt-1">تحليل شامل لأداء المقهى</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-4">الفترة الزمنية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="w-full bg-coffee-600 hover:bg-coffee-700 text-white py-2 px-4 rounded-lg transition"
            >
              تحديث التقرير
            </button>
          </div>
        </div>
      </div>

      {salesReport && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-10 h-10" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-green-100 text-sm">إجمالي المبيعات</p>
              <p className="text-3xl font-bold mt-2">
                {parseFloat(salesReport.summary?.total_revenue || 0).toFixed(2)} ج.م
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-10 h-10" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-blue-100 text-sm">عدد الطلبات</p>
              <p className="text-3xl font-bold mt-2">{salesReport.summary?.total_orders || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-10 h-10" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-purple-100 text-sm">متوسط قيمة الطلب</p>
              <p className="text-3xl font-bold mt-2">
                {salesReport.summary?.average_order_value
                  ? parseFloat(salesReport.summary.average_order_value).toFixed(2)
                  : '0.00'}{' '}
                ج.م
              </p>
            </div>

            <div className="bg-gradient-to-br from-coffee-600 to-coffee-700 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-10 h-10" />
                {parseFloat(salesReport.summary?.profit || 0) >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
              </div>
              <p className="text-cream-100 text-sm">صافي الربح</p>
              <p className="text-3xl font-bold mt-2">
                {parseFloat(salesReport.summary?.profit || 0).toFixed(2)} ج.م
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold mb-4">المبيعات اليومية</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesReport.daily_sales || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_revenue"
                    stroke="#6f4e37"
                    strokeWidth={3}
                    name="الإيرادات"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Sales */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold mb-4">المبيعات حسب الفئة</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesReport.category_sales || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total_revenue"
                  >
                    {(salesReport.category_sales || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">أكثر المنتجات مبيعاً</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesReport.top_products || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sold" fill="#8b6f47" name="الكمية المباعة" />
                <Bar dataKey="revenue" fill="#d4a574" name="الإيرادات" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Types Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">مقارنة أنواع الطلبات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={salesReport.order_types || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ order_type, count }) => `${order_type === 'in-store' ? 'داخلي' : 'أونلاين'}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(salesReport.order_types || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {(salesReport.order_types || []).map((type, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {type.order_type === 'in-store' ? '🏪 طلبات داخلية' : '🌐 طلبات أونلاين'}
                      </span>
                      <span className="text-sm text-gray-600">{type.count} طلب</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">الإيرادات:</span>
                      <span className="font-bold text-green-600">
                        {parseFloat(type.total || 0).toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {salesReport.low_stock && salesReport.low_stock.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-orange-900 mb-4">⚠️ تنبيه: منتجات قليلة المخزون</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesReport.low_stock.map((product, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg">
                    <div className="font-semibold text-gray-900">{product.product_name}</div>
                    <div className="text-sm text-gray-600 mt-1">الفئة: {product.category_name}</div>
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-red-600">
                        المخزون المتبقي: {product.stock} وحدة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
