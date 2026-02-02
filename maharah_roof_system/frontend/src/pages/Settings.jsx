import { useState, useEffect } from 'react';
import { settingsAPI } from '../api/services';
import { Upload, Trash2, Save, Settings as SettingsIcon, Image } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    cafe_name: '',
    cafe_phone: '',
    cafe_address: '',
    logo_path: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data.data);
      if (response.data.data.logo_path) {
        setLogoPreview(import.meta.env.VITE_API_URL + response.data.data.logo_path);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'فشل في تحميل الإعدادات' });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'نوع الملف غير مدعوم. استخدم JPEG, PNG, GIF, أو SVG' });
        return;
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setMessage({ type: '', text: '' });
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      setMessage({ type: 'error', text: 'الرجاء اختيار صورة أولاً' });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await settingsAPI.uploadLogo(formData);

      setSettings(prev => ({ ...prev, logo_path: response.data.data.logo_path }));
      setLogoFile(null);
      setMessage({ type: 'success', text: 'تم رفع اللوجو بنجاح ✅' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل في رفع اللوجو' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('هل أنت متأكد من حذف اللوجو؟')) {
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      await settingsAPI.deleteLogo();
      setSettings(prev => ({ ...prev, logo_path: null }));
      setLogoPreview(null);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'تم حذف اللوجو بنجاح ✅' });
    } catch (error) {
      console.error('Error deleting logo:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل في حذف اللوجو' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await settingsAPI.updateMultiple({
        cafe_name: settings.cafe_name,
        cafe_phone: settings.cafe_phone,
        cafe_address: settings.cafe_address,
      });

      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح ✅' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل في حفظ الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900">⚙️ إعدادات النظام</h1>
        <p className="text-amber-700 mt-1">إدارة بيانات المقهى واللوجو</p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border-2 shadow-md ${
            message.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 text-green-800'
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-6">
            <Image className="w-6 h-6 text-amber-700" />
            <h2 className="text-xl font-bold text-amber-900">لوجو المقهى 🖼️</h2>
          </div>

          {/* Logo Preview */}
          <div className="mb-6">
            <div className="flex justify-center">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-48 h-48 object-contain rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
                  />
                  {settings.logo_path && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={uploadingLogo}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-full shadow-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="text-center">
                    <Image className="w-16 h-16 text-amber-300 mx-auto mb-2" />
                    <p className="text-sm text-amber-600">لا يوجد لوجو</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                اختر صورة اللوجو
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-amber-600 file:to-orange-600 file:text-white hover:file:from-amber-700 hover:file:to-orange-700 file:cursor-pointer"
              />
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ الصيغ المدعومة: JPEG, PNG, GIF, SVG | الحجم الأقصى: 5MB
              </p>
            </div>

            {logoFile && (
              <button
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {uploadingLogo ? 'جاري الرفع...' : 'رفع اللوجو'}
              </button>
            )}
          </div>
        </div>

        {/* Cafe Information */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-6 h-6 text-amber-700" />
            <h2 className="text-xl font-bold text-amber-900">بيانات المقهى 📋</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                اسم المقهى ☕
              </label>
              <input
                type="text"
                value={settings.cafe_name || ''}
                onChange={(e) => setSettings({ ...settings, cafe_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none transition"
                placeholder="مقهى الأحلام"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                رقم الهاتف 📞
              </label>
              <input
                type="tel"
                value={settings.cafe_phone || ''}
                onChange={(e) => setSettings({ ...settings, cafe_phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none transition"
                placeholder="01234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                العنوان 📍
              </label>
              <textarea
                value={settings.cafe_address || ''}
                onChange={(e) => setSettings({ ...settings, cafe_address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none transition resize-none"
                rows="3"
                placeholder="العنوان الكامل للمقهى"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
