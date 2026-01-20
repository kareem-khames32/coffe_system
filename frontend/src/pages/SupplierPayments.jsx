import { useEffect, useState } from 'react';
import { supplierPaymentsAPI, suppliersAPI, inventoryPurchasesAPI } from '../api/services';
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CreditCard,
  Filter,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const formatCurrency = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const SupplierPayments = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [unpaidPurchases, setUnpaidPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [supplierId, setSupplierId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, supplierId, fromDate, toDate]);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getActive();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'payments') {
        const params = {};
        if (supplierId) params.supplier_id = supplierId;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;

        const response = await supplierPaymentsAPI.getAll(params);
        setPayments(response.data.data);
      } else if (activeTab === 'unpaid') {
        const response = await supplierPaymentsAPI.getUnpaidPurchases();
        setUnpaidPurchases(response.data.data);
      } else if (activeTab === 'stats') {
        const params = {};
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;

        const response = await supplierPaymentsAPI.getStats(params);
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    try {
      await supplierPaymentsAPI.addPayment(formData);
      alert('تم إضافة الدفعة بنجاح');
      setShowAddModal(false);
      setFormData({
        supplier_id: '',
        purchase_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.message || 'فشل في إضافة الدفعة');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;

    try {
      await supplierPaymentsAPI.deletePayment(id);
      alert('تم حذف الدفعة بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('فشل في حذف الدفعة');
    }
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'نقدي',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      credit: 'آجل',
    };
    return methods[method] || method;
  };

  const tabs = [
    { id: 'payments', name: 'جميع الدفعات', icon: DollarSign },
    { id: 'unpaid', name: 'فواتير غير مدفوعة', icon: AlertCircle },
    { id: 'stats', name: 'الإحصائيات', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            دفعات الموردين
          </h1>
          <p className="text-amber-700 mt-1">إدارة دفعات ومستحقات الموردين</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة دفعة
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-coffee-600 to-coffee-500 text-white shadow-lg'
                  : 'bg-gray-100 text-amber-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {(activeTab === 'payments' || activeTab === 'stats') && (
        <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-4">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === 'payments' && (
              <div>
                <label className="block text-amber-900 font-semibold mb-2">المورد:</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                >
                  <option value="">جميع الموردين</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-amber-900 font-semibold mb-2">من تاريخ:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-semibold mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSupplierId('');
                  setFromDate('');
                  setToDate('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-amber-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
        </div>
      ) : (
        <>
          {/* Payments List */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        التاريخ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المورد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المبلغ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        طريقة الدفع
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم المرجع
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-amber-700">
                          لا توجد دفعات
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-amber-50 transition-colors">
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(payment.payment_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {payment.supplier_name}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {payment.invoice_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold text-lg">
                            {formatCurrency(payment.amount)} ج.م
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {getPaymentMethodLabel(payment.payment_method)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {payment.reference_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unpaid Purchases */}
          {activeTab === 'unpaid' && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        رقم الفاتورة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المورد
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الشراء
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        تاريخ الاستحقاق
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        الإجمالي
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المدفوع
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-amber-900 uppercase">
                        المتبقي
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-amber-900 uppercase">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {unpaidPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-green-600 font-semibold">
                          ✓ جميع الفواتير مدفوعة
                        </td>
                      </tr>
                    ) : (
                      unpaidPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-amber-900">
                            {purchase.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-amber-900">
                            {purchase.supplier_name}
                            {purchase.supplier_phone && (
                              <div className="text-xs text-gray-500">{purchase.supplier_phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {new Date(purchase.purchase_date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 text-amber-700">
                            {purchase.due_date
                              ? new Date(purchase.due_date).toLocaleDateString('ar-EG')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-amber-900 font-semibold">
                            {formatCurrency(purchase.total_amount)} ج.م
                          </td>
                          <td className="px-6 py-4 text-green-600 font-semibold">
                            {formatCurrency(purchase.paid_amount)} ج.م
                          </td>
                          <td className="px-6 py-4 text-red-600 font-bold text-lg">
                            {formatCurrency(purchase.remaining_amount)} ج.م
                          </td>
                          <td className="px-6 py-4 text-center">
                            {purchase.days_overdue > 0 ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                متأخر {purchase.days_overdue} يوم
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                {purchase.payment_status === 'unpaid' ? 'غير مدفوع' : 'جزئي'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setFormData({
                                  supplier_id: purchase.supplier_id,
                                  purchase_id: purchase.id,
                                  amount: purchase.remaining_amount,
                                  payment_date: new Date().toISOString().split('T')[0],
                                  payment_method: 'cash',
                                  reference_number: '',
                                  notes: '',
                                });
                                setShowAddModal(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all shadow-md font-semibold"
                            >
                              سداد
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold">عدد الدفعات</p>
                      <p className="text-3xl font-bold mt-2">{stats.overall.total_payments}</p>
                    </div>
                    <FileText className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-semibold">إجمالي المدفوع</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(stats.overall.total_amount)} ج.م
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 opacity-80" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-semibold">إجمالي الديون</p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(stats.debt.total_debt)} ج.م
                      </p>
                    </div>
                    <AlertCircle className="w-12 h-12 opacity-80" />
                  </div>
                </div>
              </div>

              {/* By Payment Method */}
              <div className="bg-white rounded-xl shadow-xl border-2 border-amber-200 p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-4">حسب طريقة الدفع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.by_method.map((method) => (
                    <div
                      key={method.payment_method}
                      className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200"
                    >
                      <p className="text-amber-700 font-semibold mb-2">
                        {getPaymentMethodLabel(method.payment_method)}
                      </p>
                      <p className="text-2xl font-bold text-amber-900">
                        {formatCurrency(method.total_amount)} ج.م
                      </p>
                      <p className="text-sm text-amber-600 mt-1">
                        {method.method_count} دفعة
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">
              {formData.purchase_id ? 'سداد دفعة' : 'إضافة دفعة جديدة'}
            </h2>

            {formData.purchase_id && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  💡 سيتم ربط هذه الدفعة بالفاتورة وسيتم تحديث حالة السداد تلقائياً
                </p>
                <p className="text-xs text-blue-700">
                  رقم الفاتورة: {unpaidPurchases.find(p => p.id === formData.purchase_id)?.invoice_number || '-'}
                </p>
              </div>
            )}

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    المورد <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500 disabled:bg-gray-100"
                    required
                    disabled={!!formData.purchase_id}
                  >
                    <option value="">اختر المورد</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    المبلغ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">
                    تاريخ الدفع <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">طريقة الدفع</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="credit">آجل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">رقم المرجع</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) =>
                      setFormData({ ...formData, reference_number: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                    placeholder="رقم الشيك/التحويل"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-900 font-semibold mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-coffee-500"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-700 hover:to-coffee-600 text-white rounded-xl transition-all shadow-lg font-semibold"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-amber-900 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPayments;
