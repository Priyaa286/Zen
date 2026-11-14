import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';
import {
  getSellerStoreMe,
  getSellerProducts,
  deleteSellerProduct,
  createSellerProduct,
  updateSellerProduct,
} from '@/services/sellerService';
import { MARKETPLACE_CATEGORIES } from '@/data/categories';

export default function SellerProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const storeData = await getSellerStoreMe(user.email);
      setStore(storeData);
      if (storeData?.id) {
        const list = await getSellerProducts(storeData.id);
        setProducts(list || []);
      }
    } catch (err) {
      showToast({ title: 'Error', description: err.message, tone: 'critical' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.email]);

  const curr = store?.merchantCurrency || 'JPY';

  // Format currency
  const formatCurrency = (val) => {
    if (typeof val !== 'number') return `${curr} 0`;
    const sym = curr === 'JPY' ? '¥' : '$';
    return `${sym}${val.toLocaleString()}`;
  };

  // Filtered & Sorted List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchQuery =
          !searchQuery.trim() ||
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCategory =
          categoryFilter === 'ALL' ||
          p.category?.toLowerCase() === categoryFilter.toLowerCase();

        const matchStatus =
          statusFilter === 'ALL' || (p.status || 'ACTIVE') === statusFilter;

        return matchQuery && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.originalPrice || 0) - (b.originalPrice || 0);
        if (sortBy === 'price-desc') return (b.originalPrice || 0) - (a.originalPrice || 0);
        if (sortBy === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
        if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        // default: latest
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedList = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Checkbox helpers
  const allOnPageSelected =
    paginatedList.length > 0 &&
    paginatedList.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedList.some((p) => p.id === id))
      );
    } else {
      const pageIds = paginatedList.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single Actions
  const handleDeleteProduct = async (id, title) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await deleteSellerProduct(store.id, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast({
        title: 'Listing deleted',
        description: `"${title}" removed from store catalog.`,
        tone: 'info',
      });
    } catch (err) {
      showToast({ title: 'Delete failed', description: err.message, tone: 'critical' });
    }
  };

  const handleDuplicateProduct = async (prod) => {
    try {
      const copyPayload = {
        ...prod,
        id: undefined,
        title: `${prod.title} (Copy)`,
        sku: `${prod.sku || 'SKU'}-COPY`,
        status: 'DRAFT',
      };
      const created = await createSellerProduct(store.id, copyPayload);
      setProducts((prev) => [created, ...prev]);
      showToast({
        title: 'Product Duplicated',
        description: `Created draft copy: "${copyPayload.title}"`,
        tone: 'success',
      });
    } catch (err) {
      showToast({ title: 'Duplicate failed', description: err.message, tone: 'critical' });
    }
  };

  const handleToggleArchive = async (prod) => {
    const newStatus = prod.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    try {
      await updateSellerProduct(store.id, prod.id, { ...prod, status: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, status: newStatus } : p))
      );
      showToast({
        title: newStatus === 'ARCHIVED' ? 'Product Archived' : 'Product Unarchived',
        description: `Listing status updated to ${newStatus}.`,
        tone: 'info',
      });
    } catch (err) {
      showToast({ title: 'Update failed', description: err.message, tone: 'critical' });
    }
  };

  // Bulk Actions
  const handleBulkStatusUpdate = async (status) => {
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const prod = products.find((p) => p.id === id);
          if (prod) return updateSellerProduct(store.id, id, { ...prod, status });
          return Promise.resolve();
        })
      );
      setProducts((prev) =>
        prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status } : p))
      );
      showToast({
        title: 'Bulk Status Updated',
        description: `Updated ${selectedIds.length} listings to ${status}.`,
        tone: 'success',
      });
      setSelectedIds([]);
    } catch (err) {
      showToast({ title: 'Bulk update failed', description: err.message, tone: 'critical' });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected products? This action cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteSellerProduct(store.id, id)));
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      showToast({
        title: 'Bulk Deleted',
        description: `Deleted ${selectedIds.length} products.`,
        tone: 'info',
      });
      setSelectedIds([]);
    } catch (err) {
      showToast({ title: 'Bulk delete failed', description: err.message, tone: 'critical' });
    }
  };

  const getStatusBadge = (status = 'ACTIVE') => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DRAFT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OUT_OF_STOCK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#465BE5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Action */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
              All Products
            </h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-[#697586] tabular-nums">
              {products.length} items
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#697586]">
            Manage your cross-border product catalog, SKUs, inventory, and global pricing.
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs shrink-0"
        >
          <Link to="/seller/products/new">
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </Link>
        </Button>
      </div>

      {/* Search, Filter & Bulk Actions Bar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by title, SKU, brand..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
          >
            <option value="latest">Sort: Newest First</option>
            <option value="title-asc">Sort: Title (A-Z)</option>
            <option value="price-asc">Sort: Price (Low to High)</option>
            <option value="price-desc">Sort: Price (High to Low)</option>
            <option value="stock-asc">Sort: Stock (Low to High)</option>
          </select>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5 text-xs text-[#172554]">
            <div className="flex items-center gap-2">
              <span className="font-bold">{selectedIds.length}</span>
              <span>item(s) selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#465BE5] hover:underline ml-2"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                className="h-7 text-xs bg-white"
              >
                Set Active
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('DRAFT')}
                className="h-7 text-xs bg-white"
              >
                Set Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('ARCHIVED')}
                className="h-7 text-xs bg-white"
              >
                Archive
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#697586] bg-[#F8FAFC]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#465BE5] focus:ring-[#465BE5]"
                    aria-label="Select all on page"
                  />
                </th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3">Inventory</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#697586]">
                    <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-[#17202F]">No products found</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Try resetting your search query or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  const status = prod.status || 'ACTIVE';

                  return (
                    <tr
                      key={prod.id}
                      className={cn(
                        'hover:bg-[#F9FAFB] transition-colors',
                        isSelected && 'bg-blue-50/30'
                      )}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(prod.id)}
                          className="rounded border-gray-300 text-[#465BE5] focus:ring-[#465BE5]"
                          aria-label={`Select ${prod.title}`}
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-[200px] max-w-sm">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[#17202F]">
                              {prod.title}
                            </p>
                            <p className="truncate text-[11px] text-[#697586]">
                              {prod.brand || store?.storeName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#697586] whitespace-nowrap">
                        {prod.sku || `SKU-${prod.id.substring(0, 6)}`}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="rounded-md bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-[#17202F] tabular-nums whitespace-nowrap">
                        {formatCurrency(prod.originalPrice || 0)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            (prod.stock || 0) <= 5
                              ? 'text-rose-600 font-bold'
                              : 'text-[#17202F]'
                          )}
                        >
                          {prod.stock ?? 10} units
                        </span>
                        {(prod.stock || 0) <= 5 && (
                          <span className="ml-1 text-[10px] text-rose-500 font-medium">
                            (Low stock)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold',
                            getStatusBadge(status)
                          )}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#697586] hover:text-[#17202F]"
                            title="Edit Product"
                          >
                            <Link to={`/seller/products/${prod.id}/edit`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(prod)}
                            className="rounded p-1.5 text-[#697586] hover:bg-gray-100 hover:text-[#17202F]"
                            title="Duplicate as Draft"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleArchive(prod)}
                            className="rounded p-1.5 text-[#697586] hover:bg-gray-100 hover:text-[#17202F]"
                            title={prod.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.title)}
                            className="rounded p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-[#E5E7EB] px-5 py-3.5 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <span className="text-[#697586]">
            Showing{' '}
            <strong className="text-[#17202F]">
              {filteredProducts.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-[#17202F]">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </strong>{' '}
            of <strong className="text-[#17202F]">{filteredProducts.length}</strong> products
          </span>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <span className="px-2 text-[#697586]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

