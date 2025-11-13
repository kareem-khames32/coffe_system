import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Settings from './pages/Settings';
import OnlineOrder from './pages/OnlineOrder';
import TrackOrder from './pages/TrackOrder';
import Offers from './pages/Offers';

// Placeholder pages for features not yet implemented

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
