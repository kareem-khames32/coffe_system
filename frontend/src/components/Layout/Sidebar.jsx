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
    <div className="bg-coffee-900 text-white w-64 min-h-screen p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 p-3 bg-coffee-800 rounded-lg">
        <Coffee className="w-8 h-8 text-cream-300" />
        <div>
          <h1 className="font-bold text-lg">إدارة المقهى</h1>
          <p className="text-xs text-cream-300">Cafe System</p>
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
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-coffee-600 text-white shadow-lg'
                    : 'text-cream-100 hover:bg-coffee-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
      </nav>

      {/* User Info */}
      <div className="mt-auto pt-4 border-t border-coffee-700">
        <div className="px-4 py-3 bg-coffee-800 rounded-lg">
          <p className="text-sm font-semibold">{user?.full_name}</p>
          <p className="text-xs text-cream-300">
            {user?.role === 'admin' ? 'مدير' : 'كاشير'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
