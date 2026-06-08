import { env } from './env.js';

/** True si hay un access token real de Mercado Pago configurado */
export const isMercadoPagoConfigured = () => {
  const token = env.mercadoPago.accessToken;
  return Boolean(token && !token.startsWith('TEST-xxx') && !token.startsWith('tu_'));
};

/**
 * Devuelve un cliente de preferencias de Mercado Pago (carga perezosa del SDK).
 * Solo se llama cuando isMercadoPagoConfigured() === true.
 */
export const getMercadoPagoClient = async () => {
  const { MercadoPagoConfig, Preference, Payment } = await import('mercadopago');
  const client = new MercadoPagoConfig({ accessToken: env.mercadoPago.accessToken });
  return {
    preference: new Preference(client),
    payment: new Payment(client),
  };
};
