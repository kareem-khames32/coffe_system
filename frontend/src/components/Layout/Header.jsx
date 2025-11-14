import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/services';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const previousCountRef = useRef(0);

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
          <button
            onClick={() => navigate('/orders')}
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
