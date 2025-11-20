import { Coffee, X, Printer } from 'lucide-react';

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
      {/* Background Overlay */}
      <div
        className="invoice-overlay"
        onClick={onClose}
      >
        {/* Invoice Container */}
        <div
          className="invoice-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invoice Content */}
          <div className="invoice-content">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #6F4E37', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ backgroundColor: '#6F4E37', padding: '12px', borderRadius: '50%' }}>
                  <Coffee style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#6F4E37', margin: '0 0 8px 0' }}>
                {CAFE_SETTINGS.name}
              </h1>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {CAFE_SETTINGS.address} • {CAFE_SETTINGS.phone}
              </p>
            </div>

            {/* Invoice Details */}
            <div style={{ marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#666' }}>رقم الفاتورة: </span>
                  <span style={{ fontWeight: 'bold', color: '#6F4E37' }}>{orderData.order_number}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ color: '#666' }}>التاريخ: </span>
                  <span style={{ fontWeight: 'bold', color: '#6F4E37' }}>
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
              <div style={{ marginBottom: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: '#666' }}>العميل: </span>
                    <span style={{ fontWeight: '600', color: '#6F4E37' }}>{orderData.customer_name}</span>
                  </div>
                  {orderData.customer_phone && (
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ color: '#666' }}>هاتف: </span>
                      <span style={{ fontWeight: '600', color: '#6F4E37' }}>{orderData.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#6F4E37', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'right' }}>المنتج</th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '60px' }}>الكمية</th>
                    <th style={{ padding: '10px', textAlign: 'right', width: '80px' }}>السعر</th>
                    <th style={{ padding: '10px', textAlign: 'right', width: '100px' }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items?.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{item.product_name}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                      <td style={{ padding: '10px' }}>{parseFloat(item.price).toFixed(2)}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#6F4E37' }}>
                        {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #ccc', paddingTop: '15px' }}>
              {discount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '16px' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>المجموع الفرعي:</span>
                    <span style={{ fontWeight: '600' }}>{subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '16px', color: '#dc2626' }}>
                    <span style={{ fontWeight: '500' }}>الخصم:</span>
                    <span style={{ fontWeight: '600' }}>- {discount.toFixed(2)} ج.م</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold', color: '#6F4E37', paddingTop: '10px', borderTop: '2px solid #ccc' }}>
                <span>الإجمالي:</span>
                <span>{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '2px solid #6F4E37', paddingTop: '15px' }}>
              <p style={{ fontSize: '16px', color: '#6F4E37', fontWeight: 'bold', margin: '0 0 8px 0' }}>شكراً لزيارتكم!</p>
              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 15px 0' }}>نتمنى لكم يوماً سعيداً</p>
              <p style={{ fontSize: '11px', color: '#ccc', margin: 0 }}>تم التطوير بواسطة Kareem Khames</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="invoice-buttons">
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                backgroundColor: '#6F4E37',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Printer size={20} />
              طباعة الفاتورة
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: '#e5e5e5',
                color: '#333',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <X size={20} />
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .invoice-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .invoice-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .invoice-content {
          padding: 30px;
        }

        .invoice-buttons {
          display: flex;
          gap: 15px;
          padding: 20px 30px;
          border-top: 1px solid #e0e0e0;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .invoice-overlay {
            position: static;
            background: none;
            padding: 0;
          }

          .invoice-container {
            position: static;
            box-shadow: none;
            max-height: none;
            overflow: visible;
          }

          .invoice-content,
          .invoice-content * {
            visibility: visible;
          }

          .invoice-buttons {
            display: none !important;
          }

          .invoice-overlay {
            visibility: visible;
          }

          .invoice-container {
            visibility: visible;
          }

          @page {
            size: 80mm auto;
            margin: 5mm;
          }

          .invoice-content {
            width: 80mm;
            padding: 5mm;
          }
        }
      `}</style>
    </>
  );
};

export default Invoice;
