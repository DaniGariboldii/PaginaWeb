import * as addressService from './addresses.service.js';
import { createAddressSchema, updateAddressSchema } from '../../validators/address.validator.js';
import { sendSuccess } from '../../utils/response.js';

export const listAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddresses(req.user.id);
    sendSuccess(res, { addresses });
  } catch (err) { next(err); }
};

export const addAddress = async (req, res, next) => {
  try {
    const data = createAddressSchema.parse(req.body);
    const address = await addressService.createAddress(req.user.id, data);
    sendSuccess(res, { address }, 'Dirección creada', 201);
  } catch (err) { next(err); }
};

export const editAddress = async (req, res, next) => {
  try {
    const data = updateAddressSchema.parse(req.body);
    const address = await addressService.updateAddress(req.user.id, req.params.id, data);
    sendSuccess(res, { address }, 'Dirección actualizada');
  } catch (err) { next(err); }
};

export const removeAddress = async (req, res, next) => {
  try {
    await addressService.deleteAddress(req.user.id, req.params.id);
    sendSuccess(res, null, 'Dirección eliminada');
  } catch (err) { next(err); }
};
