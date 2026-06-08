import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/reviews.service';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState([]); // ids de productos en favoritos

  const refresh = useCallback(async () => {
    if (!user) { setIds([]); return; }
    try {
      const { data } = await wishlistService.ids();
      setIds(data.data.ids);
    } catch {
      setIds([]);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isWishlisted = useCallback((productId) => ids.includes(productId), [ids]);

  const toggle = async (productId) => {
    if (ids.includes(productId)) {
      setIds((prev) => prev.filter((id) => id !== productId)); // optimista
      try { await wishlistService.remove(productId); } catch { refresh(); }
    } else {
      setIds((prev) => [...prev, productId]);
      try { await wishlistService.add(productId); } catch { refresh(); }
    }
  };

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, isWishlisted, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist debe usarse dentro de WishlistProvider');
  return ctx;
};
