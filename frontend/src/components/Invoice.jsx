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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Print Area */}
        <div id="invoice-print-area" className="p-4">
          {/* Header */}
          <div className="text-center mb-3 border-b border-coffee-600 pb-3">
            <div className="flex justify-center mb-2">
              <div className="bg-coffee-600 p-2 rounded-full">
                <Coffee className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-coffee-800">مقهى الأحلام</h1>
            <p className="text-xs text-gray-600 mt-1">القاهرة، مصر • 01234567890</p>
          </div>

          {/* Invoice Details */}
          <div className="mb-3 bg-gray-50 p-2 rounded text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600">رقم الفاتورة: </span>
                <span className="font-bold">{orderData.order_number}</span>
              </div>
              <div className="text-left">
                <span className="text-gray-600">التاريخ: </span>
                <span className="font-bold">
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
            <div className="mb-3 border-t border-gray-200 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-gray-600">العميل: </span>
                  <span className="font-semibold">{orderData.customer_name}</span>
                </div>
                {orderData.customer_phone && (
                  <div className="text-left">
                    <span className="text-gray-600">هاتف: </span>
                    <span className="font-semibold">{orderData.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-coffee-700 text-white">
                  <th className="px-2 py-1 text-right">المنتج</th>
                  <th className="px-2 py-1 text-center w-12">الكمية</th>
                  <th className="px-2 py-1 text-right w-16">السعر</th>
                  <th className="px-2 py-1 text-right w-20">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {orderData.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-1">{item.product_name}</td>
                    <td className="px-2 py-1 text-center">{item.quantity}</td>
                    <td className="px-2 py-1">{parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-2 py-1 font-semibold">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-300 pt-2">
            <div className="space-y-1 text-sm">
              {discount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-700">المجموع الفرعي:</span>
                    <span>{subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>- {discount.toFixed(2)} ج.م</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold text-coffee-800 pt-1 border-t border-gray-300">
                <span>الإجمالي:</span>
                <span>{total.toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 text-center border-t border-coffee-600 pt-2">
            <p className="text-xs text-coffee-700 font-semibold">شكراً لزيارتكم!</p>
            <div className="mt-2 text-[10px] text-gray-500">
              <p>تم التطوير بواسطة Kareem Khames</p>
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
          @page {
            size: A5;
            margin: 0.5cm;
          }

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
            padding: 0.5cm !important;
            font-size: 10pt;
          }

          .print\\:hidden {
            display: none !important;
          }

          /* Make text even smaller for print */
          #invoice-print-area h1 {
            font-size: 16pt;
          }

          #invoice-print-area table {
            font-size: 9pt;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
