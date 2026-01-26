import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Eye, Search, Calendar, X, Package } from 'lucide-react';
import { inventoryPurchasesAPI } from '../api/services';

const InventoryPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await inventoryPurchasesAPI.getAll();
      setPurchases(response.data.data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (purchase) => {
    setDetailsLoading(true);
    setShowDetailsModal(true);
    try {
      const response = await inventoryPurchasesAPI.getById(purchase.id);
      setSelectedPurchase(response.data.data);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      alert('حدث خطأ في تحميل تفاصيل المشتريات');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المشتريات؟ سيتم خصم الكميات من المخزون.')) return;

    try {
      await inventoryPurchasesAPI.delete(id);
      alert('تم حذف المشتريات بنجاح');
      fetchPurchases();
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedPurchase(null);
      }
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (purchase.supplier_name || '').toLowerCase().includes(searchLower) ||
      (purchase.invoice_number || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPaymentTermLabel = (term) => {
    const labels = {
      cash: 'نقدي',
      credit_7: 'آجل 7 أيام',
      credit_15: 'آجل 15 يوم',
      credit_30: 'آجل 30 يوم',
      credit_60: 'آجل 60 يوم',
    };
    return labels[term] || term;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل المشتريات</h1>
          <p className="text-gray-600 mt-1">عرض وإدارة جميع المشتريات</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث بالمورد أو رقم الفاتورة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-coffee-600">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  المورد
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  الإجمالي
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(purchase.purchase_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {purchase.invoice_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.supplier_name || 'بدون مورد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-coffee-600">
                    {parseFloat(purchase.total_amount).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        purchase.payment_terms === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getPaymentTermLabel(purchase.payment_terms)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(purchase)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد مشتريات</h3>
              <p className="text-gray-500">
                {searchTerm ? 'لا توجد نتائج مطابقة' : 'لم يتم تسجيل أي مشتريات بعد'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">تفاصيل المشتريات</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPurchase(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
              </div>
            ) : selectedPurchase ? (
              <div className="p-6 space-y-6">
                {/* Purchase Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">التاريخ</div>
                    <div className="font-semibold">{formatDate(selectedPurchase.purchase_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">رقم الفاتورة</div>
                    <div className="font-semibold">{selectedPurchase.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">المورد</div>
                    <div className="font-semibold">{selectedPurchase.supplier_name || 'بدون مورد'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">طريقة الدفع</div>
                    <div className="font-semibold">{getPaymentTermLabel(selectedPurchase.payment_terms)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">الإجمالي</div>
                    <div className="text-2xl font-bold text-coffee-600">
                      {parseFloat(selectedPurchase.total_amount).toFixed(2)} ج.م
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">المواد المشتراة</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">المادة</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">الكمية</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">سعر الوحدة</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPurchase.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                {item.material_name}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {parseFloat(item.unit_cost).toFixed(2)} ج.م
                            </td>
                            <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                              {parseFloat(item.total_cost).toFixed(2)} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {selectedPurchase.notes && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">ملاحظات</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedPurchase.notes}</p>
                  </div>
                )}

                {/* Delete Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleDelete(selectedPurchase.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف هذه المشتريات
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    سيتم خصم الكميات المشتراة من المخزون عند الحذف
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPurchases;
