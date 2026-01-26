import { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { settingsAPI } from '../api/services';

const Invoice = ({ orderData, onClose }) => {
  const [settings, setSettings] = useState({
    cafe_name: 'مقهى الأحلام',
    cafe_address: 'القاهرة، مصر',
    cafe_phone: '01234567890',
    cafe_logo: null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      const settingsData = response.data.data;

      setSettings({
        cafe_name: settingsData.cafe_name || 'مقهى الأحلام',
        cafe_address: settingsData.cafe_address || 'القاهرة، مصر',
        cafe_phone: settingsData.cafe_phone || '01234567890',
        cafe_logo: settingsData.logo_path || null,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!orderData) return null;

  const subtotal = orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = parseFloat(orderData.discount_amount) || 0;
  const total = subtotal - discount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ width: '302px' }}>
        {/* Print Area - Receipt Style 80mm */}
        <div id="invoice-print-area" className="p-3 font-mono" style={{ width: '302px' }}>
          {/* Header */}
          <div className="text-center mb-2 border-b border-dashed border-gray-400 pb-2">
            {settings.cafe_logo ? (
              <img
                src={`http://localhost:5000${settings.cafe_logo}`}
                alt="Logo"
                className="h-10 w-10 object-contain mx-auto mb-1"
              />
            ) : (
              <div className="bg-coffee-600 p-1.5 rounded-full inline-block mb-1">
                <Coffee className="w-5 h-5 text-white" />
              </div>
            )}
            <h1 className="text-sm font-bold text-gray-800">{settings.cafe_name}</h1>
            <p className="text-[10px] text-gray-600">{settings.cafe_address}</p>
            <p className="text-[10px] text-gray-600">{settings.cafe_phone}</p>
          </div>

          {/* Invoice Details */}
          <div className="mb-2 text-[10px] border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>رقم: {orderData.order_number}</span>
              <span>
                {new Date(orderData.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="text-center text-[10px] text-gray-500">
              {new Date(orderData.created_at).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Customer Info */}
          {orderData.customer_name && (
            <div className="mb-2 text-[10px] border-b border-dashed border-gray-400 pb-2">
              <div>العميل: {orderData.customer_name}</div>
              {orderData.customer_phone && <div>هاتف: {orderData.customer_phone}</div>}
            </div>
          )}

          {/* Items */}
          <div className="mb-2 text-[10px]">
            <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1">
              <span>الصنف</span>
              <span>المجموع</span>
            </div>
            {orderData.items?.map((item, index) => (
              <div key={index} className="mb-1">
                <div className="flex justify-between">
                  <span className="flex-1">{item.product_name}</span>
                  <span className="font-semibold">{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                <div className="text-[9px] text-gray-500 mr-2">
                  {item.quantity} × {parseFloat(item.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 pt-2 text-[11px]">
            {discount > 0 && (
              <>
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span>- {discount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-double border-gray-400 pt-1 mt-1">
              <span>الإجمالي:</span>
              <span>{total.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 text-center border-t border-dashed border-gray-400 pt-2">
            <p className="text-[10px] font-bold">شكراً لزيارتكم!</p>
            <p className="text-[8px] text-gray-400 mt-1">Developed by Kareem Khames</p>
          </div>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="flex gap-2 p-3 border-t print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded text-sm font-semibold transition"
          >
            طباعة
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded text-sm font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Print Styles - 80mm Thermal Receipt */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
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
            width: 80mm !important;
            padding: 2mm !important;
            font-size: 9pt;
            font-family: monospace;
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
