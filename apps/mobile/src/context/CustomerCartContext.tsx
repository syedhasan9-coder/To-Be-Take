import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CustomerCartSummary, CustomerWishlistItem, CustomerNotificationItem } from '@tobetake/shared-types';
import {
  getCustomerCart,
  addCustomerCartItem,
  updateCustomerCartQuantity,
  removeCustomerCartItem,
  clearCustomerCart,
  getCustomerWishlist,
  toggleCustomerWishlist,
  getCustomerNotifications,
} from '../services/api';
import { useAuth } from './AuthContext';

interface CustomerCartContextType {
  cart: CustomerCartSummary | null;
  cartCount: number;
  wishlist: CustomerWishlistItem[];
  wishlistCount: number;
  unreadNotificationsCount: number;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
}

const CustomerCartContext = createContext<CustomerCartContextType | undefined>(undefined);

export function CustomerCartProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CustomerCartSummary | null>(null);
  const [wishlist, setWishlist] = useState<CustomerWishlistItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      const data = await getCustomerCart();
      setCart(data);
    } catch {
      // Unauthenticated or network error
    }
  }, [isAuthenticated]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      const items = await getCustomerWishlist();
      setWishlist(items);
    } catch {
      // Unauthenticated or network error
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const res = await getCustomerNotifications();
      setUnreadNotificationsCount(res.unreadCount || 0);
    } catch {
      // Unauthenticated or network error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshWishlist();
      refreshNotifications();
    } else {
      setCart(null);
      setWishlist([]);
      setUnreadNotificationsCount(0);
    }
  }, [isAuthenticated, refreshCart, refreshWishlist, refreshNotifications]);

  const addToCart = async (productId: string, quantity = 1): Promise<boolean> => {
    if (!isAuthenticated) return false;
    try {
      const updated = await addCustomerCartItem(productId, quantity);
      setCart(updated);
      return true;
    } catch (err) {
      console.error('Add to cart failed:', err);
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      const updated = await updateCustomerCartQuantity(itemId, quantity);
      setCart(updated);
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const removeFromCart = async (itemId: string): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      const updated = await removeCustomerCartItem(itemId);
      setCart(updated);
    } catch (err) {
      console.error('Remove from cart failed:', err);
    }
  };

  const clearCart = async (): Promise<void> => {
    if (!isAuthenticated) return;
    try {
      const updated = await clearCustomerCart();
      setCart(updated);
    } catch (err) {
      console.error('Clear cart failed:', err);
    }
  };

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;
    try {
      const res = await toggleCustomerWishlist(productId);
      setWishlist(res.items);
      return res.wishlisted;
    } catch (err) {
      console.error('Toggle wishlist failed:', err);
      return false;
    }
  };

  const isWishlisted = (productId: string): boolean => {
    return wishlist.some((item) => item.productId === productId);
  };

  const cartCount = cart?.totalItems || 0;
  const wishlistCount = wishlist.length;

  return (
    <CustomerCartContext.Provider
      value={{
        cart,
        cartCount,
        wishlist,
        wishlistCount,
        unreadNotificationsCount,
        refreshCart,
        refreshWishlist,
        refreshNotifications,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </CustomerCartContext.Provider>
  );
}

export function useCustomerCart(): CustomerCartContextType {
  const context = useContext(CustomerCartContext);
  if (!context) {
    throw new Error('useCustomerCart must be used within a CustomerCartProvider');
  }
  return context;
}
