import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryReportsAPI } from '../api/services';
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
  Package,
  AlertCircle,
  AlertTriangle,
  Warehouse,
  ShoppingCart,
  Users,
  FileText,
  ArrowLeft,
} from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [warehousesData, setWarehousesData] = useState([]);
  const [purchasesData, setPurchasesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch dashboard stats
      const statsResponse = await inventoryReportsAPI.getDashboardStats();
      setStats(statsResponse.data.data);

      // Fetch warehouses data for chart
      const warehousesResponse = await inventoryReportsAPI.getWarehousesReport();
      setWarehousesData(warehousesResponse.data.data);

      // Fetch daily purchases for last 30 days
      const purchasesResponse = await inventoryReportsAPI.getDailyPurchases(30);
      setPurchasesData(purchasesResponse.data.data);

    } catch (error) {
      console.error('Error fetching inventory dashboard:', error);
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Quick links data
  const quickLinks = [
    {
      title: 'تقارير المستودعات',
      description: 'عرض كافة المستودعات والقيم والمعاملات',
      icon: Warehouse,
      color: 'from-blue-500 to-blue-600',
      path: '/inventory-reports/warehouses',
    },
    {
      title: 'تقارير المواد الخام',
      description: 'ملخص المواد، الحد الأدنى، الاستهلاك',
      icon: Package,
      color: 'from-green-500 to-green-600',
      path: '/inventory-reports/materials',
    },
    {
      title: 'تقارير الموردين',
      description: 'تفاصيل الموردين والمشتريات والمواد',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      path: '/inventory-reports/suppliers',
    },
    {
      title: 'تقارير المشتريات',
      description: 'مشتريات حسب الفترة، الأعلى شراءً، تاريخ الأسعار',
      icon: ShoppingCart,
      color: 'from-orange-500 to-orange-600',
      path: '/inventory-reports/purchases',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900">لوحة التحكم - المخزون</h1>
        <p className="text-amber-700 mt-1">نظرة عامة على حالة المخزون والمستودعات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="قيمة المخزون الإجمالية"
          value={`${formatCurrency(stats?.total_inventory_value)} ج.م`}
          icon={DollarSign}
          color="bg-gradient-to-br from-coffee-600 to-coffee-500"
        />
        <StatCard
          title="عدد المواد الخام"
          value={stats?.total_materials || 0}
          icon={Package}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="مواد قليلة المخزون"
          value={stats?.low_stock_count || 0}
          icon={AlertTriangle}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="مواد نفذت من المخزون"
          value={stats?.out_of_stock_count || 0}
          icon={AlertCircle}
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses Value Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-4">قيمة المخزون حسب المستودع</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={warehousesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="warehouse_name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `${formatCurrency(value)} ج.م`}
                labelStyle={{ direction: 'rtl' }}
              />
              <Legend />
              <Bar dataKey="total_value" fill="#d97706" name="القيمة الإجمالية" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Purchases Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-4">المشتريات - آخر 30 يوم</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={purchasesData}>
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
      </div>

      {/* Alerts Section */}
      {(stats?.low_stock_count > 0 || stats?.out_of_stock_count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats?.low_stock_count > 0 && (
            <div
              className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 p-5 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => navigate('/inventory-reports/materials?tab=low-stock')}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-bold text-orange-900 text-lg">
                    تنبيه: مواد قليلة المخزون
                  </p>
                  <p className="text-sm text-orange-700">
                    هناك {stats.low_stock_count} مادة خام تحتاج إلى إعادة تخزين
                  </p>
                </div>
              </div>
            </div>
          )}

          {stats?.out_of_stock_count > 0 && (
            <div
              className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 p-5 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => navigate('/inventory-reports/materials?tab=out-of-stock')}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-bold text-red-900 text-lg">
                    تحذير: مواد نفذت من المخزون
                  </p>
                  <p className="text-sm text-red-700">
                    هناك {stats.out_of_stock_count} مادة خام نفذت من المخزون تماماً
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          التقارير التفصيلية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link, index) => (
            <div
              key={index}
              onClick={() => navigate(link.path)}
              className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`bg-gradient-to-br ${link.color} p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform`}>
                  <link.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 text-lg mb-2">{link.title}</p>
                  <p className="text-sm text-amber-700">{link.description}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-coffee-600 font-semibold group-hover:gap-3 transition-all">
                  <span>عرض التقرير</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

export default InventoryDashboard;
