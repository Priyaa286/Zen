import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const CHECKOUT_STORAGE_KEY = 'zen_checkout_state_v1';
const CART_STORAGE_KEY = 'zen_cart_items_v1';

function buildCartKey(productId, selectedVariant = null) {
  if (!selectedVariant || typeof selectedVariant !== 'object') return productId;
  const serialized = Object.entries(selectedVariant)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return serialized ? `${productId}::${serialized}` : productId;
}

function loadSavedCartItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSavedCheckout() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const saved = loadSavedCheckout();

  const [cartItems, setCartItems] = useState(loadSavedCartItems);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProductState] = useState(saved.selectedProduct || null);
  const [quantity, setQuantityState] = useState(saved.quantity || 1);
  const [comparisonItems, setComparisonItems] = useState(saved.comparisonItems || []);
  const [shippingAddress, setShippingAddress] = useState(
    saved.shippingAddress || {
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: 'IN',
    }
  );
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(
    saved.selectedShippingOptionId || null
  );
  const [checkoutSummary, setCheckoutSummaryState] = useState(null);
  const [purchaseApproved, setPurchaseApproved] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [activeOrder, setActiveOrderState] = useState(saved.activeOrder || null);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          selectedProduct,
          quantity,
          comparisonItems,
          shippingAddress,
          selectedShippingOptionId,
          activeOrder,
        })
      );
    } catch {
      // Ignore sessionStorage restrictions
    }
  }, [
    selectedProduct,
    quantity,
    comparisonItems,
    shippingAddress,
    selectedShippingOptionId,
    activeOrder,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore localStorage restrictions
    }
  }, [cartItems]);

  const addToCart = useCallback((product, qty = 1, selectedVariant = null, openDrawer = true) => {
    if (!product?.id) return;
    const normalizedQty = Math.max(1, Math.min(10, Number(qty) || 1));
    const cartKey = buildCartKey(product.id, selectedVariant);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                product,
                quantity: Math.min(10, (Number(item.quantity) || 1) + normalizedQty),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          cartKey,
          product,
          quantity: normalizedQty,
          selectedVariant: selectedVariant || null,
          addedAt: new Date().toISOString(),
        },
      ];
    });

    if (openDrawer) {
      setCartDrawerOpen(true);
    }
  }, []);

  const removeFromCart = useCallback((cartKeyOrProductId) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          item.cartKey !== cartKeyOrProductId && item.product?.id !== cartKeyOrProductId
      )
    );
  }, []);

  const updateCartItemQuantity = useCallback((cartKeyOrProductId, nextQty) => {
    const num = Number(nextQty);
    if (!Number.isFinite(num) || num <= 0) {
      setCartItems((prev) =>
        prev.filter(
          (item) =>
            item.cartKey !== cartKeyOrProductId && item.product?.id !== cartKeyOrProductId
        )
      );
      return;
    }
    const clamped = Math.max(1, Math.min(10, Math.round(num)));
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKeyOrProductId || item.product?.id === cartKeyOrProductId
          ? { ...item, quantity: clamped }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    [cartItems]
  );

  const selectProductForCheckout = useCallback((product, qty = 1) => {
    setSelectedProductState(product);
    setQuantityState(Math.max(1, Number(qty) || 1));
    setSelectedShippingOptionId(null);
    setCheckoutSummaryState(null);
    setPurchaseApproved(false);
    setPaymentStatus('idle');
  }, []);

  const updateQuantity = useCallback((nextQty) => {
    const clamped = Math.max(1, Math.min(10, Number(nextQty) || 1));
    setQuantityState(clamped);
    setPurchaseApproved(false);
  }, []);

  const setCheckoutSummary = useCallback((summary) => {
    setCheckoutSummaryState(summary);
    // Security rule: require fresh explicit approval whenever displayed total changes
    setPurchaseApproved(false);
  }, []);

  const toggleCompareProduct = useCallback(
    (product) => {
      if (!product?.id) return { added: false, limitReached: false };
      const exists = comparisonItems.some((item) => item.id === product.id);
      if (exists) {
        setComparisonItems((prev) => prev.filter((item) => item.id !== product.id));
        return { added: false, limitReached: false };
      }
      if (comparisonItems.length >= 4) {
        return { added: false, limitReached: true };
      }
      setComparisonItems((prev) =>
        prev.some((item) => item.id === product.id) || prev.length >= 4
          ? prev
          : [...prev, product]
      );
      return { added: true, limitReached: false };
    },
    [comparisonItems]
  );

  const removeFromCompare = useCallback((productId) => {
    setComparisonItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonItems([]);
  }, []);

  const setActiveOrder = useCallback((order) => {
    setActiveOrderState(order);
  }, []);

  const resetCheckoutState = useCallback((clearSelectedProduct = false) => {
    if (clearSelectedProduct) {
      setSelectedProductState(null);
      setQuantityState(1);
      setSelectedShippingOptionId(null);
    }
    setCheckoutSummaryState(null);
    setPurchaseApproved(false);
    setPaymentStatus('idle');
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartDrawerOpen,
      setCartDrawerOpen,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      selectedProduct,
      quantity,
      comparisonItems,
      shippingAddress,
      selectedShippingOptionId,
      checkoutSummary,
      purchaseApproved,
      paymentStatus,
      activeOrder,
      selectProductForCheckout,
      updateQuantity,
      setShippingAddress,
      setSelectedShippingOptionId,
      setCheckoutSummary,
      setPurchaseApproved,
      setPaymentStatus,
      setActiveOrder,
      toggleCompareProduct,
      removeFromCompare,
      clearCompare,
      resetCheckoutState,
    }),
    [
      cartItems,
      cartCount,
      cartDrawerOpen,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      selectedProduct,
      quantity,
      comparisonItems,
      shippingAddress,
      selectedShippingOptionId,
      checkoutSummary,
      purchaseApproved,
      paymentStatus,
      activeOrder,
      selectProductForCheckout,
      updateQuantity,
      setCheckoutSummary,
      setActiveOrder,
      toggleCompareProduct,
      removeFromCompare,
      clearCompare,
      resetCheckoutState,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used inside CartProvider');
  }
  return ctx;
}
