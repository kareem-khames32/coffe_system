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
import DailyDiscounts from './pages/DailyDiscounts';
import Expenses from './pages/Expenses';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import RawMaterials from './pages/RawMaterials';
import Warehouses from './pages/Warehouses';
import InventoryDashboard from './pages/InventoryDashboard';
import WarehousesReport from './pages/WarehousesReport';
import MaterialsReport from './pages/MaterialsReport';
import SuppliersReport from './pages/SuppliersReport';
import PurchasesReport from './pages/PurchasesReport';
import SupplierPayments from './pages/SupplierPayments';
import MaterialBatches from './pages/MaterialBatches';
import StockTransfers from './pages/StockTransfers';

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
            <Route path="/daily-discounts" element={<DailyDiscounts />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/raw-materials" element={<RawMaterials />} />
            <Route path="/inventory-dashboard" element={<InventoryDashboard />} />
            <Route path="/inventory-reports/warehouses" element={<WarehousesReport />} />
            <Route path="/inventory-reports/materials" element={<MaterialsReport />} />
            <Route path="/inventory-reports/suppliers" element={<SuppliersReport />} />
            <Route path="/inventory-reports/purchases" element={<PurchasesReport />} />
            <Route path="/supplier-payments" element={<SupplierPayments />} />
            <Route path="/material-batches" element={<MaterialBatches />} />
            <Route path="/stock-transfers" element={<StockTransfers />} />
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
