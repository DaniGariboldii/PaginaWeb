import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cart.service';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const emptyCart = { items: [], total: 0, itemCount: 0 };

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const { data } = await cartService.get();
      setCart(data.data.cart);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar el carrito cuando cambia el usuario (login/logout)
  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async (productId, quantity = 1) => {
    const { data } = await cartService.addItem(productId, quantity);
    setCart(data.data.cart);
    return data.data.cart;
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await cartService.updateItem(itemId, quantity);
    setCart(data.data.cart);
  };

  const removeItem = async (itemId) => {
    const { data } = await cartService.removeItem(itemId);
    setCart(data.data.cart);
  };

  const clear = async () => {
    const { data } = await cartService.clear();
    setCart(data.data.cart);
  };

  return (
    <CartContext.Provider
      value={{ cart, itemCount: cart.itemCount, loading, refresh, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
