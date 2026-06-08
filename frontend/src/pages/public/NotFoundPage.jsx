import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
    <h1 className="text-6xl font-bold text-brand-600 mb-4">404</h1>
    <p className="text-xl text-gray-700 mb-2">Página no encontrada</p>
    <p className="text-gray-500 mb-8">La dirección que buscás no existe.</p>
    <Link to="/" className="bg-brand-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-brand-700">
      Volver al inicio
    </Link>
  </div>
);
