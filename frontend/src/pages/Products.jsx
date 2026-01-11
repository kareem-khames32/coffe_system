import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI, rawMaterialsAPI, recipesAPI } from '../api/services';
import { Plus, Edit, Trash2, X, Package, Search, Filter, ChefHat } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    cost_price: '',
    stock: '',
    description: '',
    is_active: true,
  });
  const [recipe, setRecipe] = useState([]);
  const [newRecipeItem, setNewRecipeItem] = useState({
    raw_material_id: '',
    quantity_needed: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, rawMaterialsRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        rawMaterialsAPI.getActive(),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      setRawMaterials(rawMaterialsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category_id === parseInt(filterCategory);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && product.is_active) ||
      (filterStatus === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate total cost from recipe
  const calculateRecipeCost = () => {
    return recipe.reduce((total, item) => {
      const material = rawMaterials.find((m) => m.id === item.raw_material_id);
      if (material) {
        return total + parseFloat(material.unit_cost) * parseFloat(item.quantity_needed);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock: parseInt(formData.stock),
        category_id: parseInt(formData.category_id),
      };

      let productId;
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        productId = editingProduct.id;
        alert('تم تحديث المنتج بنجاح');
      } else {
        const result = await productsAPI.create(data);
        productId = result.data.data.id;
        alert('تم إضافة المنتج بنجاح');
      }

      // Save recipe if any items added
      if (recipe.length > 0) {
        await recipesAPI.updateProductRecipe(productId, recipe);
      }

      fetchData();
      closeModal();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      cost_price: product.cost_price,
      stock: product.stock,
      description: product.description || '',
      is_active: product.is_active,
    });

    // Fetch product recipe
    try {
      const recipeRes = await recipesAPI.getProductRecipe(product.id);
      if (recipeRes.data.success && recipeRes.data.data.length > 0) {
        setRecipe(recipeRes.data.data);
      } else {
        setRecipe([]);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setRecipe([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await productsAPI.delete(id);
      alert('تم حذف المنتج بنجاح');
      fetchData();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const toggleStatus = async (product) => {
    try {
      await productsAPI.update(product.id, {
        ...product,
        is_active: !product.is_active,
      });
      fetchData();
    } catch (error) {
      alert('حدث خطأ: ' + (error.response?.data?.message || 'خطأ في الخادم'));
    }
  };

  const openModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: '',
      price: '',
      cost_price: '',
      stock: '',
      description: '',
      is_active: true,
    });
    setRecipe([]);
    setNewRecipeItem({ raw_material_id: '', quantity_needed: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setRecipe([]);
    setNewRecipeItem({ raw_material_id: '', quantity_needed: '' });
  };

  // Recipe management functions
  const addRecipeItem = () => {
    if (!newRecipeItem.raw_material_id || !newRecipeItem.quantity_needed) {
      alert('يرجى اختيار المادة الخام وإدخال الكمية');
      return;
    }

    // Check if material already in recipe
    if (recipe.find((item) => item.raw_material_id === parseInt(newRecipeItem.raw_material_id))) {
      alert('هذه المادة موجودة بالفعل في الوصفة');
      return;
    }

    setRecipe([
      ...recipe,
      {
        raw_material_id: parseInt(newRecipeItem.raw_material_id),
        quantity_needed: parseFloat(newRecipeItem.quantity_needed),
      },
    ]);
    setNewRecipeItem({ raw_material_id: '', quantity_needed: '' });
  };

  const removeRecipeItem = (materialId) => {
    setRecipe(recipe.filter((item) => item.raw_material_id !== materialId));
  };

  const getMaterialInfo = (materialId) => {
    return rawMaterials.find((m) => m.id === materialId);
  };

  const getProfit = (price, cost) => {
    return (price - cost).toFixed(2);
  };

  const getProfitMargin = (price, cost) => {
    if (price === 0) return 0;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-gray-600 mt-1">إدارة منتجات المقهى</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-coffee-600 hover:bg-coffee-700 text-white px-6 py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          >
            <option value="all">جميع الفئات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
          >
            <option value="all">جميع المنتجات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-700 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold">المنتج</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الفئة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">السعر</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">التكلفة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الربح</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">المخزون</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الحالة</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-cream-100 p-2 rounded">
                        <Package className="w-5 h-5 text-coffee-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.category_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-coffee-600">
                    {product.price} ج.م
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.cost_price} ج.م
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-green-600 font-semibold">
                      {getProfit(product.price, product.cost_price)} ج.م
                    </div>
                    <div className="text-xs text-gray-500">
                      {getProfitMargin(product.price, product.cost_price)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-semibold ${
                        product.stock === 0
                          ? 'text-red-600'
                          : product.stock <= 10
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(product)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'نشط' : 'غير نشط'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                لا توجد منتجات
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'لا توجد نتائج مطابقة لبحثك'
                  : 'قم بإضافة أول منتج'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="مثال: كابتشينو"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    required
                    disabled={loading}
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === 'active' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    disabled={loading}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر البيع (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="35.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر التكلفة (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="15.00"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الكمية في المخزون *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="100"
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
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                    placeholder="وصف مختصر للمنتج"
                    rows="3"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Recipe Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <ChefHat className="w-5 h-5 text-coffee-600" />
                  <h3 className="text-lg font-semibold text-gray-900">وصفة المنتج (المكونات)</h3>
                </div>

                {/* Add Recipe Item */}
                <div className="bg-cream-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المادة الخام
                      </label>
                      <select
                        value={newRecipeItem.raw_material_id}
                        onChange={(e) =>
                          setNewRecipeItem({ ...newRecipeItem, raw_material_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none text-sm"
                        disabled={loading}
                      >
                        <option value="">اختر المادة</option>
                        {rawMaterials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.unit_cost} ج.م/{material.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الكمية المطلوبة
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={newRecipeItem.quantity_needed}
                        onChange={(e) =>
                          setNewRecipeItem({ ...newRecipeItem, quantity_needed: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none text-sm"
                        placeholder="الكمية"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addRecipeItem}
                        disabled={loading}
                        className="w-full bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                      >
                        إضافة مكون
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipe Items Table */}
                {recipe.length > 0 && (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">المادة الخام</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">الكمية</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">الوحدة</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">سعر الوحدة</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">التكلفة</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recipe.map((item) => {
                          const material = getMaterialInfo(item.raw_material_id);
                          const itemCost = material
                            ? (parseFloat(material.unit_cost) * parseFloat(item.quantity_needed)).toFixed(2)
                            : '0.00';
                          return (
                            <tr key={item.raw_material_id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{material?.name || 'غير معروف'}</td>
                              <td className="px-4 py-2">{item.quantity_needed}</td>
                              <td className="px-4 py-2">{material?.unit || '-'}</td>
                              <td className="px-4 py-2">{material?.unit_cost || '0'} ج.م</td>
                              <td className="px-4 py-2 font-semibold text-coffee-600">{itemCost} ج.م</td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeRecipeItem(item.raw_material_id)}
                                  disabled={loading}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-coffee-50">
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-right font-semibold text-gray-900">
                            إجمالي التكلفة:
                          </td>
                          <td className="px-4 py-2 font-bold text-coffee-700 text-base">
                            {calculateRecipeCost().toFixed(2)} ج.م
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {recipe.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    لم يتم إضافة أي مكونات للوصفة بعد
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-coffee-600 hover:bg-coffee-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إضافة'}
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

export default Products;
