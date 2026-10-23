export const ROLES = { CLIENTE: 'CLIENTE', COMERCIO: 'COMERCIO', REPARTIDOR: 'REPARTIDOR', ADMINISTRADOR: 'ADMINISTRADOR' };

export const homeFor = (role) =>
  ({ CLIENTE: '/cliente', COMERCIO: '/comercio', REPARTIDOR: '/repartidor', ADMINISTRADOR: '/admin' }[role] || '/');

// ---------- Máquina de estados del PEDIDO ----------
export const ORDER_FLOW = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'EN_CAMINO', 'ENTREGADO'];
export const ORDER_TRANSITIONS = {
  PENDIENTE: ['CONFIRMADO', 'RECHAZADO', 'CANCELADO'],
  CONFIRMADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['LISTO_PARA_RECOGER', 'CANCELADO'],
  LISTO_PARA_RECOGER: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
};

// ---------- Máquina de estados de la ENTREGA ----------
export const DELIVERY_FLOW = ['PENDIENTE', 'ASIGNADA', 'RECOGIDA', 'EN_CAMINO', 'ENTREGADA'];
export const DELIVERY_TRANSITIONS = {
  PENDIENTE: ['ASIGNADA'],
  ASIGNADA: ['RECOGIDA', 'CANCELADA'],
  RECOGIDA: ['EN_CAMINO', 'CANCELADA'],
  EN_CAMINO: ['ENTREGADA', 'CANCELADA'],
  ENTREGADA: [],
  CANCELADA: [],
};

// tone → colores (todos cumplen contraste >= 4.5:1: texto 900 sobre fondo 100)
export const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', tone: 'amber' },
  CONFIRMADO: { label: 'Confirmado', tone: 'blue' },
  EN_PREPARACION: { label: 'En preparación', tone: 'violet' },
  LISTO_PARA_RECOGER: { label: 'Listo para recoger', tone: 'sky' },
  EN_CAMINO: { label: 'En camino', tone: 'indigo' },
  ENTREGADO: { label: 'Entregado', tone: 'green' },
  CANCELADO: { label: 'Cancelado', tone: 'red' },
  RECHAZADO: { label: 'Rechazado', tone: 'red' },
  ASIGNADA: { label: 'Asignada', tone: 'blue' },
  RECOGIDA: { label: 'Recogida', tone: 'violet' },
  ENTREGADA: { label: 'Entregada', tone: 'green' },
  CANCELADA: { label: 'Cancelada', tone: 'red' },
  APROBADO: { label: 'Aprobado', tone: 'green' },
};

export const PAYMENT_METHODS = [
  { id: 'TARJETA', label: 'Tarjeta crédito/débito' },
  { id: 'PSE', label: 'PSE / Transferencia' },
  { id: 'EFECTIVO', label: 'Efectivo (simulado)' },
];
