import { useEffect, useState } from 'react';
import { inventoryReportsAPI } from '../api/services';
import {
  Users,
  User,
  DollarSign,
  ShoppingCart,
  Package,
  Phone,
  Mail,
  Eye,
  ChevronLeft,
  Download,
  AlertCircle,
} from 'lucide-react';

// Helper function to safely format numbers
const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const SuppliersReport = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [supplierMaterials, setSupplierMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list'); // list, details, purchases, materials

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setError(null);
      const response = await inventoryReportsAPI.getSuppliersSummary();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError(error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierDetails = async (supplierId) => {
    try {
      setDetailsLoading(true);
      const response = await inventoryReportsAPI.getSupplierDetails(supplierId);
      setSupplierDetails(response.data.data);
      setActiveView('details');
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      alert('فشل في تحميل تفاصيل المورد');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchSupplierPurchases = async (supplierId) => {
    try {
      setDetailsLoading(true);
      const response = await inventoryReportsAPI.getSupplierPurchases(supplierId);
      setSupplierPurchases(response.data.data);
      setActiveView('purchases');
    } catch (error) {
      console.error('Error fetching supplier purchases:', error);
      alert('فشل في تحميل مشتريات المورد');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchSupplierMaterials = async (supplierId) => {
    try {
      setDetailsLoading(true);
      const response = await inventoryReportsAPI.getSupplierMaterials(supplierId);
      setSupplierMaterials(response.data.data);
      setActiveView('materials');
    } catch (error) {
      console.error('Error fetching supplier materials:', error);
      alert('فشل في تحميل مواد المورد');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierDetails(supplier.id);
  };

  const handleViewPurchases = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierPurchases(supplier.id);
  };

  const handleViewMaterials = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierMaterials(supplier.id);
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedSupplier(null);
    setSupplierDetails(null);
    setSupplierPurchases([]);
    setSupplierMaterials([]);
  };

  const exportToExcel = () => {
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
          <h2 className="text-xl font-semibold text-amber-900 mb-2">حدث خطأ</h2>
          <p className="text-amber-700 mb-4">{error}</p>
          <button
            onClick={fetchSuppliers}
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
            {activeView !== 'list' && (
              <button
                onClick={handleBackToList}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <Users className="w-8 h-8" />
            {activeView === 'list' && 'تقارير الموردين'}
            {activeView === 'details' && `تفاصيل المورد: ${selectedSupplier?.name}`}
            {activeView === 'purchases' && `مشتريات المورد: ${selectedSupplier?.name}`}
            {activeView === 'materials' && `مواد المورد: ${selectedSupplier?.name}`}
          </h1>
          <p className="text-amber-700 mt-1">
            {activeView === 'list' && 'عرض كافة الموردين والمشتريات'}
            {activeView === 'details' && 'معلومات وإحصائيات المورد'}
            {activeView === 'purchases' && 'سجل مشتريات المورد'}
            {activeView === 'materials' && 'المواد التي يوردها'}
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

      {/* Suppliers List */}
      {activeView === 'list' && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-200">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                    اسم المورد
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                    معلومات الاتصال
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                    عدد المشتريات
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                    إجمالي المشتريات
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                    عدد المواد
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-amber-700">
                      لا يوجد موردين
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-coffee-600" />
                          <span className="font-semibold text-amber-900">{supplier.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-amber-700">
                              <Phone className="w-4 h-4" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-amber-700">
                              <Mail className="w-4 h-4" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-blue-600 font-semibold">
                          <ShoppingCart className="w-4 h-4" />
                          {supplier.total_purchases || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(supplier.total_amount)} ج.م
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-purple-600 font-semibold">
                          <Package className="w-4 h-4" />
                          {supplier.materials_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewSupplier(supplier)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            التفاصيل
                          </button>
                          <button
                            onClick={() => handleViewPurchases(supplier)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            المشتريات
                          </button>
                          <button
                            onClick={() => handleViewMaterials(supplier)}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                          >
                            <Package className="w-4 h-4" />
                            المواد
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

      {/* Supplier Details */}
      {activeView === 'details' && (
        <>
          {detailsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
            </div>
          ) : supplierDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info Card */}
              <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-amber-200">
                <h3 className="text-lg font-bold text-amber-900 mb-4">معلومات الاتصال</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-amber-700">
                    <User className="w-5 h-5" />
                    <span className="font-semibold">{supplierDetails.name}</span>
                  </div>
                  {supplierDetails.phone && (
                    <div className="flex items-center gap-3 text-amber-700">
                      <Phone className="w-5 h-5" />
                      <span>{supplierDetails.phone}</span>
                    </div>
                  )}
                  {supplierDetails.email && (
                    <div className="flex items-center gap-3 text-amber-700">
                      <Mail className="w-5 h-5" />
                      <span>{supplierDetails.email}</span>
                    </div>
                  )}
                  {supplierDetails.address && (
                    <div className="flex items-start gap-3 text-amber-700">
                      <Package className="w-5 h-5 mt-1" />
                      <span>{supplierDetails.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold">عدد المشتريات</p>
                      <p className="text-3xl font-bold mt-2">{supplierDetails.total_purchases || 0}</p>
                    </div>
                    <ShoppingCart className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-semibold">إجمالي المشتريات</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(supplierDetails.total_amount)} ج.م
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Supplier Purchases */}
      {activeView === 'purchases' && (
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
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      التاريخ
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
                  {supplierPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                        لا توجد مشتريات من هذا المورد
                      </td>
                    </tr>
                  ) : (
                    supplierPurchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-amber-900">
                          {purchase.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-amber-700">
                          {new Date(purchase.purchase_date).toLocaleDateString('ar-EG')}
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
          )}
        </div>
      )}

      {/* Supplier Materials */}
      {activeView === 'materials' && (
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
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      اسم المادة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      آخر سعر شراء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      الوحدة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      المخزون الحالي
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                      المستودع
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  {supplierMaterials.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-amber-700">
                        لا توجد مواد من هذا المورد
                      </td>
                    </tr>
                  ) : (
                    supplierMaterials.map((material) => (
                      <tr key={material.id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-amber-900">
                          {material.material_name}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-bold">
                          {formatCurrency(material.last_purchase_price)} ج.م
                        </td>
                        <td className="px-6 py-4 text-amber-700">{material.unit}</td>
                        <td className="px-6 py-4 text-amber-700">
                          {formatCurrency(material.current_stock)} {material.unit}
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
          )}
        </div>
      )}
    </div>
  );
};

export default SuppliersReport;
