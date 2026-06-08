/**
 * Genera un slug URL-amigable a partir de un string.
 * Ejemplo: "Nike Air Max 90" → "nike-air-max-90"
 */
export const generateSlug = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Genera un slug único verificando colisiones en la DB.
 * @param {string} base - texto base
 * @param {Function} existsFn - async (slug) => boolean
 */
export const uniqueSlug = async (base, existsFn) => {
  let slug = generateSlug(base);
  let suffix = 0;
  while (await existsFn(slug)) {
    suffix++;
    slug = `${generateSlug(base)}-${suffix}`;
  }
  return slug;
};
