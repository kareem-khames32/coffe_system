import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI, ordersAPI, offersAPI, dailyDiscountsAPI } from '../api/services';
import { Plus, Minus, Trash2, ShoppingCart, X, Printer, Coffee, Tag } from 'lucide-react';
import Invoice from '../components/Invoice';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dailyDiscount, setDailyDiscount] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  });
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [productsRes, categoriesRes, offersRes, dailyDiscountRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        offersAPI.getActive(),
        dailyDiscountsAPI.getForDate(today),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      setOffers(offersRes.data.data);

      // Apply daily discount automatically if exists
      if (dailyDiscountRes.data.data) {
        const discount = dailyDiscountRes.data.data;
        setDailyDiscount(discount);
        setDiscountType(discount.discount_type);
        setDiscountValue(discount.discount_value);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.is_active;
  });

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
          cost_price: product.cost_price,
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
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      return Math.min(discountValue, subtotal);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('السلة فارغة');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart,
        ...customerInfo,
        discount_type: discountType,
        discount_value: discountValue,
        offer_id: selectedOffer,
      };

      const response = await ordersAPI.createInStore(orderData);

      // Show invoice
      setLastOrder(response.data.data);
      setShowInvoice(true);

      // Reset cart
      setCart([]);
      setCustomerInfo({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
      });
      setDiscountType('none');
      setDiscountValue(0);
      setSelectedOffer(null);
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">نقطة البيع</h1>
          <p className="text-amber-700">اختر المنتجات لإضافتها للطلب</p>
        </div>

        {/* Daily Discount Banner */}
        {dailyDiscount && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-2xl border-4 border-green-400">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-amber-200 space-y-4">
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
          />

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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-6 rounded-2xl shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="text-center">
                {/* Product Icon/Emoji */}
                <div className="text-6xl mb-4">☕</div>

                {/* Product Name */}
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  {product.name}
                </h3>

                {/* Price Badge */}
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-3 mb-4">
                  <span className="text-2xl font-bold text-amber-900">{product.price}</span>
                  <span className="text-sm text-amber-700 mr-1">ج.م</span>
                </div>

                {/* Materials Availability Indicator (optional, subtle) */}
                {product.materials_available === false && (
                  <div className="text-center">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-orange-100 text-orange-700 border-2 border-orange-300">
                      ⚠️ مواد ناقصة
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-coffee-600" />
            <h2 className="text-xl font-bold text-amber-900">السلة</h2>
            <span className="bg-gradient-to-r from-coffee-600 to-coffee-500 text-white px-3 py-1 rounded-full text-sm shadow-md">
              {cart.length}
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
              >
                <div className="flex-1">
                  <div className="font-bold text-sm text-amber-900">{item.product_name}</div>
                  <div className="text-coffee-600 text-sm font-semibold">
                    {item.price} × {item.quantity} ={' '}
                    {(item.price * item.quantity).toFixed(2)} ج.م
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

          {/* Customer Info */}
          <div className="space-y-2 mb-4">
            <h3 className="font-bold text-sm text-amber-900">بيانات العميل (اختياري)</h3>
            <input
              type="text"
              placeholder="اسم العميل"
              value={customerInfo.customer_name}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
              }
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            />
            <input
              type="tel"
              placeholder="رقم الموبايل"
              value={customerInfo.customer_phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })
              }
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            />
            <input
              type="text"
              placeholder="العنوان"
              value={customerInfo.customer_address}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_address: e.target.value })
              }
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2 mb-4">
            <h3 className="font-bold text-sm text-amber-900">الخصم</h3>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
            >
              <option value="none">بدون خصم</option>
              <option value="percentage">نسبة مئوية %</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
            {discountType !== 'none' && (
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border-2 border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
                placeholder={discountType === 'percentage' ? 'النسبة' : 'المبلغ'}
              />
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span className="font-bold">{calculateSubtotal().toFixed(2)} ج.م</span>
            </div>
            {discountType !== 'none' && (
              <div className="flex justify-between text-red-600">
                <span>الخصم:</span>
                <span className="font-bold">- {calculateDiscount().toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-green-600">
              <span>الإجمالي:</span>
              <span>{calculateTotal().toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Printer className="w-5 h-5" />
            {loading ? 'جاري الإتمام...' : 'إتمام الطلب وطباعة'}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && lastOrder && (
        <Invoice orderData={lastOrder} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default POS;
