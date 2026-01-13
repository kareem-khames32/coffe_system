import { useEffect, useState } from 'react';
import { inventoryReportsAPI } from '../api/services';
import {
  Warehouse,
  Package,
  DollarSign,
  Eye,
  FileText,
  Download,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const WarehousesReport = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseDetails, setWarehouseDetails] = useState([]);
  const [warehouseTransactions, setWarehouseTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // list, details, transactions

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setError(null);
      const response = await inventoryReportsAPI.getWarehousesReport();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setError(error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseDetails = async (warehouseId) => {
    try {
      setDetailsLoading(true);
      const response = await inventoryReportsAPI.getWarehouseDetails(warehouseId);
      setWarehouseDetails(response.data.data);
      setActiveTab('details');
    } catch (error) {
      console.error('Error fetching warehouse details:', error);
      alert('فشل في تحميل تفاصيل المستودع');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchWarehouseTransactions = async (warehouseId) => {
    try {
      setTransactionsLoading(true);
      const response = await inventoryReportsAPI.getWarehouseTransactions(warehouseId);
      setWarehouseTransactions(response.data.data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Error fetching warehouse transactions:', error);
      alert('فشل في تحميل معاملات المستودع');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleViewDetails = (warehouse) => {
    setSelectedWarehouse(warehouse);
    fetchWarehouseDetails(warehouse.id);
  };

  const handleViewTransactions = (warehouse) => {
    setSelectedWarehouse(warehouse);
    fetchWarehouseTransactions(warehouse.id);
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedWarehouse(null);
    setWarehouseDetails([]);
    setWarehouseTransactions([]);
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export using xlsx library
    alert('سيتم تنفيذ تصدير Excel قريباً');
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
            onClick={fetchWarehouses}
            className="px-6 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            {activeTab !== 'list' && (
              <button
                onClick={handleBackToList}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <Warehouse className="w-8 h-8" />
            {activeTab === 'list' && 'تقارير المستودعات'}
            {activeTab === 'details' && `تفاصيل مستودع: ${selectedWarehouse?.warehouse_name}`}
            {activeTab === 'transactions' && `معاملات مستودع: ${selectedWarehouse?.warehouse_name}`}
          </h1>
          <p className="text-amber-700 mt-1">
            {activeTab === 'list' && 'عرض كافة المستودعات والقيم الإجمالية'}
            {activeTab === 'details' && 'المواد الخام المتوفرة في المستودع'}
            {activeTab === 'transactions' && 'سجل معاملات المستودع'}
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          تصدير Excel
        </button>
      </div>

      {/* Warehouses List */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-200">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                    اسم المستودع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                    عدد المواد
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                    القيمة الإجمالية
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                      لا توجد مستودعات
                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-5 h-5 text-coffee-600" />
                          <span className="font-semibold text-amber-900">{warehouse.warehouse_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-amber-700">
                        {warehouse.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-blue-600 font-semibold">
                          <Package className="w-4 h-4" />
                          {warehouse.materials_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(warehouse.total_value)} ج.م
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(warehouse)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            التفاصيل
                          </button>
                          <button
                            onClick={() => handleViewTransactions(warehouse)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            المعاملات
                          </button>
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

      {/* Warehouse Details */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
          {detailsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      اسم المادة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      المخزون الحالي
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      الوحدة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      سعر الوحدة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      القيمة الإجمالية
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  {warehouseDetails.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-amber-700">
                        لا توجد مواد في هذا المستودع
                      </td>
                    </tr>
                  ) : (
                    warehouseDetails.map((material) => (
                      <tr key={material.id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-amber-900">
                          {material.material_name}
                        </td>
                        <td className="px-6 py-4 text-amber-700">
                          {formatCurrency(material.current_stock)}
                        </td>
                        <td className="px-6 py-4 text-amber-700">
                          {formatCurrency(material.min_stock)}
                        </td>
                        <td className="px-6 py-4 text-amber-700">{material.unit}</td>
                        <td className="px-6 py-4 text-green-600 font-semibold">
                          {formatCurrency(material.unit_cost)} ج.م
                        </td>
                        <td className="px-6 py-4 text-green-600 font-bold">
                          {formatCurrency(material.total_value)} ج.م
                        </td>
                        <td className="px-6 py-4 text-center">
                          {material.stock_status === 'out_of_stock' && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              نفذ المخزون
                            </span>
                          )}
                          {material.stock_status === 'low_stock' && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                              مخزون قليل
                            </span>
                          )}
                          {material.stock_status === 'in_stock' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              متوفر
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
          {transactionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      المادة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      نوع المعاملة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">
                      المستخدم
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  {warehouseTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                        لا توجد معاملات لهذا المستودع
                      </td>
                    </tr>
                  ) : (
                    warehouseTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-4 text-amber-700">
                          {new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-900">
                          {transaction.material_name}
                        </td>
                        <td className="px-6 py-4">
                          {transaction.transaction_type === 'purchase' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              شراء
                            </span>
                          )}
                          {transaction.transaction_type === 'sale' && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              بيع
                            </span>
                          )}
                          {transaction.transaction_type === 'adjustment' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              تعديل
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              parseFloat(transaction.quantity) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {parseFloat(transaction.quantity) >= 0 ? '+' : ''}
                            {formatCurrency(transaction.quantity)} {transaction.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-amber-700">
                          {transaction.user_name || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarehousesReport;
