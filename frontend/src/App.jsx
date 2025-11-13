import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';

// Simple placeholder pages for now
const Products = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">إدارة المنتجات</h1>
    <p>صفحة إدارة المنتجات - قيد التطوير</p>
  </div>
);

const Categories = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">إدارة الفئات</h1>
    <p>صفحة إدارة الفئات - قيد التطوير</p>
  </div>
);

const Orders = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">الطلبات</h1>
    <p>صفحة عرض وإدارة الطلبات - قيد التطوير</p>
  </div>
);

const Users = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">إدارة المستخدمين</h1>
    <p>صفحة إدارة المستخدمين - قيد التطوير</p>
  </div>
);

const Offers = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">إدارة العروض</h1>
    <p>صفحة إدارة العروض - قيد التطوير</p>
  </div>
);

const Expenses = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">المصروفات</h1>
    <p>صفحة إدارة المصروفات - قيد التطوير</p>
  </div>
);

const Purchases = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">المشتريات</h1>
    <p>صفحة إدارة المشتريات - قيد التطوير</p>
  </div>
);

const Reports = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">التقارير</h1>
    <p>صفحة التقارير - قيد التطوير</p>
  </div>
);

const Settings = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
    <p>صفحة الإعدادات - قيد التطوير</p>
  </div>
);

// Public pages (no auth required)
const OnlineOrder = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">اطلب الآن</h1>
      <p>صفحة الطلب الأونلاين للعملاء - قيد التطوير</p>
    </div>
  </div>
);

const TrackOrder = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">تتبع طلبك</h1>
      <p>صفحة تتبع الطلب - قيد التطوير</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/online-order" element={<OnlineOrder />} />
          <Route path="/track-order" element={<TrackOrder />} />

          {/* Protected Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/users" element={<Users />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
