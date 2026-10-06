'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CustomerCartSummary,
  CustomerCartItem,
  CustomerWishlistItem,
  CustomerNotificationItem,
} from '@tobetake/shared-types';
import {
  customerApi,
  getCustomerAuthToken,
  setCustomerAuthToken,
  removeCustomerAuthToken,
  getCustomerStoredUser,
  setCustomerStoredUser,
} from '../../lib/customer-api';

export interface CustomerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode?: string;
  phone?: string;
}

const GUEST_CART_KEY = 'tobetake_guest_cart';

function createEmptyCartSummary(): CustomerCartSummary {
  return {
    items: [],
    totalItems: 0,
    subtotal: 0,
    shippingFee: 0,
    discount: 0,
    grandTotal: 0,
    currency: 'PKR',
  };
}

function computeCartTotals(items: CustomerCartItem[], couponCode?: string | null): CustomerCartSummary {
  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.itemTotal) || 0), 0);
  const shippingFee = subtotal >= 3000 || subtotal === 0 ? 0 : 200;
  const discount = 0;
  const grandTotal = Math.max(0, subtotal + shippingFee - discount);

  return {
    items,
    totalItems,
    subtotal,
    shippingFee,
    discount,
    couponCode: couponCode ?? null,
    grandTotal,
    currency: 'PKR',
  };
}

function getGuestCartFromStorage(): CustomerCartSummary {
  if (typeof window === 'undefined') return createEmptyCartSummary();
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return createEmptyCartSummary();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.items)) {
      return computeCartTotals(parsed.items, parsed.couponCode);
    }
    return createEmptyCartSummary();
  } catch {
    return createEmptyCartSummary();
  }
}

function saveGuestCartToStorage(cart: CustomerCartSummary): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function clearGuestCartFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore storage errors
  }
}

interface CustomerContextType {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: CustomerUser) => Promise<void>;
  logout: () => void;
  cart: CustomerCartSummary | null;
  cartCount: number;
  addToCart: (productId: string, quantity?: number, productDetails?: Partial<CustomerCartItem>) => Promise<void>;
  buyNow: (productId: string, quantity?: number) => Promise<void>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  wishlist: CustomerWishlistItem[];
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, returnUrl?: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  notifications: CustomerNotificationItem[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [cart, setCart] = useState<CustomerCartSummary | null>(null);
  const [wishlist, setWishlist] = useState<CustomerWishlistItem[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = getCustomerAuthToken();
    const savedUser = getCustomerStoredUser();
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) setUser(savedUser);
    } else {
      // Load initial guest cart from local storage
      const initialGuestCart = getGuestCartFromStorage();
      setCart(initialGuestCart);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!token) {
      const guestCart = getGuestCartFromStorage();
      setCart(guestCart);
      return;
    }
    try {
      const summary = await customerApi.getCart();
      setCart(summary);
    } catch {
      // Unauthenticated or empty
      setCart(createEmptyCartSummary());
    }
  }, [token]);

  const refreshWishlist = useCallback(async () => {
    if (!token) {
      setWishlist([]);
      return;
    }
    try {
      const items = await customerApi.getWishlist();
      setWishlist(items);
    } catch {
      // Unauthenticated
      setWishlist([]);
    }
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const res = await customerApi.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadNotificationsCount(res.unreadCount || 0);
    } catch {
      // Unauthenticated
      setNotifications([]);
      setUnreadNotificationsCount(0);
    }
  }, [token]);

  // When token changes, refresh user data
  useEffect(() => {
    if (token) {
      refreshCart();
      refreshWishlist();
      refreshNotifications();
    }
  }, [token, refreshCart, refreshWishlist, refreshNotifications]);

  const login = async (newToken: string, newUser: CustomerUser) => {
    setCustomerAuthToken(newToken);
    setCustomerStoredUser(newUser);
    setToken(newToken);
    setUser(newUser);

    // Merge any existing guest cart into the server cart
    try {
      const guestCart = getGuestCartFromStorage();
      if (guestCart.items && guestCart.items.length > 0) {
        for (const item of guestCart.items) {
          try {
            await customerApi.addToCart(item.productId, item.quantity);
          } catch (mergeErr) {
            console.warn(`Failed to merge guest cart item ${item.productId}:`, mergeErr);
          }
        }
        clearGuestCartFromStorage();
      }
    } catch (err) {
      console.warn('Guest cart merge encountered an issue:', err);
    }

    try {
      const summary = await customerApi.getCart();
      setCart(summary);
    } catch {
      // Ignore
    }
    try {
      const items = await customerApi.getWishlist();
      setWishlist(items);
    } catch {
      // Ignore
    }
  };

  const logout = () => {
    removeCustomerAuthToken();
    setToken(null);
    setUser(null);
    const empty = createEmptyCartSummary();
    setCart(empty);
    setWishlist([]);
    setNotifications([]);
    setUnreadNotificationsCount(0);
  };

  const addToCart = async (
    productId: string,
    quantity = 1,
    productDetails?: Partial<CustomerCartItem>,
  ) => {
    if (token) {
      const updated = await customerApi.addToCart(productId, quantity);
      setCart(updated);
      return;
    }

    // GUEST CART IMPLEMENTATION (No forced login redirection)
    const currentCart = getGuestCartFromStorage();
    const existingIndex = currentCart.items.findIndex(
      (item) => item.productId === productId || item.id === productId,
    );

    let updatedItems = [...currentCart.items];

    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex];
      const newQty = existing.quantity + quantity;
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemTotal: existing.price * newQty,
      };
    } else {
      // Fetch or construct product information
      let pData = productDetails;
      if (!pData || !pData.productName || !pData.price) {
        try {
          const detail = await customerApi.getProductDetail(productId);
          pData = {
            productId: detail.id,
            productName: detail.name,
            productSlug: detail.slug || detail.id,
            sku: detail.sku || '',
            price: Number(detail.price) || 0,
            compareAtPrice: detail.compareAtPrice ? Number(detail.compareAtPrice) : null,
            image: Array.isArray(detail.images) ? detail.images[0] : (detail.images as string) || '',
            stockQuantity: detail.stockQuantity ?? 99,
            inStock: (detail.stockQuantity ?? 1) > 0,
            sellerName: detail.sellerName || detail.storeName || 'Verified Merchant',
            storeName: detail.storeName || detail.sellerName || 'Verified Merchant',
          };
        } catch {
          pData = {
            productId,
            productName: productDetails?.productName || 'Artisanal Product',
            productSlug: productDetails?.productSlug || productId,
            sku: productDetails?.sku || '',
            price: productDetails?.price || 0,
            compareAtPrice: productDetails?.compareAtPrice,
            image: productDetails?.image || '',
            stockQuantity: 99,
            inStock: true,
            sellerName: 'Verified Merchant',
            storeName: 'Verified Merchant',
          };
        }
      }

      const newItem: CustomerCartItem = {
        id: `guest-item-${productId}-${Date.now()}`,
        productId: pData.productId || productId,
        productName: pData.productName || 'Artisanal Product',
        productSlug: pData.productSlug || productId,
        sku: pData.sku || '',
        price: Number(pData.price) || 0,
        compareAtPrice: pData.compareAtPrice ? Number(pData.compareAtPrice) : null,
        image: pData.image || '',
        quantity: Math.max(1, quantity),
        stockQuantity: pData.stockQuantity ?? 99,
        inStock: pData.inStock ?? true,
        itemTotal: (Number(pData.price) || 0) * Math.max(1, quantity),
        sellerName: pData.sellerName || 'Verified Merchant',
        storeName: pData.storeName || 'Verified Merchant',
      };

      updatedItems.push(newItem);
    }

    const updatedSummary = computeCartTotals(updatedItems, currentCart.couponCode);
    saveGuestCartToStorage(updatedSummary);
    setCart(updatedSummary);
  };

  const buyNow = async (productId: string, quantity = 1) => {
    if (!token) {
      await addToCart(productId, quantity);
      const redirectUrl = `/login/user?intent=checkout&redirect=${encodeURIComponent('/checkout')}`;
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
      return;
    }
    const updated = await customerApi.addToCart(productId, quantity);
    setCart(updated);
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout';
    }
  };

  const updateCartQuantity = async (itemId: string, quantity: number) => {
    if (token) {
      const updated = await customerApi.updateCartQuantity(itemId, quantity);
      setCart(updated);
      return;
    }

    // Guest update
    const currentCart = getGuestCartFromStorage();
    let updatedItems: CustomerCartItem[];

    if (quantity <= 0) {
      updatedItems = currentCart.items.filter(
        (item) => item.id !== itemId && item.productId !== itemId,
      );
    } else {
      updatedItems = currentCart.items.map((item) => {
        if (item.id === itemId || item.productId === itemId) {
          return {
            ...item,
            quantity,
            itemTotal: item.price * quantity,
          };
        }
        return item;
      });
    }

    const updatedSummary = computeCartTotals(updatedItems, currentCart.couponCode);
    saveGuestCartToStorage(updatedSummary);
    setCart(updatedSummary);
  };

  const removeFromCart = async (itemId: string) => {
    if (token) {
      const updated = await customerApi.removeFromCart(itemId);
      setCart(updated);
      return;
    }

    // Guest remove
    const currentCart = getGuestCartFromStorage();
    const updatedItems = currentCart.items.filter(
      (item) => item.id !== itemId && item.productId !== itemId,
    );
    const updatedSummary = computeCartTotals(updatedItems, currentCart.couponCode);
    saveGuestCartToStorage(updatedSummary);
    setCart(updatedSummary);
  };

  const clearCart = async () => {
    if (token) {
      await customerApi.clearCart();
    }
    clearGuestCartFromStorage();
    setCart(createEmptyCartSummary());
  };

  const isWishlisted = (productId: string) => {
    return wishlist.some((w) => w.productId === productId);
  };

  const toggleWishlist = async (productId: string, returnUrl?: string) => {
    if (!token) {
      const currentPath =
        typeof window !== 'undefined'
          ? returnUrl || window.location.pathname + window.location.search
          : '/';
      const redirectUrl = `/login/user?intent=wishlist&productId=${encodeURIComponent(
        productId,
      )}&redirect=${encodeURIComponent(currentPath)}`;
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
      return false;
    }
    const res = await customerApi.toggleWishlist(productId);
    setWishlist(res.items);
    return res.wishlisted;
  };

  const removeFromWishlist = async (productId: string) => {
    if (!token) return;
    const res = await customerApi.toggleWishlist(productId);
    setWishlist(res.items);
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;
    await customerApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
  };

  const markAllNotificationsRead = async () => {
    if (!token) return;
    await customerApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);
  };

  const cartCount = cart?.totalItems || 0;
  const wishlistCount = wishlist.length;

  return (
    <CustomerContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        cart,
        cartCount,
        addToCart,
        buyNow,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        wishlist,
        wishlistCount,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        notifications,
        unreadNotificationsCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerContextType {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
