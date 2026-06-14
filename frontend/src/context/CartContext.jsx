import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cart.service';
import { productsService } from '../services/products.service';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const emptyCart = { items: [], total: 0, itemCount: 0 };

// ─── Carrito local del invitado (sin sesión) ──────────────────────────────────
// Se guarda como [{ productId, quantity }] y se "hidrata" trayendo los productos
// reales del backend, para reflejar precio/stock actuales con la misma forma que
// el carrito del servidor (así CartPage y Checkout funcionan sin cambios).
const LOCAL_KEY = 'guest_cart';
const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
};
const writeLocal = (arr) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)); } catch { /* ignora */ }
};

const effectivePrice = (p) =>
  p.discountPrice && Number(p.discountPrice) < Number(p.price) ? Number(p.discountPrice) : Number(p.price);

const buildLocalCart = async () => {
  const entries = readLocal();
  if (entries.length === 0) return { ...emptyCart, isGuest: true };

  const results = await Promise.all(
    entries.map((e) =>
      productsService.getById(e.productId)
        .then((r) => ({ product: r.data.data.product, quantity: e.quantity }))
        .catch(() => null) // producto inexistente/inactivo → se descarta
    )
  );

  const items = results.filter(Boolean).map(({ product, quantity }) => {
    const unitPrice = effectivePrice(product);
    const image = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url ?? null;
    return {
      id: product.id, // en el carrito local el id es el del producto
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image,
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity,
      stock: product.stock,
      available: product.active && product.stock >= quantity,
    };
  });

  const total = items.reduce((a, i) => a + (i.available ? i.subtotal : 0), 0);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);
  return { items, total, itemCount, isGuest: true };
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { data } = await cartService.get();
        setCart(data.data.cart);
      } else {
        setCart(await buildLocalCart());
      }
    } catch {
      setCart(user ? emptyCart : { ...emptyCart, isGuest: true });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Al iniciar sesión, fusiona el carrito local del invitado con la cuenta y lo limpia
  useEffect(() => {
    let active = true;
    (async () => {
      if (user) {
        const local = readLocal();
        if (local.length > 0) {
          for (const e of local) {
            try { await cartService.addItem(e.productId, e.quantity); } catch { /* ignora item inválido */ }
          }
          writeLocal([]);
        }
      }
      if (active) await refresh();
    })();
    return () => { active = false; };
  }, [user, refresh]);

  const addItem = async (productId, quantity = 1) => {
    if (user) {
      const { data } = await cartService.addItem(productId, quantity);
      setCart(data.data.cart);
      return data.data.cart;
    }
    // Invitado: acumular en localStorage y rehidratar
    const entries = readLocal();
    const existing = entries.find((e) => e.productId === productId);
    if (existing) existing.quantity += quantity;
    else entries.push({ productId, quantity });
    writeLocal(entries);
    const next = await buildLocalCart();
    setCart(next);
    return next;
  };

  const updateItem = async (itemId, quantity) => {
    if (user) {
      const { data } = await cartService.updateItem(itemId, quantity);
      setCart(data.data.cart);
      return;
    }
    const entries = readLocal().map((e) => (e.productId === itemId ? { ...e, quantity } : e));
    writeLocal(entries);
    setCart(await buildLocalCart());
  };

  const removeItem = async (itemId) => {
    if (user) {
      const { data } = await cartService.removeItem(itemId);
      setCart(data.data.cart);
      return;
    }
    writeLocal(readLocal().filter((e) => e.productId !== itemId));
    setCart(await buildLocalCart());
  };

  const clear = async () => {
    if (user) {
      const { data } = await cartService.clear();
      setCart(data.data.cart);
      return;
    }
    writeLocal([]);
    setCart({ ...emptyCart, isGuest: true });
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
