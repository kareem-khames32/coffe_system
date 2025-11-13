import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI, ordersAPI } from '../api/services';
import { Plus, Minus, Trash2, ShoppingCart, X, Printer } from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  });
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
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
      if (existing.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert('لا يوجد مخزون كافٍ');
      }
    } else {
      if (product.stock > 0) {
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
      } else {
        alert('المنتج غير متوفر');
      }
    }
  };

  const updateQuantity = (productId, delta) => {
    const product = products.find((p) => p.id === productId);
    setCart(
      cart
        .map((item) => {
          if (item.product_id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > product.stock) {
              alert('لا يوجد مخزون كافٍ');
              return item;
            }
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
      };

      const response = await ordersAPI.createInStore(orderData);

      alert('تم إنشاء الطلب بنجاح!');
      // Print invoice
      printInvoice(response.data.data);
      // Reset
      setCart([]);
      setCustomerInfo({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
      });
      setDiscountType('none');
      setDiscountValue(0);
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (orderData) => {
    // Simple print - يمكن تحسينها لاحقاً
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">نقطة البيع</h1>
          <p className="text-gray-600">اختر المنتجات لإضافتها للطلب</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
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
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition text-right"
              disabled={product.stock === 0}
            >
              <div
                className={`font-semibold ${product.stock === 0 ? 'text-gray-400' : ''}`}
              >
                {product.name}
              </div>
              <div className="text-blue-600 font-bold mt-2">
                {product.price} ج.م
              </div>
              <div
                className={`text-sm mt-1 ${product.stock <= 10 ? 'text-red-500' : 'text-gray-500'}`}
              >
                المخزون: {product.stock}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-xl font-bold">السلة</h2>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
              {cart.length}
            </span>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="font-semibold text-sm">{item.product_name}</div>
                  <div className="text-blue-600 text-sm">
                    {item.price} × {item.quantity} ={' '}
                    {(item.price * item.quantity).toFixed(2)} ج.م
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

          {/* Customer Info */}
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-sm">بيانات العميل (اختياري)</h3>
            <input
              type="text"
              placeholder="اسم العميل"
              value={customerInfo.customer_name}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="tel"
              placeholder="رقم الموبايل"
              value={customerInfo.customer_phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="العنوان"
              value={customerInfo.customer_address}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, customer_address: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-sm">الخصم</h3>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
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
                className="w-full px-3 py-2 border rounded text-sm"
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
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            {loading ? 'جاري الإتمام...' : 'إتمام الطلب وطباعة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
