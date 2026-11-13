import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  MoveLeft,
  MoveRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Globe2,
  DollarSign,
  Tag,
  Layers,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { MARKETPLACE_CATEGORIES } from '@/data/categories';
import {
  validateUploadFile,
  createLocalImagePreview,
  uploadAsset,
} from '@/services/uploadService';
import {
  getSellerStoreMe,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
} from '@/services/sellerService';

export default function ProductForm() {
  const { id: editProductId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(Boolean(editProductId));
  const [submitting, setSubmitting] = useState(false);
  const [store, setStore] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    brand: 'Tokyo Optics & Craft',
    description: '',
    category: 'electronics',
    subcategory: 'Cameras & Optics',
    sku: `OPT-${Math.floor(1000 + Math.random() * 9000)}`,
    originalPrice: 28000,
    discountPrice: '',
    currency: 'JPY',
    taxConfiguration: 'EXPORT_EXEMPT',
    stock: 15,
    lowStockThreshold: 5,
    weightKg: 0.65,
    originCountry: 'JP',
    destinationCountries: ['US', 'DE', 'GB', 'SG', 'IN', 'JP', 'FR', 'AU'],
    processingTime: '1-2 business days',
    shippingRestrictions: 'Lithium-ion air freight regulations compliant (UN3481).',
    status: 'ACTIVE',
  });

  // Variants state: [{ id, name, size, color, sku, stock }]
  const [variants, setVariants] = useState([
    { id: 'var-1', name: 'Standard Kit', color: 'Matte Black', size: 'Standard', stock: 15 },
  ]);

  // Images state: [{ id, url, file, previewObj, isPrimary }]
  const [images, setImages] = useState([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      isPrimary: true,
    },
  ]);

  // Load store and if editing, load product
  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!user?.email) return;
      try {
        const storeData = await getSellerStoreMe(user.email);
        if (mounted && storeData) {
          setStore(storeData);
          setFormData((prev) => ({
            ...prev,
            currency: storeData.merchantCurrency || 'JPY',
            originCountry: storeData.shippingOrigin || 'JP',
          }));

          if (editProductId && storeData.id) {
            const products = await getSellerProducts(storeData.id);
            const found = (products || []).find((p) => p.id === editProductId);
            if (found && mounted) {
              setFormData({
                title: found.title || '',
                brand: found.brand || 'Tokyo Optics & Craft',
                description: found.description || '',
                category: found.category?.toLowerCase() || 'electronics',
                subcategory: found.subcategory || 'Cameras & Optics',
                sku: found.sku || `SKU-${editProductId}`,
                originalPrice: found.originalPrice || 25000,
                discountPrice: found.discountPrice || '',
                currency: found.currency || storeData.merchantCurrency || 'JPY',
                taxConfiguration: found.taxConfiguration || 'EXPORT_EXEMPT',
                stock: found.stock ?? 10,
                lowStockThreshold: found.lowStockThreshold ?? 5,
                weightKg: found.weightKg || 0.5,
                originCountry: found.originCountry || storeData.shippingOrigin || 'JP',
                destinationCountries: found.destinationCountries || ['US', 'DE', 'GB', 'SG', 'IN'],
                processingTime: found.processingTime || '1-2 business days',
                shippingRestrictions: found.shippingRestrictions || '',
                status: found.status || 'ACTIVE',
              });

              if (found.imageUrl) {
                setImages([{ id: 'img-main', url: found.imageUrl, isPrimary: true }]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load product form data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [user?.email, editProductId]);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewObj?.revoke) img.previewObj.revoke();
      });
    };
  }, [images]);

  // Handle local image file selections
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImageItems = [];
    for (const file of files) {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        showToast({ title: 'Invalid Image', description: `${file.name}: ${validation.error}`, tone: 'critical' });
        continue;
      }
      try {
        const preview = createLocalImagePreview(file);
        newImageItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: preview.previewUrl,
          file,
          previewObj: preview,
          isPrimary: images.length === 0 && newImageItems.length === 0,
        });
      } catch (err) {
        showToast({ title: 'Upload error', description: err.message, tone: 'critical' });
      }
    }

    if (newImageItems.length > 0) {
      setImages((prev) => {
        const combined = [...prev, ...newImageItems];
        // Ensure at least one primary
        if (!combined.some((img) => img.isPrimary)) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
      showToast({ title: 'Images added', description: `${newImageItems.length} image(s) queued for upload.`, tone: 'info' });
    }
  };

  const setPrimaryImage = (id) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewObj?.revoke) target.previewObj.revoke();
      const filtered = prev.filter((i) => i.id !== id);
      if (filtered.length > 0 && !filtered.some((i) => i.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const moveImage = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Variants management
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        name: `Option ${prev.length + 1}`,
        color: '',
        size: '',
        stock: 5,
      },
    ]);
  };

  const removeVariant = (id) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Submit action
  const handleSubmit = async (targetStatus) => {
    if (!formData.title.trim()) {
      showToast({ title: 'Title required', description: 'Please provide a product title.', tone: 'critical' });
      return;
    }
    if (Number(formData.originalPrice) <= 0) {
      showToast({ title: 'Invalid price', description: 'Product price must be greater than zero.', tone: 'critical' });
      return;
    }

    setSubmitting(true);
    try {
      // Find primary image or first
      const primaryImg = images.find((i) => i.isPrimary) || images[0];
      let primaryUrl = primaryImg?.url || '';

      // Upload if local file
      if (primaryImg?.file) {
        const uploaded = await uploadAsset(primaryImg.file, { folder: 'products' });
        primaryUrl = uploaded.url;
      }

      const payload = {
        ...formData,
        originalPrice: Number(formData.originalPrice),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        weightKg: Number(formData.weightKg),
        status: targetStatus || formData.status,
        imageUrl: primaryUrl,
        variants,
      };

      if (editProductId && store?.id) {
        await updateSellerProduct(store.id, editProductId, payload);
        showToast({
          title: 'Product Updated',
          description: `Changes to "${payload.title}" have been saved.`,
          tone: 'success',
        });
      } else if (store?.id) {
        await createSellerProduct(store.id, payload);
        showToast({
          title: targetStatus === 'DRAFT' ? 'Draft Saved' : 'Product Published',
          description: `"${payload.title}" is now available in your store catalog.`,
          tone: 'success',
        });
      }

      navigate('/seller/products');
    } catch (err) {
      showToast({
        title: 'Save Failed',
        description: err.message,
        tone: 'critical',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#465BE5]" />
      </div>
    );
  }

  const selectedCategoryObj = MARKETPLACE_CATEGORIES.find(
    (c) => c.slug === formData.category
  );
  const subcategories = selectedCategoryObj?.subcategories || [
    'General Optics',
    'Accessories',
    'Audio Gear',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-2 text-[#697586] hover:text-[#17202F]"
          >
            <Link to="/seller/products">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Products</span>
            </Link>
          </Button>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-[#17202F]">
            {editProductId ? 'Edit Product Listing' : 'Create New Product Listing'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/seller/products')}
            className="text-xs h-9 px-3"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit('DRAFT')}
            className="text-xs h-9 px-3 text-[#172554]"
          >
            Save Draft
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit('ACTIVE')}
            className="text-xs h-9 px-4 bg-[#172554] text-white hover:bg-[#1E3A8A] font-semibold gap-1.5 shadow-xs"
          >
            {submitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>Publish Product</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main 2 Columns: Information, Pricing, Inventory, Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-[#17202F]">1. Basic Information</h2>
              <p className="text-xs text-[#697586] mt-0.5">
                Core product identity displayed on international marketplace cards.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fujifilm X-T5 Mirrorless Digital Camera Kit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Brand / Maker
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs font-mono text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Subcategory
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Description & Craftsmanship Details
              </label>
              <textarea
                rows={4}
                placeholder="Describe material authenticity, precision specifications, and packaging..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Product Images */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#17202F]">2. Product Imagery</h2>
                <p className="text-xs text-[#697586] mt-0.5">
                  Upload multiple product photos from your local device. The primary image is marked with a star.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs gap-1.5"
              >
                <Upload className="h-3.5 w-3.5 text-[#697586]" />
                <span>Upload Photos</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Image Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden aspect-square flex flex-col justify-between shadow-xs"
                >
                  <img
                    src={img.url}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />

                  {/* Primary Badge */}
                  {img.isPrimary && (
                    <div className="absolute top-2 left-2 rounded-full bg-[#172554] text-white px-2 py-0.5 text-[9.5px] font-bold flex items-center gap-1 shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-current text-amber-400" />
                      <span>Primary</span>
                    </div>
                  )}

                  {/* Hover Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(img.id)}
                        className="text-[10px] text-white hover:text-amber-300 font-semibold flex items-center gap-1"
                        title="Set as Primary Image"
                      >
                        <Star className="h-3 w-3" />
                        <span>Primary</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1)}
                          className="p-1 text-white hover:text-gray-200"
                          title="Move left"
                        >
                          <MoveLeft className="h-3 w-3" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1)}
                          className="p-1 text-white hover:text-gray-200"
                          title="Move right"
                        >
                          <MoveRight className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="p-1 text-rose-300 hover:text-rose-100"
                        title="Delete image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] hover:bg-gray-100/70 transition-colors aspect-square flex flex-col items-center justify-center text-center p-3 text-[#697586]"
              >
                <Plus className="h-6 w-6 text-[#9CA3AF] mb-1" />
                <span className="text-xs font-semibold">Add Image</span>
                <span className="text-[10px] text-[#9CA3AF] mt-0.5">JPG, PNG, WebP</span>
              </button>
            </div>
          </div>

          {/* Section 3: Pricing & Currency */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-[#17202F]">3. Pricing & International Taxes</h2>
              <p className="text-xs text-[#697586] mt-0.5">
                Priced in your store base currency ({formData.currency}). Buyer prices convert dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Original Selling Price ({formData.currency}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#697586]">
                    {formData.currency === 'JPY' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-7 pr-3 text-xs font-semibold text-[#17202F] focus:border-[#465BE5] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Promotional Discount Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#697586]">
                    {formData.currency === 'JPY' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="None"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-7 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Export Tax Treatment
                </label>
                <select
                  value={formData.taxConfiguration}
                  onChange={(e) => setFormData({ ...formData, taxConfiguration: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  <option value="EXPORT_EXEMPT">0% Cross-Border Export Exempt</option>
                  <option value="INCLUSIVE_VAT">Origin VAT/JCT Included (10%)</option>
                  <option value="DDU">DDU (Duties Unpaid at Checkout)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Inventory & Variants */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#17202F]">4. Inventory & Variants</h2>
                <p className="text-xs text-[#697586] mt-0.5">
                  Track warehouse inventory and multi-sku product variants.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Variant</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Available Quantity in Hub Warehouse
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs font-semibold text-[#17202F] focus:border-[#465BE5] focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                  Low-Stock Restock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-[#17202F] mb-2">Variant SKUs</p>
                <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#697586] text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Variant Name</th>
                        <th className="px-3 py-2">Color</th>
                        <th className="px-3 py-2">Size / Spec</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                        <th className="px-2 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {variants.map((v) => (
                        <tr key={v.id}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="e.g. Silver"
                              value={v.color}
                              onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="e.g. 50mm"
                              value={v.size}
                              onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => updateVariant(v.id, 'stock', Number(e.target.value))}
                              className="w-16 text-right rounded border border-gray-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            {variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(v.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Shipping & Visibility Sidebar */}
        <div className="space-y-6">
          {/* Section 5: Visibility & Status */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202F]">
              Listing Visibility
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Catalog Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs font-semibold text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              >
                <option value="ACTIVE">Active (Published globally)</option>
                <option value="DRAFT">Draft (Hidden from buyers)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="ARCHIVED">Archived (Delisted)</option>
              </select>
            </div>

            <div className="rounded-lg bg-blue-50/60 p-3 text-[11px] text-[#172554] space-y-1">
              <p className="font-semibold">Compliance Note:</p>
              <p className="text-[#475569] leading-relaxed">
                Active listings are inspected for trade sanctions and hazardous air transport compliance automatically.
              </p>
            </div>
          </div>

          {/* Section 6: International Shipping */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202F]">
              International Shipping
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1">
                Dispatch Hub Origin
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.originCountry === 'DE' ? 'Germany (DE)' : 'Japan (JP)'}
                className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 py-1.5 px-3 text-xs text-[#697586] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1">
                Package Weight (Kg)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1">
                Estimated Processing SLA
              </label>
              <input
                type="text"
                value={formData.processingTime}
                onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1">
                Air Freight Declarations
              </label>
              <textarea
                rows={2}
                value={formData.shippingRestrictions}
                onChange={(e) => setFormData({ ...formData, shippingRestrictions: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

