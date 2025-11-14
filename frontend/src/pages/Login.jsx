import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../api/services';
import { Coffee } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ cafe_name: 'نظام إدارة المقهى', logo_path: null });
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch settings for logo and cafe name
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getAll();
        setSettings(response.data.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'فشل تسجيل الدخول');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border-2 border-amber-200">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {settings.logo_path ? (
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-2xl shadow-lg">
              <img
                src={import.meta.env.VITE_API_URL + settings.logo_path}
                alt="Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 rounded-full shadow-lg">
              <Coffee className="w-16 h-16 text-coffee-700" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-coffee-800 to-coffee-600 bg-clip-text text-transparent mb-2">
          {settings.cafe_name || 'نظام إدارة المقهى'}
        </h1>
        <p className="text-center text-amber-700 mb-8 font-medium">
          مرحباً بك، سجل دخولك للمتابعة
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 shadow-md">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-amber-900 text-sm font-bold mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none transition shadow-sm"
              placeholder="أدخل اسم المستخدم"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-amber-900 text-sm font-bold mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none transition shadow-sm"
              placeholder="أدخل كلمة المرور"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 shadow-md">
          <p className="text-sm text-amber-900 text-center mb-2 font-bold">
            بيانات تجريبية:
          </p>
          <p className="text-xs text-amber-700 text-center">
            اسم المستخدم: <span className="font-mono font-bold bg-white px-2 py-1 rounded">admin</span>
            <br />
            كلمة المرور: <span className="font-mono font-bold bg-white px-2 py-1 rounded">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
