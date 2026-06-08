import { useState, useEffect } from 'react';
import { reviewsService } from '../../services/reviews.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/format';

export const ProductReviews = ({ productId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await reviewsService.list(productId);
      setData(res.data.data);
    } catch {
      setData({ reviews: [], summary: { average: 0, total: 0, distribution: {} }, canReview: false });
    }
  };

  useEffect(() => { load(); }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) { toast.error('Elegí una valoración'); return; }
    setSubmitting(true);
    try {
      await reviewsService.create(productId, { rating, comment });
      toast.success('¡Gracias por tu reseña!');
      setComment('');
      setRating(0);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return null;
  const { reviews, summary, canReview } = data;

  return (
    <div className="border-t border-ink-100 mt-10 pt-8">
      <h2 className="text-xl font-bold text-ink-900 mb-6">Opiniones de clientes</h2>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Resumen */}
        <div className="md:col-span-1">
          {summary.total > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-bold text-ink-900">{summary.average}</span>
                <div>
                  <StarRating value={summary.average} />
                  <p className="text-xs text-ink-500 mt-1">{summary.total} opinión{summary.total !== 1 ? 'es' : ''}</p>
                </div>
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = summary.distribution[n] || 0;
                  const pct = summary.total ? (count / summary.total) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="w-3">{n}</span>
                      <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-500">Todavía no hay opiniones.</p>
          )}
        </div>

        {/* Lista + form */}
        <div className="md:col-span-2">
          {/* Form para clientes que compraron */}
          {user && canReview && (
            <form onSubmit={submit} className="bg-ink-50 border border-ink-200 rounded-2xl p-5 mb-6">
              <p className="text-sm font-medium text-ink-900 mb-2">Dejá tu opinión</p>
              <StarRating value={rating} onRate={setRating} size="w-7 h-7" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Contanos qué te pareció (opcional)"
                className="w-full mt-3 border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
              <div className="mt-3">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Publicar reseña'}
                </Button>
              </div>
            </form>
          )}
          {user && !canReview && summary.total >= 0 && (
            <p className="text-xs text-ink-400 mb-4">Solo podés opinar sobre productos que compraste.</p>
          )}

          {/* Lista */}
          {reviews.length === 0 ? (
            <p className="text-sm text-ink-500">Sé el primero en opinar.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-ink-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-900">{r.author}</span>
                    <span className="text-xs text-ink-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <StarRating value={r.rating} size="w-4 h-4" />
                  {r.comment && <p className="text-sm text-ink-600 mt-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
