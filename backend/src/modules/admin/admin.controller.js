import { z } from 'zod';
import { sendSuccess } from '../../utils/response.js';
import * as dashboardService from './dashboard.service.js';
import * as usersService from './users.service.js';
import * as stockService from './stock.service.js';
import * as reportsService from './reports.service.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard();
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
const userStatusSchema = z.object({ active: z.boolean() });

export const listUsers = async (req, res, next) => {
  try {
    const query = userQuerySchema.parse(req.query);
    const result = await usersService.getUsers(query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const changeUserStatus = async (req, res, next) => {
  try {
    const { active } = userStatusSchema.parse(req.body);
    const user = await usersService.setUserStatus(req.user.id, req.params.id, active);
    sendSuccess(res, { user }, 'Estado del usuario actualizado');
  } catch (err) { next(err); }
};

// ─── Stock ────────────────────────────────────────────────────────────────────
const adjustStockSchema = z.object({
  stock: z.coerce.number().int().min(0),
  reason: z.string().max(300).optional(),
});

export const stockOverview = async (req, res, next) => {
  try {
    const result = await stockService.getStockOverview({
      search: req.query.search,
      lowOnly: req.query.lowOnly === 'true',
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { stock, reason } = adjustStockSchema.parse(req.body);
    const product = await stockService.adjustStock(req.params.id, stock, reason);
    sendSuccess(res, { product }, 'Stock actualizado');
  } catch (err) { next(err); }
};

export const stockMovements = async (req, res, next) => {
  try {
    const movements = await stockService.getStockMovements({
      productId: req.query.productId,
      limit: Math.min(Number(req.query.limit) || 50, 200),
    });
    sendSuccess(res, { movements });
  } catch (err) { next(err); }
};

// ─── Reportes ─────────────────────────────────────────────────────────────────
export const salesReport = async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const result = await reportsService.getSalesReport({ days });
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const stockReport = async (req, res, next) => {
  try {
    const result = await reportsService.getStockReport();
    sendSuccess(res, result);
  } catch (err) { next(err); }
};
