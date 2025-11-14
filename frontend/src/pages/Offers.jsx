import { useEffect, useState } from 'react';
import { offersAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Gift, Percent, DollarSign } from 'lucide-react';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    offer_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await offersAPI.getAll();
      setOffers(response.data.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        offer_type: formData.offer_type,
        discount_value: parseFloat(formData.discount_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
      };

      if (editingOffer) {
        await offersAPI.update(editingOffer.id, data);
        alert('تم تحديث العرض بنجاح');
      } else {
        await offersAPI.create(data);
        alert('تم إضافة العرض بنجاح');
      }
      fetchOffers();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description || '',
      offer_type: offer.offer_type,
      discount_value: offer.discount_value,
      start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
      is_active: offer.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      await offersAPI.delete(id);
      alert('تم حذف العرض بنجاح');
      fetchOffers();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await offersAPI.update(offer.id, {
        ...offer,
        is_active: !offer.is_active,
      });
      fetchOffers();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingOffer(null);
    setFormData({
      name: '',
      description: '',
      offer_type: 'percentage',
      discount_value: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOffer(null);
  };

  const isOfferExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">العروض</h1>
          <p className="text-gray-600 mt-1">إدارة عروض وخصومات المقهى</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة عرض جديد
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer, index) => {
          const gradients = [
            'from-purple-600 to-purple-700',
            'from-pink-600 to-pink-700',
            'from-orange-600 to-orange-700',
            'from-green-600 to-green-700',
          ];
          const gradient = gradients[index % gradients.length];
          const expired = isOfferExpired(offer.end_date);

          return (
            <div
              key={offer.id}
              className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ${
                !offer.is_active || expired ? 'opacity-60' : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95`}></div>

              {/* Content */}
              <div className="relative p-6 text-white">
                {/* Icon & Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(offer)}
                      className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-2 bg-red-500/70 hover:bg-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Offer Name */}
                <h3 className="text-xl font-bold mb-3">{offer.name}</h3>

                {/* Discount Badge */}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 justify-center">
                    {offer.offer_type === 'percentage' ? (
                      <>
                        <Percent className="w-6 h-6" />
                        <span className="text-3xl font-bold">{offer.discount_value}</span>
                        <span className="text-lg">خصم</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-6 h-6" />
                        <span className="text-3xl font-bold">{offer.discount_value}</span>
                        <span className="text-lg">ج.م</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {offer.description && (
                  <p className="text-sm text-white/90 mb-4">{offer.description}</p>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm text-white/90">
                  <div className="flex justify-between">
                    <span>يبدأ:</span>
                    <span className="font-semibold">
                      {new Date(offer.start_date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ينتهي:</span>
                    <span className="font-semibold">
                      {new Date(offer.end_date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <button
                    onClick={() => toggleStatus(offer)}
                    className={`w-full py-2 rounded-lg font-semibold text-sm ${
                      expired
                        ? 'bg-gray-500 cursor-not-allowed'
                        : offer.is_active
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    disabled={expired}
                  >
                    {expired ? 'منتهي' : offer.is_active ? 'نشط' : 'غير نشط'}
                  </button>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"></div>
            </div>
          );
        })}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد عروض</h3>
          <p className="text-gray-500 mb-4">قم بإضافة أول عرض للمقهى</p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            إضافة عرض
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم العرض *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="مثال: عرض نهاية الأسبوع"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder="وصف العرض"
                    rows="2"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الخصم *
                  </label>
                  <select
                    value={formData.offer_type}
                    onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    disabled={loading}
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قيمة الخصم *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    placeholder={formData.offer_type === 'percentage' ? '20' : '50'}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ البداية *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ النهاية *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-700">العرض نشط</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingOffer ? 'تحديث' : 'إضافة'}
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

export default Offers;
