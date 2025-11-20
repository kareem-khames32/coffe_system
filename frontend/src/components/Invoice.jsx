import { Coffee } from 'lucide-react';

// إعدادات الكافيه - يمكنك تعديلها هنا بسهولة
const CAFE_SETTINGS = {
  name: 'مقهى الأحلام',
  address: 'القاهرة، مصر',
  phone: '01234567890',
};

const Invoice = ({ orderData, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!orderData) return null;

  const subtotal = orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = parseFloat(orderData.discount_amount) || 0;
  const total = subtotal - discount;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Print Area */}
          <div id="invoice-print-area" className="p-6">
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-coffee-600 pb-4">
              <div className="flex justify-center mb-3">
                <div className="bg-coffee-600 p-3 rounded-full">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-coffee-800 mb-1">{CAFE_SETTINGS.name}</h1>
              <p className="text-sm text-gray-600">{CAFE_SETTINGS.address} • {CAFE_SETTINGS.phone}</p>
            </div>

            {/* Invoice Details */}
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">رقم الفاتورة: </span>
                  <span className="font-bold text-coffee-800">{orderData.order_number}</span>
                </div>
                <div className="text-left">
                  <span className="text-gray-600">التاريخ: </span>
                  <span className="font-bold text-coffee-800">
                    {new Date(orderData.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {orderData.customer_name && (
              <div className="mb-4 border-t border-gray-200 pt-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">العميل: </span>
                    <span className="font-semibold text-coffee-800">{orderData.customer_name}</span>
                  </div>
                  {orderData.customer_phone && (
                    <div className="text-left">
                      <span className="text-gray-600">هاتف: </span>
                      <span className="font-semibold text-coffee-800">{orderData.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-coffee-700 text-white">
                    <th className="px-3 py-2 text-right">المنتج</th>
                    <th className="px-3 py-2 text-center w-16">الكمية</th>
                    <th className="px-3 py-2 text-right w-20">السعر</th>
                    <th className="px-3 py-2 text-right w-24">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-3 py-2 font-medium">{item.product_name}</td>
                      <td className="px-3 py-2 text-center font-semibold">{item.quantity}</td>
                      <td className="px-3 py-2">{parseFloat(item.price).toFixed(2)}</td>
                      <td className="px-3 py-2 font-bold text-coffee-800">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-3">
              <div className="space-y-2">
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-700 font-medium">المجموع الفرعي:</span>
                      <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base text-red-600">
                      <span className="font-medium">الخصم:</span>
                      <span className="font-semibold">- {discount.toFixed(2)} ج.م</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xl font-bold text-coffee-800 pt-2 border-t-2 border-gray-300">
                  <span>الإجمالي:</span>
                  <span>{total.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center border-t-2 border-coffee-600 pt-3">
              <p className="text-base text-coffee-700 font-bold">شكراً لزيارتكم!</p>
              <p className="text-xs text-gray-500 mt-2">نتمنى لكم يوماً سعيداً</p>
              <div className="mt-3 text-[11px] text-gray-400">
                <p>تم التطوير بواسطة Kareem Khames</p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Hidden when printing */}
          <div className="flex gap-4 p-6 border-t no-print">
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
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* إخفاء كل شيء */
          body > *:not(#root) {
            display: none !important;
          }

          /* إخفاء العناصر التي تحتوي على no-print */
          .no-print {
            display: none !important;
          }

          /* إعدادات الصفحة */
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          /* عرض منطقة الطباعة فقط */
          #invoice-print-area {
            display: block !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
          }

          /* إخفاء كل شيء ما عدا منطقة الطباعة */
          body * {
            visibility: hidden;
          }

          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }

          /* جعل منطقة الطباعة في أعلى اليسار */
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }

        /* للتأكد من عدم تكرار الطباعة */
        @media print {
          html, body {
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </>
  );
};

export default Invoice;
