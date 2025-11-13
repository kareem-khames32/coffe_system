import { useState } from 'react';
import { Settings as SettingsIcon, Coffee, Save } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    cafeName: 'مقهى الأحلام',
    phone: '01234567890',
    address: 'القاهرة، مصر',
    taxRate: '14',
    currency: 'ج.م',
    lowStockAlert: '10',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings (would normally call API)
    localStorage.setItem('cafeSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-600 mt-1">إعدادات النظام والمقهى</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Cafe Info */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Coffee className="w-6 h-6 text-coffee-600" />
              معلومات المقهى
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المقهى
                </label>
                <input
                  type="text"
                  value={settings.cafeName}
                  onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-coffee-600" />
              إعدادات النظام
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة الضريبة (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العملة
                </label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد تنبيه المخزون
                </label>
                <input
                  type="number"
                  value={settings.lowStockAlert}
                  onChange={(e) => setSettings({ ...settings, lowStockAlert: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
            >
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </button>

            {saved && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✓ تم حفظ الإعدادات بنجاح
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-cream-50 border border-cream-200 p-6 rounded-lg">
        <h3 className="font-bold text-gray-900 mb-2">ملاحظة</h3>
        <p className="text-sm text-gray-700">
          بعض الإعدادات قد تتطلب إعادة تشغيل النظام لتفعيلها. تأكد من حفظ التغييرات قبل الخروج.
        </p>
      </div>
    </div>
  );
};

export default Settings;
