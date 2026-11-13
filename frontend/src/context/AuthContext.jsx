import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  loginWithEmail,
  logoutUser,
  registerUser,
  requestPasswordReset,
} from '@/services/authService';
import {
  getSavedProducts,
  getUserOrders,
  recordUserSearchHistory,
  removeSavedProductFromAccount,
  saveDeliveryAddress,
  saveProductToAccount,
  updateUserPreferences,
  updateUserProfile,
} from '@/services/userService';
import { BACKEND_CAPABILITIES } from '@/services/api';
import { mockSwitchUser } from '@/mocks/mockAuth';
import { useCurrencyContext } from './CurrencyContext';
import { useAppContext } from './AppContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { useMockApi } = useAppContext();
  const {
    deliveryCountry,
    preferredCurrency,
    applyUserCurrencyPreferences,
  } = useCurrencyContext();

  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'guest'
  const [savedProducts, setSavedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [authError, setAuthError] = useState(null);

  const hydrateUserAccountData = useCallback(
    async (authUser) => {
      if (!authUser) {
        setSavedProducts([]);
        setOrders([]);
        return;
      }
      const dest = authUser.defaultDeliveryCountry || deliveryCountry;
      const curr = authUser.preferredCurrency || preferredCurrency;
      try {
        const [savedList, orderList] = await Promise.all([
          getSavedProducts({ destinationCountry: dest, preferredCurrency: curr }).catch(() => []),
          getUserOrders().catch(() => []),
        ]);
        setSavedProducts(savedList);
        setOrders(orderList);
      } catch {
        // Non-blocking secondary hydration
      }
    },
    [deliveryCountry, preferredCurrency]
  );

  // Restore active session cleanly when app boots or Mock/Live mode switches
  useEffect(() => {
    let active = true;
    setStatus('loading');
    setAuthError(null);

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        if (currentUser) {
          setUser(currentUser);
          setStatus('authenticated');
          applyUserCurrencyPreferences({
            residenceCountry: currentUser.residenceCountry,
            defaultDeliveryCountry: currentUser.defaultDeliveryCountry,
            preferredCurrency: currentUser.preferredCurrency,
            ...currentUser.preferences,
          });
          hydrateUserAccountData(currentUser);
        } else {
          setUser(null);
          setSavedProducts([]);
          setOrders([]);
          setStatus('guest');
        }
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setSavedProducts([]);
        setOrders([]);
        setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, [useMockApi]); // Re-evaluate session strictly when environment switches

  const login = useCallback(
    async ({ email, password, rememberMe = true }) => {
      setAuthError(null);
      try {
        const loggedUser = await loginWithEmail({ email, password, rememberMe });
        setUser(loggedUser);
        setStatus('authenticated');
        applyUserCurrencyPreferences({
          residenceCountry: loggedUser.residenceCountry,
          defaultDeliveryCountry: loggedUser.defaultDeliveryCountry,
          preferredCurrency: loggedUser.preferredCurrency,
          ...loggedUser.preferences,
        });
        await hydrateUserAccountData(loggedUser);
        return loggedUser;
      } catch (err) {
        setAuthError(err?.message || 'Sign in failed.');
        throw err;
      }
    },
    [applyUserCurrencyPreferences, hydrateUserAccountData]
  );

  const register = useCallback(
    async (payload) => {
      setAuthError(null);
      try {
        const createdUser = await registerUser(payload);
        setUser(createdUser);
        setStatus('authenticated');
        applyUserCurrencyPreferences({
          residenceCountry: createdUser.residenceCountry,
          defaultDeliveryCountry: createdUser.defaultDeliveryCountry,
          preferredCurrency: createdUser.preferredCurrency,
          ...createdUser.preferences,
        });
        setSavedProducts([]);
        setOrders([]);
        return createdUser;
      } catch (err) {
        setAuthError(err?.message || 'Registration failed.');
        throw err;
      }
    },
    [applyUserCurrencyPreferences]
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setSavedProducts([]);
      setOrders([]);
      setAuthError(null);
      setStatus('guest');
    }
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      const updated = await updateUserProfile(updates);
      setUser(updated);
      if (updates.residenceCountry) {
        applyUserCurrencyPreferences({ residenceCountry: updated.residenceCountry });
      }
      return updated;
    },
    [applyUserCurrencyPreferences]
  );

  const updatePreferences = useCallback(
    async (prefs) => {
      const updated = await updateUserPreferences(prefs);
      setUser(updated);
      applyUserCurrencyPreferences({
        residenceCountry: updated.residenceCountry,
        defaultDeliveryCountry: updated.defaultDeliveryCountry,
        preferredCurrency: updated.preferredCurrency,
        ...updated.preferences,
      });
      // Re-localize saved product list when delivery country or currency changes
      hydrateUserAccountData(updated);
      return updated;
    },
    [applyUserCurrencyPreferences, hydrateUserAccountData]
  );

  const completeOnboarding = useCallback(
    async ({ residenceCountry, preferredCurrency: nextCurr, defaultDeliveryCountry }) => {
      return updatePreferences({
        residenceCountry,
        preferredCurrency: nextCurr,
        defaultDeliveryCountry,
        onboardingCompleted: true,
      });
    },
    [updatePreferences]
  );

  const toggleSaveProduct = useCallback(
    async (product) => {
      if (!user || !product?.id) {
        return { requiresAuth: !user, saved: false };
      }
      const alreadySaved = savedProducts.some((p) => p.id === product.id);
      if (alreadySaved) {
        await removeSavedProductFromAccount(product.id);
        setSavedProducts((prev) => prev.filter((p) => p.id !== product.id));
        return { requiresAuth: false, saved: false };
      }
      await saveProductToAccount(product);
      setSavedProducts((prev) => [product, ...prev.filter((p) => p.id !== product.id)]);
      return { requiresAuth: false, saved: true };
    },
    [user, savedProducts]
  );

  const removeSavedProduct = useCallback(
    async (productId) => {
      if (!user) return;
      await removeSavedProductFromAccount(productId);
      setSavedProducts((prev) => prev.filter((p) => p.id !== productId));
    },
    [user]
  );

  const isProductSaved = useCallback(
    (productId) => Boolean(user && productId && savedProducts.some((p) => p.id === productId)),
    [user, savedProducts]
  );

  const addSavedAddress = useCallback(
    async (address) => {
      if (!user) return [];
      const next = await saveDeliveryAddress(address);
      setUser((prev) => (prev ? { ...prev, savedAddresses: next } : prev));
      return next;
    },
    [user]
  );

  const recordSearch = useCallback(
    async ({ query, destinationCountry, preferredCurrency: curr }) => {
      if (!user || !query) return;
      const history = await recordUserSearchHistory({
        query,
        destinationCountry,
        preferredCurrency: curr,
      });
      setUser((prev) => (prev ? { ...prev, searchHistory: history } : prev));
    },
    [user]
  );

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return [];
    }
    const list = await getUserOrders();
    setOrders(list);
    return list;
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const refreshed = await getCurrentUser();
      setUser(refreshed);
      return refreshed;
    } catch {
      return null;
    }
  }, []);

  const switchPersona = useCallback(
    async (email) => {
      try {
        const targetUser = await mockSwitchUser(email);
        setUser(targetUser);
        setStatus('authenticated');
        applyUserCurrencyPreferences({
          residenceCountry: targetUser.residenceCountry,
          defaultDeliveryCountry: targetUser.defaultDeliveryCountry,
          preferredCurrency: targetUser.preferredCurrency,
          ...targetUser.preferences,
        });
        await hydrateUserAccountData(targetUser);
        return targetUser;
      } catch (err) {
        setAuthError(err?.message || 'Persona switch failed');
        throw err;
      }
    },
    [applyUserCurrencyPreferences, hydrateUserAccountData]
  );

  const role = user?.role || 'BUYER';
  const isSeller = role === 'SELLER';
  const isAdmin = role === 'ADMIN';
  const isBuyer = role === 'BUYER';
  const sellerStatus = user?.verificationStatus || null;

  const value = useMemo(
    () => ({
      user,
      status,
      role,
      isBuyer,
      isSeller,
      isAdmin,
      sellerStatus,
      storeId: user?.storeId || null,
      storeName: user?.storeName || null,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && Boolean(user),
      isGuest: status !== 'authenticated' || !user,
      needsOnboarding: Boolean(user && user.onboardingCompleted === false),
      savedProducts,
      orders,
      authError,
      backendAuthSupported: useMockApi || BACKEND_CAPABILITIES.authImplemented,
      googleOAuthConfigured: Boolean(BACKEND_CAPABILITIES.googleOAuthClientId),
      login,
      register,
      logout,
      requestPasswordReset,
      updateProfile,
      updatePreferences,
      completeOnboarding,
      toggleSaveProduct,
      removeSavedProduct,
      isProductSaved,
      addSavedAddress,
      recordSearch,
      refreshOrders,
      refreshUser,
      switchPersona,
      setAuthError,
    }),
    [
      user,
      status,
      role,
      isBuyer,
      isSeller,
      isAdmin,
      sellerStatus,
      savedProducts,
      orders,
      authError,
      useMockApi,
      login,
      register,
      logout,
      updateProfile,
      updatePreferences,
      completeOnboarding,
      toggleSaveProduct,
      removeSavedProduct,
      isProductSaved,
      addSavedAddress,
      recordSearch,
      refreshOrders,
      refreshUser,
      switchPersona,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

