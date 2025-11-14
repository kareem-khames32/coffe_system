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
import {
  DollarSign,
  ShoppingBag,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await reportsAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError(error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-900 mb-2">
            حدث خطأ أثناء تحميل البيانات
          </h2>
          <p className="text-amber-700 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900">لوحة التحكم</h1>
        <p className="text-amber-700 mt-1">نظرة عامة على أداء المقهى</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="مبيعات اليوم"
          value={`${formatCurrency(stats?.todaySales)} ج.م`}
          icon={DollarSign}
          color="bg-gradient-to-br from-coffee-600 to-coffee-500"
        />
        <StatCard
          title="عدد الطلبات"
          value={stats?.todayOrders || 0}
          icon={ShoppingBag}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="طلبات معلقة"
          value={stats?.pendingOrders || 0}
          icon={AlertCircle}
          color="bg-gradient-to-br from-orange-500 to-red-500"
        />
        <StatCard
          title="صافي الربح"
          value={`${formatCurrency(stats?.todayProfit)} ج.م`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-4">مبيعات آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.salesChart || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#d97706"
                strokeWidth={3}
                name="المبيعات"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Types */}
        <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-4">
            مقارنة الطلبات (داخلي / أونلاين)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.orderTypes || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="order_type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#d97706" name="عدد الطلبات" />
              <Bar dataKey="total" fill="#f59e0b" name="الإجمالي" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 mb-4">أكثر المنتجات مبيعاً</h3>
        <div className="space-y-3">
          {stats?.topProducts?.map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-coffee-600 to-coffee-500 p-3 rounded-full shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-900">{product.product_name}</p>
                  <p className="text-sm text-amber-700">
                    تم بيع {product.total_sold} وحدة
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-lg">
                  {formatCurrency(product.revenue)} ج.م
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockProducts > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="font-bold text-orange-900 text-lg">
                تنبيه: منتجات قليلة المخزون
              </p>
              <p className="text-sm text-orange-700">
                هناك {stats.lowStockProducts} منتج يحتاج إلى إعادة تخزين
              </p>
            </div>
          </div>
        </div>
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

export default Dashboard;
