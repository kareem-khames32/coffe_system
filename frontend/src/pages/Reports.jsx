import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Printer,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { reportsAPI, purchasesAPI } from '../api/services';
import {
  exportSalesReportToExcel,
  exportProductsReportToExcel,
  exportPurchasesReportToExcel,
  exportProfitReportToExcel,
} from '../utils/exportToExcel';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const reportTypes = [
    {
      id: 'sales',
      title: 'تقرير الفواتير المباعة',
      description: 'عرض جميع الفواتير والمبيعات مع الإحصائيات',
      icon: ShoppingCart,
      color: 'from-blue-600 to-blue-700',
    },
    {
      id: 'products',
      title: 'تقرير المنتجات المباعة',
      description: 'تفاصيل المنتجات المباعة والإيرادات',
      icon: Package,
      color: 'from-green-600 to-green-700',
    },
    {
      id: 'purchases',
      title: 'تقرير المشتريات',
      description: 'عرض جميع المشتريات والموردين',
      icon: FileText,
      color: 'from-purple-600 to-purple-700',
    },
    {
      id: 'profit',
      title: 'تقرير صافي الربح',
      description: 'حساب الربح الصافي بعد المصروفات',
      icon: TrendingUp,
      color: 'from-orange-600 to-orange-700',
    },
  ];

  useEffect(() => {
    if (selectedReport) {
      fetchReportData();
    }
  }, [selectedReport, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let response;
      const { start_date, end_date } = dateRange;

      switch (selectedReport) {
        case 'sales':
          response = await reportsAPI.getSales(start_date, end_date);
          setReportData(response.data.data);
          break;
        case 'products':
          response = await reportsAPI.getProducts(start_date, end_date);
          setReportData(response.data.data);
          break;
        case 'purchases':
          response = await purchasesAPI.getAll(start_date, end_date);
          setReportData(response.data.data);
          break;
        case 'profit':
          response = await reportsAPI.getProfit(start_date, end_date);
          setReportData(response.data.data);
          break;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('حدث خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!reportData) return;

    switch (selectedReport) {
      case 'sales':
        exportSalesReportToExcel(reportData, dateRange);
        break;
      case 'products':
        exportProductsReportToExcel(reportData, dateRange);
        break;
      case 'purchases':
        exportPurchasesReportToExcel(reportData, dateRange);
        break;
      case 'profit':
        exportProfitReportToExcel(reportData, dateRange);
        break;
    }
  };

  const selectedReportData = reportTypes.find((r) => r.id === selectedReport);

  if (selectedReport && selectedReportData) {
    return (
      <div className="space-y-6">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <button
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-coffee-600 hover:text-coffee-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للتقارير
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedReportData.title}
            </h1>
            <p className="text-gray-600 mt-1">{selectedReportData.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              تصدير Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </button>
          </div>
        </div>

        {/* Date Range Filter - Hidden when printing */}
        <div className="bg-white p-6 rounded-lg shadow print:hidden">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-coffee-600" />
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">من:</label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start_date: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">إلى:</label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end_date: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                />
              </div>
              <button
                onClick={() => setDateRange({ start_date: '', end_date: '' })}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
          </div>
        ) : (
          <div id="print-area" className="bg-white p-8 rounded-lg shadow">
            {/* Print Header */}
            <div className="hidden print:block mb-6 text-center border-b-2 border-coffee-600 pb-4">
              <h1 className="text-2xl font-bold text-coffee-800">مقهى الأحلام</h1>
              <h2 className="text-xl font-semibold mt-2">{selectedReportData.title}</h2>
              {(dateRange.start_date || dateRange.end_date) && (
                <p className="text-sm text-gray-600 mt-1">
                  {dateRange.start_date && `من: ${new Date(dateRange.start_date).toLocaleDateString('ar-EG')}`}
                  {dateRange.start_date && dateRange.end_date && ' - '}
                  {dateRange.end_date && `إلى: ${new Date(dateRange.end_date).toLocaleDateString('ar-EG')}`}
                </p>
              )}
            </div>

            {/* Sales Report */}
            {selectedReport === 'sales' && reportData && (
              <div>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {parseFloat(reportData.summary?.totalSales || 0).toFixed(2)} ج.م
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">عدد الطلبات</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.summary?.totalOrders || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {parseFloat(reportData.summary?.averageOrderValue || 0).toFixed(2)} ج.م
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">الربح</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {parseFloat(reportData.summary?.totalProfit || 0).toFixed(2)} ج.م
                    </p>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-coffee-700 text-white">
                        <th className="px-4 py-3 text-right">رقم الطلب</th>
                        <th className="px-4 py-3 text-right">التاريخ</th>
                        <th className="px-4 py-3 text-right">العميل</th>
                        <th className="px-4 py-3 text-right">النوع</th>
                        <th className="px-4 py-3 text-right">الحالة</th>
                        <th className="px-4 py-3 text-right">الإجمالي</th>
                        <th className="px-4 py-3 text-right">الربح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders?.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{order.order_number}</td>
                          <td className="px-4 py-3">
                            {new Date(order.created_at).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-4 py-3">{order.customer_name || '-'}</td>
                          <td className="px-4 py-3">
                            {order.order_type === 'in-store' ? 'داخلي' : 'أونلاين'}
                          </td>
                          <td className="px-4 py-3">{order.status}</td>
                          <td className="px-4 py-3 font-semibold">
                            {parseFloat(order.total).toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-3 font-semibold text-green-600">
                            {parseFloat(order.profit).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Report */}
            {selectedReport === 'products' && reportData && (
              <div>
                <h3 className="text-xl font-bold mb-4">المنتجات المباعة</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-coffee-700 text-white">
                        <th className="px-4 py-3 text-right">المنتج</th>
                        <th className="px-4 py-3 text-right">الكمية المباعة</th>
                        <th className="px-4 py-3 text-right">إجمالي الإيرادات</th>
                        <th className="px-4 py-3 text-right">التكلفة</th>
                        <th className="px-4 py-3 text-right">الربح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((product) => (
                        <tr key={product.product_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{product.product_name}</td>
                          <td className="px-4 py-3">{product.total_sold}</td>
                          <td className="px-4 py-3">
                            {parseFloat(product.total_revenue).toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-3">
                            {parseFloat(product.total_cost).toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-3 font-semibold text-green-600">
                            {parseFloat(product.total_profit).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Purchases Report */}
            {selectedReport === 'purchases' && reportData && (
              <div>
                <h3 className="text-xl font-bold mb-4">المشتريات</h3>
                {/* Summary */}
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {reportData
                      .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0)
                      .toFixed(2)}{' '}
                    ج.م
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-coffee-700 text-white">
                        <th className="px-4 py-3 text-right">التاريخ</th>
                        <th className="px-4 py-3 text-right">المورد</th>
                        <th className="px-4 py-3 text-right">الصنف</th>
                        <th className="px-4 py-3 text-right">الكمية</th>
                        <th className="px-4 py-3 text-right">سعر الوحدة</th>
                        <th className="px-4 py-3 text-right">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((purchase) => (
                        <tr key={purchase.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(purchase.purchase_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-4 py-3">{purchase.supplier_name}</td>
                          <td className="px-4 py-3">{purchase.item_description}</td>
                          <td className="px-4 py-3">{purchase.quantity}</td>
                          <td className="px-4 py-3">
                            {parseFloat(purchase.unit_price).toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {parseFloat(purchase.total_amount).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Profit Report */}
            {selectedReport === 'profit' && reportData && (
              <div>
                <h3 className="text-xl font-bold mb-4">تحليل الربح</h3>
                <div className="space-y-4">
                  <div className="p-6 bg-green-50 border-l-4 border-green-600 rounded">
                    <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    <p className="text-3xl font-bold text-green-600">
                      {parseFloat(reportData.totalRevenue || 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div className="p-6 bg-blue-50 border-l-4 border-blue-600 rounded">
                    <p className="text-sm text-gray-600">التكلفة الإجمالية</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {parseFloat(reportData.totalCost || 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div className="p-6 bg-orange-50 border-l-4 border-orange-600 rounded">
                    <p className="text-sm text-gray-600">الربح الإجمالي (قبل المصروفات)</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {parseFloat(reportData.grossProfit || 0).toFixed(2)} ج.م
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-red-50 border-l-4 border-red-600 rounded">
                      <p className="text-sm text-gray-600">المصروفات</p>
                      <p className="text-2xl font-bold text-red-600">
                        {parseFloat(reportData.totalExpenses || 0).toFixed(2)} ج.م
                      </p>
                    </div>

                    <div className="p-6 bg-purple-50 border-l-4 border-purple-600 rounded">
                      <p className="text-sm text-gray-600">المشتريات</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {parseFloat(reportData.totalPurchases || 0).toFixed(2)} ج.م
                      </p>
                    </div>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-coffee-600 to-coffee-700 rounded-lg text-white">
                    <p className="text-lg mb-2">صافي الربح</p>
                    <p className="text-4xl font-bold">
                      {parseFloat(reportData.netProfit || 0).toFixed(2)} ج.م
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Print Footer */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-gray-600">
              <p>تم التطوير بواسطة Kareem Khames</p>
              <p className="mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area,
            #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-600 mt-1">اختر نوع التقرير الذي تريد عرضه</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-95`}
            ></div>

            {/* Content */}
            <div className="relative p-6 text-white">
              {/* Icon */}
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl mb-4 w-fit">
                <report.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2">{report.title}</h3>

              {/* Description */}
              <p className="text-sm text-white/90 mb-4">{report.description}</p>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>عرض التقرير</span>
                <ArrowLeft className="w-4 h-4" />
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Reports;
