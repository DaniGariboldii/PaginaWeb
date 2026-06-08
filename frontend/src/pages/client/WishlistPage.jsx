import { useState, useEffect } from 'react';
import { wishlistService } from '../../services/reviews.service';
import { useWishlist } from '../../context/WishlistContext';
import { ProductCard } from '../../components/products/ProductCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';

export const WishlistPage = () => {
  const { ids } = useWishlist(); // para re-render al togglear
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await wishlistService.list();
      setProducts(data.data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Mantener sincronizado: si se quitó un favorito desde una card, refrescamos al cambiar ids
  useEffect(() => {
    setProducts((prev) => prev.filter((p) => ids.includes(p.id)));
  }, [ids]);

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Seo title="Mis favoritos" />
      <h1 className="text-3xl font-bold text-ink-900 mb-8">Mis favoritos</h1>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-ink-200 rounded-2xl">
          <svg className="w-14 h-14 mx-auto text-ink-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-ink-700 font-medium mb-1">No tenés favoritos</p>
          <p className="text-sm text-ink-500 mb-6">Guardá productos para verlos más tarde.</p>
          <Button as="link" to="/productos">Explorar productos</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};
