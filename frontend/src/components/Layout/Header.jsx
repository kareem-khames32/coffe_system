import { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api/services';

const Header = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingOrders();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await ordersAPI.getPendingCount();
      setPendingCount(response.data.data.count);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            مرحباً، {user?.full_name}
          </h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
            <Bell className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
