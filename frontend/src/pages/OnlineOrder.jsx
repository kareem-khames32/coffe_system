import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, categoriesAPI, ordersAPI } from '../api/services';
import { ShoppingCart, Plus, Minus, Trash2, Coffee, Check } from 'lucide-react';

const OnlineOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
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
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.data.filter(p => p.is_active));
      setCategories(categoriesRes.data.data);
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

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
    <div className="min-h-screen bg-gradient-to-br from-coffee-700 via-coffee-600 to-coffee-800">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="w-10 h-10 text-coffee-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مقهى الأحلام</h1>
                <p className="text-sm text-gray-600">اطلب الآن واستمتع بأفضل المشروبات</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-coffee-600 text-white px-4 py-2 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold">{cart.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Categories */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    selectedCategory === 'all'
                      ? 'bg-coffee-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-coffee-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
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
                  className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition"
                >
                  <div className="text-center">
                    <div className="bg-cream-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3">
                      <Coffee className="w-10 h-10 text-coffee-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="text-coffee-600 font-bold text-lg mb-3">
                      {product.price} ج.م
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Checkout Section */}
          <div className="space-y-4">
            {/* Cart */}
            <div className="bg-white p-4 rounded-lg shadow-lg sticky top-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                سلة المشتريات
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>السلة فارغة</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{item.product_name}</div>
                          <div className="text-coffee-600 text-sm">
                            {item.price} × {item.quantity} = {(item.price * item.quantity).toFixed(2)} ج.م
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product_id, -1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-green-600">{calculateTotal().toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {/* Customer Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <h3 className="font-semibold">بياناتك</h3>
                    <input
                      type="text"
                      placeholder="الاسم *"
                      value={customerInfo.customer_name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
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
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      required
                      disabled={loading}
                    />
                    <textarea
                      placeholder="العنوان *"
                      value={customerInfo.customer_address}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, customer_address: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      rows="2"
                      required
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
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
