import { Coffee, X, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsAPI } from '../api/services';

const Invoice = ({ orderData, onClose }) => {
  const [settings, setSettings] = useState({
    cafe_name: 'مقهى الأحلام',
    cafe_address: 'القاهرة، مصر',
    cafe_phone: '01234567890',
  });

  useEffect(() => {
    // جلب إعدادات الكافيه من قاعدة البيانات
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getAll();
        if (response.data.success) {
          setSettings({
            cafe_name: response.data.data.cafe_name || 'مقهى الأحلام',
            cafe_address: response.data.data.cafe_address || 'القاهرة، مصر',
            cafe_phone: response.data.data.cafe_phone || '01234567890',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // استخدام القيم الافتراضية في حالة الخطأ
      }
    };

    fetchSettings();
  }, []);

  const handlePrint = () => {
    // إنشاء محتوى HTML للفاتورة
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${orderData.order_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: white;
          }

          .invoice {
            max-width: 100%;
            margin: 0 auto;
            background: white;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #6F4E37;
            padding-bottom: 25px;
          }

          .header h1 {
            font-size: 42px;
            font-weight: bold;
            color: #6F4E37;
            margin: 15px 0;
          }

          .header p {
            font-size: 20px;
            color: #666;
          }

          .info-box {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            font-size: 18px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }

          .info-label {
            color: #666;
          }

          .info-value {
            font-weight: bold;
            color: #6F4E37;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 18px;
          }

          .items-table th {
            background: #6F4E37;
            color: white;
            padding: 15px;
            text-align: right;
          }

          .items-table td {
            padding: 15px;
            border-bottom: 2px solid #e0e0e0;
          }

          .totals {
            border-top: 3px solid #ccc;
            padding-top: 20px;
            font-size: 22px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
          }

          .total-final {
            font-size: 32px;
            font-weight: bold;
            color: #6F4E37;
            border-top: 3px solid #ccc;
            padding-top: 15px;
            margin-top: 15px;
          }

          .footer {
            text-align: center;
            margin-top: 40px;
            border-top: 3px solid #6F4E37;
            padding-top: 20px;
          }

          .footer p {
            margin: 8px 0;
          }

          @media print {
            body {
              padding: 10mm;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <!-- Header -->
          <div class="header">
            <h1>${settings.cafe_name}</h1>
            <p>${settings.cafe_address} • ${settings.cafe_phone}</p>
          </div>

          <!-- Invoice Info -->
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">رقم الفاتورة:</span>
              <span class="info-value">${orderData.order_number}</span>
            </div>
            <div class="info-row">
              <span class="info-label">التاريخ:</span>
              <span class="info-value">${new Date(orderData.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}</span>
            </div>
            ${orderData.customer_name ? `
            <div class="info-row">
              <span class="info-label">العميل:</span>
              <span class="info-value">${orderData.customer_name}</span>
            </div>
            ` : ''}
            ${orderData.customer_phone ? `
            <div class="info-row">
              <span class="info-label">هاتف:</span>
              <span class="info-value">${orderData.customer_phone}</span>
            </div>
            ` : ''}
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th style="width: 60px; text-align: center;">الكمية</th>
                <th style="width: 80px;">السعر</th>
                <th style="width: 100px;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items?.map(item => `
                <tr>
                  <td style="font-weight: 500;">${item.product_name}</td>
                  <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                  <td>${parseFloat(item.price).toFixed(2)}</td>
                  <td style="font-weight: bold; color: #6F4E37;">${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            ${parseFloat(orderData.discount_amount) > 0 ? `
              <div class="total-row">
                <span style="color: #666;">المجموع الفرعي:</span>
                <span style="font-weight: 600;">${(orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0).toFixed(2)} ج.م</span>
              </div>
              <div class="total-row" style="color: #dc2626;">
                <span style="font-weight: 500;">الخصم:</span>
                <span style="font-weight: 600;">- ${parseFloat(orderData.discount_amount).toFixed(2)} ج.م</span>
              </div>
            ` : ''}
            <div class="total-row total-final">
              <span>الإجمالي:</span>
              <span>${((orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0) - parseFloat(orderData.discount_amount || 0)).toFixed(2)} ج.م</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="font-size: 24px; color: #6F4E37; font-weight: bold;">شكراً لزيارتكم!</p>
            <p style="font-size: 18px; color: #999;">نتمنى لكم يوماً سعيداً</p>
            <p style="font-size: 16px; color: #ccc; margin-top: 15px;">تم التطوير بواسطة Kareem Khames</p>
          </div>
        </div>

        <script>
          // طباعة تلقائية عند فتح النافذة
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    // فتح نافذة جديدة بحجم كبير
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!orderData) return null;

  const subtotal = orderData.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = parseFloat(orderData.discount_amount) || 0;
  const total = subtotal - discount;

  return (
    <>
      {/* Background Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}
        onClick={onClose}
      >
        {/* Invoice Container */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Invoice Content */}
          <div style={{ padding: '30px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #6F4E37', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ backgroundColor: '#6F4E37', padding: '12px', borderRadius: '50%' }}>
                  <Coffee style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#6F4E37', margin: '0 0 8px 0' }}>
                {settings.cafe_name}
              </h1>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {settings.cafe_address} • {settings.cafe_phone}
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
          <div style={{ display: 'flex', gap: '15px', padding: '20px 30px', borderTop: '1px solid #e0e0e0' }}>
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
    </>
  );
};

export default Invoice;
