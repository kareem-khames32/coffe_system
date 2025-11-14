import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ShoppingBag, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/services';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const previousCountRef = useRef(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchPendingOrders();
    // Poll every 15 seconds for better responsiveness
    const interval = setInterval(fetchPendingOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await ordersAPI.getPendingCount();
      const newCount = response.data.data.count;

      // If count increased, play notification sound and show browser notification
      if (newCount > previousCountRef.current && previousCountRef.current !== 0) {
        playNotificationSound();

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('طلب جديد!', {
            body: `لديك ${newCount} طلب${newCount > 1 ? 'ات' : ''} قيد الانتظار`,
            icon: '/favicon.ico',
            tag: 'new-order',
          });
        }
      }

      previousCountRef.current = newCount;
      setPendingCount(newCount);

      // Fetch pending orders list if there are any
      if (newCount > 0) {
        const ordersResponse = await ordersAPI.getAll({ status: 'pending' });
        setPendingOrders(ordersResponse.data.data.slice(0, 5)); // Show only last 5
      } else {
        setPendingOrders([]);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="الطلبات المعلقة"
            >
              <Bell className={`w-6 h-6 ${pendingCount > 0 ? 'animate-pulse text-red-500' : ''}`} />
              {pendingCount > 0 && (
                <>
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {pendingCount}
                  </span>
                  <span className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 animate-ping"></span>
                </>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">الطلبات المعلقة</h3>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {pendingCount}
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {pendingOrders.length > 0 ? (
                    pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/orders');
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <ShoppingBag className="w-4 h-4 text-coffee-600" />
                              <span className="font-semibold text-sm text-coffee-600">
                                {order.order_number}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {order.customer_name || 'عميل'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-green-600">
                              {parseFloat(order.total_amount).toFixed(2)} ج.م
                            </p>
                            <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              قيد الانتظار
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">لا توجد طلبات معلقة</p>
                    </div>
                  )}
                </div>

                {pendingOrders.length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/orders');
                      }}
                      className="w-full text-center text-sm text-coffee-600 hover:text-coffee-700 font-medium"
                    >
                      عرض جميع الطلبات
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
