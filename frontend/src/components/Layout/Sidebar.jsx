import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  ShoppingBag,
  Users,
  Gift,
  Calendar,
  DollarSign,
  ShoppingBasket,
  FileText,
  Settings,
  Coffee
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasPermission } = useAuth();

  const navItems = [
    {
      name: 'لوحة التحكم',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'نقطة البيع',
      path: '/pos',
      icon: ShoppingCart,
      show: hasPermission('can_make_sales'),
    },
    {
      name: 'المنتجات',
      path: '/products',
      icon: Package,
      show: hasPermission('can_view_inventory'),
    },
    {
      name: 'الفئات',
      path: '/categories',
      icon: FolderOpen,
      show: hasPermission('can_view_inventory'),
    },
    {
      name: 'الطلبات',
      path: '/orders',
      icon: ShoppingBag,
      show: hasPermission('can_view_order_details'),
    },
    {
      name: 'المستخدمين',
      path: '/users',
      icon: Users,
      show: user?.role === 'admin',
    },
    {
      name: 'العروض',
      path: '/offers',
      icon: Gift,
      show: hasPermission('can_manage_offers'),
    },
    {
      name: 'الخصومات اليومية',
      path: '/daily-discounts',
      icon: Calendar,
      show: hasPermission('can_manage_offers'),
    },
    {
      name: 'المصروفات',
      path: '/expenses',
      icon: DollarSign,
      show: hasPermission('can_add_expenses') || hasPermission('can_view_reports'),
    },
    {
      name: 'المشتريات',
      path: '/purchases',
      icon: ShoppingBasket,
      show: hasPermission('can_add_expenses') || hasPermission('can_view_reports'),
    },
    {
      name: 'التقارير',
      path: '/reports',
      icon: FileText,
      show: hasPermission('can_view_reports'),
    },
    {
      name: 'الإعدادات',
      path: '/settings',
      icon: Settings,
      show: user?.role === 'admin',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-coffee-900 via-coffee-800 to-coffee-900 text-white w-64 min-h-screen p-4 flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 p-4 bg-gradient-to-r from-coffee-700 to-coffee-600 rounded-xl shadow-lg">
        <Coffee className="w-8 h-8 text-amber-100" />
        <div>
          <h1 className="font-bold text-lg text-white">إدارة المقهى</h1>
          <p className="text-xs text-amber-100">Cafe System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-coffee-600 to-coffee-500 text-white shadow-lg transform scale-105'
                    : 'text-amber-100 hover:bg-coffee-800/50 hover:translate-x-1'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
      </nav>

      {/* User Info */}
      <div className="mt-auto pt-4 border-t border-coffee-700/50">
        <div className="px-4 py-3 bg-gradient-to-r from-coffee-800 to-coffee-700 rounded-xl shadow-lg">
          <p className="text-sm font-semibold text-white">{user?.full_name}</p>
          <p className="text-xs text-amber-200">
            {user?.role === 'admin' ? 'مدير' : 'كاشير'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
