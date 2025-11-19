import { useEffect, useState } from 'react';
import { usersAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Users as UsersIcon, Shield } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
    can_make_sales: true,
    can_view_inventory: true,
    can_manage_inventory: false,
    can_add_expenses: false,
    can_view_reports: false,
    can_manage_offers: false,
    can_apply_discounts: false,
    can_manage_online_orders: false,
    can_view_order_details: true,
    can_cancel_edit_orders: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { ...formData };

      // Don't send password if editing and password is empty
      if (editingUser && !data.password) {
        delete data.password;
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, data);
        alert('تم تحديث المستخدم بنجاح');
      } else {
        await usersAPI.create(data);
        alert('تم إضافة المستخدم بنجاح');
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role: user.role,
      can_make_sales: user.can_make_sales,
      can_view_inventory: user.can_view_inventory,
      can_manage_inventory: user.can_manage_inventory,
      can_add_expenses: user.can_add_expenses,
      can_view_reports: user.can_view_reports,
      can_manage_offers: user.can_manage_offers,
      can_apply_discounts: user.can_apply_discounts,
      can_manage_online_orders: user.can_manage_online_orders,
      can_view_order_details: user.can_view_order_details,
      can_cancel_edit_orders: user.can_cancel_edit_orders,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await usersAPI.delete(id);
      alert('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'cashier',
      can_make_sales: true,
      can_view_inventory: true,
      can_manage_inventory: false,
      can_add_expenses: false,
      can_view_reports: false,
      can_manage_offers: false,
      can_apply_discounts: false,
      can_manage_online_orders: false,
      can_view_order_details: true,
      can_cancel_edit_orders: false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const permissions = [
    { key: 'can_make_sales', label: 'إجراء مبيعات' },
    { key: 'can_view_inventory', label: 'عرض المخزون' },
    { key: 'can_manage_inventory', label: 'إدارة المخزون' },
    { key: 'can_add_expenses', label: 'إضافة مصروفات' },
    { key: 'can_view_reports', label: 'عرض التقارير' },
    { key: 'can_manage_offers', label: 'إدارة العروض' },
    { key: 'can_apply_discounts', label: 'تطبيق الخصومات' },
    { key: 'can_manage_online_orders', label: 'إدارة الطلبات الأونلاين' },
    { key: 'can_view_order_details', label: 'عرض تفاصيل الطلبات' },
    { key: 'can_cancel_edit_orders', label: 'إلغاء وتعديل الطلبات' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستخدمين</h1>
          <p className="text-gray-600 mt-1">إدارة مستخدمي النظام والصلاحيات</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-coffee-700 text-white">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold">المستخدم</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">اسم المستخدم</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الدور</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الصلاحيات</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const userPermissions = permissions.filter(p => user[p.key]).length;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-cream-100 p-2 rounded-full">
                        <UsersIcon className="w-5 h-5 text-coffee-600" />
                      </div>
                      <div className="font-semibold text-gray-900">{user.full_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <code className="bg-gray-100 px-2 py-1 rounded">{user.username}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'مدير' : 'كاشير'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-purple-600 font-semibold">
                        <Shield className="w-4 h-4" />
                        جميع الصلاحيات
                      </span>
                    ) : (
                      `${userPermissions} من ${permissions.length} صلاحية`
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">المعلومات الأساسية</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المستخدم *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كلمة المرور {!editingUser && '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      required={!editingUser}
                      disabled={loading}
                      placeholder={editingUser ? 'اتركها فارغة إذا لم ترد التغيير' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الدور *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      disabled={loading}
                    >
                      <option value="admin">مدير</option>
                      <option value="cashier">كاشير</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {formData.role !== 'admin' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">الصلاحيات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={formData[perm.key]}
                          onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                          className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500"
                          disabled={loading}
                        />
                        <span className="text-sm font-medium">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingUser ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition disabled:opacity-50"
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

export default Users;
