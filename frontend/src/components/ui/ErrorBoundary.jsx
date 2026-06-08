import { Component } from 'react';

/**
 * Captura errores de renderizado en el árbol y muestra un fallback amigable
 * en lugar de una pantalla en blanco.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-ink-50">
          <span className="grid place-items-center w-16 h-16 rounded-2xl bg-red-100 text-red-600 mb-5">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Algo salió mal</h1>
          <p className="text-ink-500 mb-6">Ocurrió un error inesperado. Probá recargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
