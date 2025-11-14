import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersAPI } from '../api/services';
import { Coffee, Search, Package, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('order')) {
      handleTrack();
    }
  }, []);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();

    if (!orderNumber.trim()) {
      setError('الرجاء إدخال رقم الطلب');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await ordersAPI.trackOrder(orderNumber);
      setOrder(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'لم يتم العثور على الطلب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: {
        label: 'قيد الانتظار',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        description: 'طلبك قيد المراجعة',
      },
      confirmed: {
        label: 'مؤكد',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: CheckCircle,
        description: 'تم تأكيد طلبك',
      },
      preparing: {
        label: 'قيد التحضير',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: Loader,
        description: 'جاري تحضير طلبك',
      },
      ready: {
        label: 'جاهز',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: Package,
        description: 'طلبك جاهز للتسليم',
      },
      completed: {
        label: 'مكتمل',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: CheckCircle,
        description: 'تم تسليم طلبك بنجاح',
      },
      cancelled: {
        label: 'ملغي',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: XCircle,
        description: 'تم إلغاء طلبك',
      },
    };
    return statuses[status] || statuses.pending;
  };

  const getStatusSteps = () => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const currentIndex = steps.indexOf(order?.status);
    return steps.map((step, index) => ({
      ...getStatusInfo(step),
      step,
      isCompleted: index < currentIndex,
      isCurrent: index === currentIndex,
      isUpcoming: index > currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-700 via-coffee-600 to-coffee-800">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Coffee className="w-10 h-10 text-coffee-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تتبع طلبك</h1>
              <p className="text-sm text-gray-600">تابع حالة طلبك بسهولة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الطلب
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="مثال: 20240101-0001"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    {loading ? 'جاري البحث...' : 'تتبع'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`${getStatusInfo(order.status).bgColor} p-6 rounded-lg`}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  {(() => {
                    const StatusIcon = getStatusInfo(order.status).icon;
                    return <StatusIcon className={`w-12 h-12 ${getStatusInfo(order.status).color}`} />;
                  })()}
                  <div className="text-center">
                    <h2 className={`text-2xl font-bold ${getStatusInfo(order.status).color}`}>
                      {getStatusInfo(order.status).label}
                    </h2>
                    <p className="text-sm text-gray-700 mt-1">
                      {getStatusInfo(order.status).description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Steps (Only for non-cancelled orders) */}
              {order.status !== 'cancelled' && order.order_type === 'online' && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="font-bold text-lg mb-6">مراحل الطلب</h3>
                  <div className="space-y-4">
                    {getStatusSteps().map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.step} className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.isCompleted
                                ? 'bg-green-500 text-white'
                                : step.isCurrent
                                ? step.bgColor + ' ' + step.color
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {step.isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <StepIcon className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`font-semibold ${
                                step.isCompleted
                                  ? 'text-green-600'
                                  : step.isCurrent
                                  ? step.color
                                  : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </div>
                            <div className="text-sm text-gray-500">{step.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Info */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg mb-4">معلومات الطلب</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">رقم الطلب:</span>
                    <span className="font-semibold">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-semibold">
                      {new Date(order.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">نوع الطلب:</span>
                    <span className="font-semibold">
                      {order.order_type === 'online' ? 'أونلاين' : 'داخل المقهى'}
                    </span>
                  </div>
                  {order.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-semibold">{order.customer_name}</span>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">الموبايل:</span>
                      <span className="font-semibold" dir="ltr">{order.customer_phone}</span>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">العنوان:</span>
                      <span className="font-semibold">{order.customer_address}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600 font-bold">المبلغ الإجمالي:</span>
                    <span className="font-bold text-lg text-green-600">
                      {parseFloat(order.total || 0).toFixed(2)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg mb-4">تفاصيل الطلب</h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          {parseFloat(item.price).toFixed(2)} ج.م × {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold text-coffee-600">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
