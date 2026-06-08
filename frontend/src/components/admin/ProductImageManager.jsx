import { useState, useRef } from 'react';
import { productsService } from '../../services/products.service';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Spinner } from '../ui/Spinner';

/**
 * Gestiona las imágenes de un producto existente:
 * subir, eliminar y marcar como principal.
 */
export const ProductImageManager = ({ productId, images: initialImages, onChange }) => {
  const [images, setImages] = useState(initialImages || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const refresh = (newImages) => {
    setImages(newImages);
    onChange?.(newImages);
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setError('');
    setUploading(true);
    try {
      const { data } = await productsService.uploadImages(productId, files);
      refresh([...images, ...data.data.images]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron subir las imágenes');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (imageId) => {
    setError('');
    try {
      await productsService.deleteImage(productId, imageId);
      refresh(images.filter((i) => i.id !== imageId));
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar la imagen');
    }
  };

  const handleSetPrimary = async (imageId) => {
    setError('');
    try {
      await productsService.setPrimaryImage(productId, imageId);
      refresh(images.map((i) => ({ ...i, isPrimary: i.id === imageId })));
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>

      {error && <div className="mb-3"><ErrorMessage message={error} /></div>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((img) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {img.isPrimary && (
              <span className="absolute top-1 left-1 bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                Principal
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  className="text-white text-xs hover:underline"
                >
                  Hacer principal
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="text-red-300 text-xs hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {/* Botón de subida */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Spinner className="h-6 w-6" />
          ) : (
            <>
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs">Subir</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <p className="text-xs text-gray-400">JPG, PNG o WEBP. Máximo 5 MB por imagen, hasta 5 imágenes.</p>
    </div>
  );
};
