import { describe, it, expect } from 'vitest';
import { generateSlug, uniqueSlug } from '../src/utils/slug.js';

describe('generateSlug', () => {
  it('convierte a minúsculas y reemplaza espacios por guiones', () => {
    expect(generateSlug('Nike Air Max 90')).toBe('nike-air-max-90');
  });

  it('quita acentos', () => {
    expect(generateSlug('Electrónica')).toBe('electronica');
    expect(generateSlug('Sillón cómodo')).toBe('sillon-comodo');
  });

  it('elimina caracteres especiales', () => {
    expect(generateSlug('TV 55" 4K!')).toBe('tv-55-4k');
  });

  it('colapsa guiones múltiples', () => {
    expect(generateSlug('a   -   b')).toBe('a-b');
  });
});

describe('uniqueSlug', () => {
  it('devuelve el slug base si no existe', async () => {
    const slug = await uniqueSlug('Producto Nuevo', async () => false);
    expect(slug).toBe('producto-nuevo');
  });

  it('agrega sufijo numérico ante colisiones', async () => {
    const taken = new Set(['producto-nuevo', 'producto-nuevo-1']);
    const slug = await uniqueSlug('Producto Nuevo', async (s) => taken.has(s));
    expect(slug).toBe('producto-nuevo-2');
  });
});
