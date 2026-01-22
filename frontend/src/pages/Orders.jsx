import { useEffect, useState } from 'react';
import { ordersAPI } from '../api/services';
import { ShoppingBag, Eye, X, Package, User, Phone, MapPin, Calendar, DollarSign, Printer, XCircle, Link2, Copy, Check } from 'lucide-react';
import Invoice from '../components/Invoice';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || order.order_type === filterType;
    const matchesStatus = filterStatus === 'all' || order.order_status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      alert('تم تحديث حالة الطلب بنجاح');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const response = await ordersAPI.getById(orderId);
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    await updateOrderStatus(orderId, 'cancelled');
  };

  const handlePrintInvoice = () => {
    setShowModal(false);
    setShowInvoice(true);
  };

  const viewOrderDetails = async (order) => {
    try {
      const response = await ordersAPI.getById(order.id);
      setSelectedOrder(response.data.data);
      setShowModal(true);
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };
    return texts[status] || status;
  };

  const getOrderTypeText = (type) => {
    return type === 'dine-in' ? 'داخل المقهى' : 'أونلاين';
  };

  const getNextStatuses = (currentStatus, orderType) => {
    const flow = {
      pending: ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      confirmed: ['preparing', 'ready', 'completed', 'cancelled'],
      preparing: ['ready', 'completed', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: ['pending', 'cancelled'],  // Allow editing completed orders
      cancelled: ['pending'],  // Allow reactivating cancelled orders
    };
    return flow[currentStatus] || [];
  };

  const copyOrderLink = () => {
    const orderLink = `${window.location.origin}/online-order`;
    navigator.clipboard.writeText(orderLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('فشل نسخ الرابط');
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الطلبات</h1>
        <p className="text-gray-600 mt-1">إدارة طلبات العملاء</p>
      </div>

      {/* Online Order Link */}
      <div className="bg-gradient-to-r from-coffee-600 to-coffee-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">رابط الطلب عبر الإنترنت</h3>
              <p className="text-sm text-white/80">شارك هذا الرابط مع العملاء لتلقي الطلبات أونلاين</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <code className="text-sm text-white/90 font-mono">
              {window.location.origin}/online-order
            </code>
            <button
              onClick={copyOrderLink}
              className="flex items-center gap-2 px-4 py-2 bg-white text-coffee-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  تم النسخ!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  نسخ الرابط
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          >
            <option value="all">جميع الأنواع</option>
            <option value="dine-in">داخل المقهى</option>
            <option value="online">أونلاين</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="preparing">قيد التحضير</option>
            <option value="ready">جاهز</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-700 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">رقم الطلب</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">النوع</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">العميل</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">التاريخ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المبلغ</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-coffee-600">{order.order_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cream-100 text-coffee-700">
                      {getOrderTypeText(order.order_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {order.customer_name || 'بدون اسم'}
                      </div>
                      {order.customer_phone && (
                        <div className="text-gray-500">{order.customer_phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {parseFloat(order.total || 0).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                      {getStatusText(order.order_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="p-2 text-coffee-600 hover:bg-cream-100 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'لا توجد نتائج مطابقة لبحثك'
                  : 'لا توجد طلبات حالياً'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.order_number}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <ShoppingBag className="w-5 h-5 text-coffee-600" />
                    <div>
                      <div className="text-sm text-gray-500">نوع الطلب</div>
                      <div className="font-semibold">{getOrderTypeText(selectedOrder.order_type)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-coffee-600" />
                    <div>
                      <div className="text-sm text-gray-500">التاريخ</div>
                      <div className="font-semibold">
                        {new Date(selectedOrder.created_at).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <DollarSign className="w-5 h-5 text-coffee-600" />
                    <div>
                      <div className="text-sm text-gray-500">المبلغ الإجمالي</div>
                      <div className="font-semibold text-lg text-green-600">
                        {parseFloat(selectedOrder.total || 0).toFixed(2)} ج.م
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedOrder.customer_name && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <User className="w-5 h-5 text-coffee-600" />
                      <div>
                        <div className="text-sm text-gray-500">اسم العميل</div>
                        <div className="font-semibold">{selectedOrder.customer_name}</div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.customer_phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="w-5 h-5 text-coffee-600" />
                      <div>
                        <div className="text-sm text-gray-500">رقم الموبايل</div>
                        <div className="font-semibold">{selectedOrder.customer_phone}</div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.customer_address && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-coffee-600" />
                      <div>
                        <div className="text-sm text-gray-500">العنوان</div>
                        <div className="font-semibold">{selectedOrder.customer_address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-coffee-600" />
                  المنتجات
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-sm font-semibold">المنتج</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">السعر</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">الكمية</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium">{item.product_name}</td>
                          <td className="px-4 py-3">{parseFloat(item.price).toFixed(2)} ج.م</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3 font-semibold">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right font-bold">
                          المجموع الكلي
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          {parseFloat(selectedOrder.total || 0).toFixed(2)} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-2 px-6 py-3 bg-coffee-600 hover:bg-coffee-700 text-white rounded-lg transition font-semibold"
                >
                  <Printer className="w-5 h-5" />
                  طباعة الفاتورة
                </button>

                {selectedOrder.order_status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    إلغاء الطلب
                  </button>
                )}
              </div>

              {/* Status Update */}
              {getNextStatuses(selectedOrder.order_status, selectedOrder.order_type).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3">تحديث حالة الطلب</h3>
                  <div className="flex gap-2 flex-wrap">
                    {getNextStatuses(selectedOrder.order_status, selectedOrder.order_type).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                          status === 'cancelled'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-coffee-600 hover:bg-coffee-700 text-white'
                        }`}
                      >
                        {getStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <Invoice orderData={selectedOrder} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default Orders;
