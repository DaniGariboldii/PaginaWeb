export const formatPrice = (price) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

export const formatDate = (date) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

// Estados de pedido: etiqueta legible + variante de color para Badge
export const ORDER_STATUS = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', variant: 'yellow' },
  PAID: { label: 'Pagado', variant: 'green' },
  PREPARING: { label: 'En preparación', variant: 'blue' },
  SHIPPED: { label: 'Enviado', variant: 'blue' },
  DELIVERED: { label: 'Entregado', variant: 'green' },
  CANCELLED: { label: 'Cancelado', variant: 'gray' },
  REJECTED: { label: 'Rechazado', variant: 'red' },
};

export const orderStatusInfo = (status) =>
  ORDER_STATUS[status] || { label: status, variant: 'gray' };

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: { label: 'Pendiente', variant: 'yellow' },
  APPROVED: { label: 'Aprobado', variant: 'green' },
  REJECTED: { label: 'Rechazado', variant: 'red' },
  CANCELLED: { label: 'Cancelado', variant: 'gray' },
};

export const paymentStatusInfo = (status) =>
  PAYMENT_STATUS[status] || { label: status || '—', variant: 'gray' };
