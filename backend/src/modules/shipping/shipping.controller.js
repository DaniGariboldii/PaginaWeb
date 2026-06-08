import * as shippingService from './shipping.service.js';
import { quoteSchema, createZoneSchema, updateZoneSchema } from '../../validators/shipping.validator.js';
import { sendSuccess } from '../../utils/response.js';
import { AR_PROVINCES } from '../../utils/provinces.js';

// Público: lista de provincias (para selects del frontend)
export const provinces = (req, res) => sendSuccess(res, { provinces: AR_PROVINCES });

// Cliente: cotizar envío
export const quote = async (req, res, next) => {
  try {
    const { province, subtotal } = quoteSchema.parse(req.body);
    const result = await shippingService.quoteShipping(province, subtotal);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

// ── Admin ──
export const listZones = async (req, res, next) => {
  try {
    const zones = await shippingService.listZones();
    sendSuccess(res, { zones });
  } catch (err) { next(err); }
};

export const createZone = async (req, res, next) => {
  try {
    const data = createZoneSchema.parse(req.body);
    const zone = await shippingService.createZone(data);
    sendSuccess(res, { zone }, 'Zona creada', 201);
  } catch (err) { next(err); }
};

export const updateZone = async (req, res, next) => {
  try {
    const data = updateZoneSchema.parse(req.body);
    const zone = await shippingService.updateZone(req.params.id, data);
    sendSuccess(res, { zone }, 'Zona actualizada');
  } catch (err) { next(err); }
};

export const deleteZone = async (req, res, next) => {
  try {
    await shippingService.deleteZone(req.params.id);
    sendSuccess(res, null, 'Zona eliminada');
  } catch (err) { next(err); }
};
