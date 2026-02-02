import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, categoriesAPI, ordersAPI, offersAPI, dailyDiscountsAPI } from '../api/services';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, Check, Tag } from 'lucide-react';

const OnlineOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dailyDiscount, setDailyDiscount] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [productsRes, categoriesRes, offersRes, dailyDiscountRes] = await Promise.all([
        productsAPI.getAvailable(),
        categoriesAPI.getAll(),
        offersAPI.getActive(),
        dailyDiscountsAPI.getForDate(today),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data);
      setOffers(offersRes.data.data);

      // Set daily discount if exists
      if (dailyDiscountRes.data.data) {
        setDailyDiscount(dailyDiscountRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'all' || p.category_id === selectedCategory
  );

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
        },
      ]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.product_id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDiscount = () => {
    if (!dailyDiscount) return 0;
    const subtotal = calculateSubtotal();
    if (dailyDiscount.discount_type === 'percentage') {
      return (subtotal * dailyDiscount.discount_value) / 100;
    } else if (dailyDiscount.discount_type === 'fixed') {
      return Math.min(dailyDiscount.discount_value, subtotal);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('السلة فارغة! قم بإضافة منتجات أولاً');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart,
        ...customerInfo,
        offer_id: selectedOffer,
        // إضافة بيانات الخصم اليومي إذا كان موجود
        ...(dailyDiscount && {
          discount_type: dailyDiscount.discount_type,
          discount_value: dailyDiscount.discount_value,
        }),
      };

      const response = await ordersAPI.createOnline(orderData);
      const orderNumber = response.data.data.order_number;

      alert(`تم إنشاء طلبك بنجاح!\nرقم الطلب: ${orderNumber}`);

      // Navigate to track order page
      navigate(`/track-order?order=${orderNumber}`);
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 shadow-2xl border-b-4 border-amber-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <div className="text-3xl">☕</div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">مقهى الأحلام ☕</h1>
                <p className="text-sm text-amber-100">اطلب الآن واستمتع بأفضل المشروبات 🎉</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-3 rounded-xl shadow-lg font-bold">
              <ShoppingCart className="w-6 h-6" />
              <span className="text-lg">{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Daily Discount Banner */}
        {dailyDiscount && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-2xl border-4 border-green-400 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-4 rounded-full">
                  <Tag className="w-10 h-10" />
                </div>
                <div>
                  <div className="text-sm opacity-90 font-semibold">🎉 خصم اليوم - متطبق تلقائياً</div>
                  <h2 className="text-3xl font-bold">{dailyDiscount.name}</h2>
                  {dailyDiscount.description && (
                    <p className="text-sm opacity-90 mt-1">{dailyDiscount.description}</p>
                  )}
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-6 text-center">
                <div className="text-sm opacity-90">خصم</div>
                <div className="text-5xl font-bold">
                  {dailyDiscount.discount_type === 'percentage'
                    ? `${dailyDiscount.discount_value}%`
                    : `${dailyDiscount.discount_value} ج.م`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offers Banner */}
        {offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => setSelectedOffer(offer.id)}
                className={`relative overflow-hidden rounded-2xl shadow-xl cursor-pointer transform transition-all hover:scale-105 ${
                  selectedOffer === offer.id
                    ? 'ring-4 ring-green-500'
                    : ''
                }`}
                style={{
                  background: offer.offer_type === 'percentage'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : offer.offer_type === 'fixed'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                }}
              >
                <div className="p-6 text-white">
                  {/* Offer Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                      <Tag className="w-8 h-8" />
                    </div>
                    {selectedOffer === offer.id && (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ✓ محدد
                      </div>
                    )}
                  </div>

                  {/* Offer Name */}
                  <h3 className="text-2xl font-bold mb-2">{offer.name}</h3>

                  {/* Offer Description */}
                  {offer.description && (
                    <p className="text-sm opacity-90 mb-4">{offer.description}</p>
                  )}

                  {/* Offer Value */}
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-3">
                    <div className="text-center">
                      {offer.offer_type === 'percentage' && (
                        <>
                          <div className="text-sm opacity-90">خصم</div>
                          <div className="text-4xl font-bold">{offer.discount_value}%</div>
                        </>
                      )}
                      {offer.offer_type === 'fixed' && (
                        <>
                          <div className="text-sm opacity-90">خصم</div>
                          <div className="text-4xl font-bold">{offer.discount_value} ج.م</div>
                        </>
                      )}
                      {offer.offer_type === 'buy_x_get_y' && (
                        <>
                          <div className="text-sm opacity-90">اشتري</div>
                          <div className="text-4xl font-bold">{offer.buy_quantity}</div>
                          <div className="text-sm opacity-90">واحصل على {offer.get_quantity} مجاناً</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Offer Dates */}
                  <div className="flex justify-between text-xs opacity-75">
                    <span>يبدأ: {new Date(offer.start_date).toLocaleDateString('ar-EG')}</span>
                    <span>ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {/* Corner Ribbon */}
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-bl-xl font-bold text-sm shadow-lg">
                  🎉 عرض خاص
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Categories */}
            <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-amber-200">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all shadow-md ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-coffee-600 to-coffee-500 text-white'
                      : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200'
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all shadow-md ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-coffee-600 to-coffee-500 text-white'
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-6 rounded-2xl shadow-xl border-2 border-amber-200 hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <div className="text-center">
                    {/* Product Emoji */}
                    <div className="text-6xl mb-4">☕</div>

                    <h3 className="text-xl font-bold text-amber-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-amber-700 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price Badge */}
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-3 mb-4">
                      <span className="text-2xl font-bold text-amber-900">{product.price}</span>
                      <span className="text-sm text-amber-700 mr-1">ج.م</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 font-bold"
                    >
                      <Plus className="w-5 h-5" />
                      إضافة للسلة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Checkout Section */}
          <div className="space-y-4">
            {/* Cart */}
            <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-amber-200 sticky top-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-900">
                <ShoppingCart className="w-6 h-6 text-coffee-600" />
                سلة المشتريات
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-amber-600">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                  <p>السلة فارغة</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="flex-1">
                          <div className="font-bold text-sm text-amber-900">{item.product_name}</div>
                          <div className="text-coffee-600 text-sm font-semibold">
                            {item.price} × {item.quantity} = {(item.price * item.quantity).toFixed(2)} ج.م
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product_id, -1)}
                            className="p-1 bg-amber-200 rounded-lg hover:bg-amber-300 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-amber-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, 1)}
                            className="p-1 bg-amber-200 rounded-lg hover:bg-amber-300 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="p-1 bg-gradient-to-r from-red-100 to-red-200 text-red-600 rounded-lg hover:from-red-200 hover:to-red-300 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-bold">{calculateSubtotal().toFixed(2)} ج.م</span>
                    </div>
                    {dailyDiscount && (
                      <div className="flex justify-between text-red-600">
                        <span>الخصم (خصم اليوم):</span>
                        <span className="font-bold">- {calculateDiscount().toFixed(2)} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>الإجمالي:</span>
                      <span>{calculateTotal().toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {/* Customer Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <h3 className="font-bold text-amber-900">بياناتك</h3>
                    <input
                      type="text"
                      placeholder="الاسم *"
                      value={customerInfo.customer_name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none"
                      required
                      disabled={loading}
                    />
                    <input
                      type="tel"
                      placeholder="رقم الموبايل *"
                      value={customerInfo.customer_phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none"
                      required
                      disabled={loading}
                    />
                    <textarea
                      placeholder="العنوان *"
                      value={customerInfo.customer_address}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_address: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 outline-none"
                      rows="2"
                      required
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Check className="w-5 h-5" />
                      {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineOrder;
