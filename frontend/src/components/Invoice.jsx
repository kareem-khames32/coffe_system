import { Coffee } from 'lucide-react';

const Invoice = ({ orderData, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!orderData) return null;

  const subtotal = orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = parseFloat(orderData.discount_amount) || 0;
  const total = subtotal - discount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Print Area */}
        <div id="invoice-print-area" className="p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-coffee-600 pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-coffee-600 p-4 rounded-full">
                <Coffee className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-coffee-800">مقهى الأحلام</h1>
            <p className="text-gray-600 mt-2">القاهرة، مصر • 01234567890</p>
            <p className="text-sm text-gray-500 mt-1">www.dreamcafe.com</p>
          </div>

          {/* Invoice Details */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">رقم الفاتورة</p>
                <p className="font-bold text-coffee-700">{orderData.order_number}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-bold text-coffee-700">
                  {new Date(orderData.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {orderData.customer_name && (
            <div className="mb-6 border-t border-b border-gray-200 py-4">
              <h3 className="font-bold text-gray-800 mb-2">بيانات العميل</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">الاسم: </span>
                  <span className="font-semibold">{orderData.customer_name}</span>
                </div>
                {orderData.customer_phone && (
                  <div>
                    <span className="text-gray-600">الهاتف: </span>
                    <span className="font-semibold">{orderData.customer_phone}</span>
                  </div>
                )}
                {orderData.customer_address && (
                  <div className="col-span-2">
                    <span className="text-gray-600">العنوان: </span>
                    <span className="font-semibold">{orderData.customer_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-coffee-700 text-white">
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-center">الكمية</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {orderData.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-3 font-semibold">{item.product_name}</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3">{parseFloat(item.price).toFixed(2)} ج.م</td>
                    <td className="px-4 py-3 font-semibold">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">المجموع الفرعي:</span>
                <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-lg text-red-600">
                  <span>الخصم:</span>
                  <span className="font-semibold">- {discount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-coffee-800 pt-2 border-t border-gray-300">
                <span>الإجمالي:</span>
                <span>{total.toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center border-t-2 border-coffee-600 pt-6">
            <p className="text-coffee-700 font-semibold mb-2">شكراً لزيارتكم!</p>
            <p className="text-sm text-gray-600">نتمنى أن تكون تجربتكم ممتعة</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>تم التطوير بواسطة Kareem Khames</p>
              <p className="mt-1">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="flex gap-4 p-6 border-t print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-3 rounded-lg font-semibold transition"
          >
            طباعة الفاتورة
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
