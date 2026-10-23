// ============================================================================
//  BACKEND SIMULADO (solo para desarrollo del frontend)
//  Guarda todo en localStorage y expone los mismos endpoints REST que tu API.
//  Cuando tengas el backend real: pon VITE_USE_MOCK=false en .env
// ============================================================================
import { ORDER_TRANSITIONS, DELIVERY_TRANSITIONS, STATUS_META } from './constants.js';

const KEY = 'domiflow_db_v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

const COUPONS = {
  BIENVENIDO10: { type: 'pct', value: 10, min: 0, text: '10% de descuento' },
  PROMO5000: { type: 'fixed', value: 5000, min: 20000, text: '$5.000 de descuento en compras desde $20.000' },
};

class ApiError extends Error {
  constructor(status, message, data) { super(message); this.status = status; this.data = data; }
}
const fail = (s, m, d) => { throw new ApiError(s, m, d); };

function seed() {
  const mk = (id, name, email, role, extra = {}) => ({
    id, name, email, password: 'Demo1234', role, phone: '3001234567',
    available: role === 'REPARTIDOR', createdAt: now(), ...extra,
  });
  const users = [
    mk('u_admin', 'Ana Administradora', 'admin@demo.com', 'ADMINISTRADOR'),
    mk('u_cli', 'Carlos Cliente', 'cliente@demo.com', 'CLIENTE'),
    mk('u_com1', 'Laura Pizzera', 'comercio@demo.com', 'COMERCIO'),
    mk('u_com2', 'Kenji Sushi', 'comercio2@demo.com', 'COMERCIO'),
    mk('u_com3', 'Bruno Burger', 'comercio3@demo.com', 'COMERCIO'),
    mk('u_rep1', 'Rafa Repartidor', 'repartidor@demo.com', 'REPARTIDOR'),
    mk('u_rep2', 'Rosa Repartidora', 'repartidor2@demo.com', 'REPARTIDOR', { available: false }),
  ];
  const merchants = [
    { id: 'm1', ownerId: 'u_com1', name: 'Pizzería Don Luigi', category: 'Pizza', emoji: '🍕', description: 'Pizzas al horno de piedra y pasta fresca', open: true, deliveryFee: 3000, rating: 4.7, categories: ['Pizzas', 'Bebidas', 'Postres'] },
    { id: 'm2', ownerId: 'u_com2', name: 'Sushi Kento', category: 'Sushi', emoji: '🍣', description: 'Rolls y nigiris preparados al momento', open: true, deliveryFee: 4500, rating: 4.5, categories: ['Rolls', 'Bebidas'] },
    { id: 'm3', ownerId: 'u_com3', name: 'Burger Central', category: 'Hamburguesas', emoji: '🍔', description: 'Hamburguesas artesanales con papas', open: true, deliveryFee: 2500, rating: 4.3, categories: ['Hamburguesas', 'Acompañamientos', 'Bebidas'] },
  ];
  const p = (merchantId, name, price, category, emoji, stock) => ({ id: uid('p'), merchantId, name, price, category, emoji, stock, active: true });
  const products = [
    p('m1', 'Pizza Margarita', 32000, 'Pizzas', '🍕', 12), p('m1', 'Pizza Pepperoni', 36000, 'Pizzas', '🍕', 10),
    p('m1', 'Limonada de coco', 9000, 'Bebidas', '🥥', 20), p('m1', 'Tiramisú', 14000, 'Postres', '🍰', 4),
    p('m2', 'Roll California (8u)', 28000, 'Rolls', '🍣', 15), p('m2', 'Roll Tempura (8u)', 31000, 'Rolls', '🍤', 9),
    p('m2', 'Té helado', 7000, 'Bebidas', '🍵', 25),
    p('m3', 'Doble Queso', 27000, 'Hamburguesas', '🍔', 14), p('m3', 'Veggie Burger', 24000, 'Hamburguesas', '🥬', 8),
    p('m3', 'Papas rústicas', 10000, 'Acompañamientos', '🍟', 30), p('m3', 'Gaseosa 400ml', 5000, 'Bebidas', '🥤', 40),
  ];
  return {
    users, merchants, products, orders: [], deliveries: [], notifications: [],
    addresses: [{ id: 'a1', userId: 'u_cli', label: 'Casa', street: 'Calle 100 #15-20', city: 'Bogotá', notes: 'Apto 301', isDefault: true }],
    employees: [
      { id: 'e1', name: 'María Gómez', type: 'DIRECTO', position: 'Soporte al cliente', document: '1020304050', createdAt: now() },
      { id: 'e2', name: 'Logística Express S.A.S.', type: 'INDIRECTO', position: 'Operador logístico', document: '900123456', createdAt: now() },
    ],
  };
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* ignorar */ }
  const d = seed();
  localStorage.setItem(KEY, JSON.stringify(d));
  return d;
}
const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
export function resetMockDb() { localStorage.removeItem(KEY); }

// ---------- helpers ----------
const pub = (u) => { const { password, ...rest } = u; return rest; };
const makeToken = (u) => btoa(JSON.stringify({ id: u.id }));
const merchantOf = (db, id) => db.merchants.find((m) => m.id === id);
const notify = (db, userId, text) => db.notifications.unshift({ id: uid('n'), userId, text, read: false, createdAt: now() });

function enrichOrder(db, o) {
  const m = merchantOf(db, o.merchantId);
  const d = db.deliveries.find((x) => x.orderId === o.id) || null;
  return {
    ...o,
    merchantName: m?.name, merchantEmoji: m?.emoji,
    customerName: db.users.find((u) => u.id === o.customerId)?.name,
    courierName: d?.courierId ? db.users.find((u) => u.id === d.courierId)?.name : null,
    delivery: d,
  };
}
const enrichDelivery = (db, d) => ({ ...d, order: enrichOrder(db, db.orders.find((o) => o.id === d.orderId)) });

function couponInfo(code, subtotal) {
  const c = COUPONS[(code || '').toUpperCase()];
  if (!c) return { valid: false, message: 'Cupón no existe o expiró' };
  if (subtotal < c.min) return { valid: false, message: `Este cupón requiere una compra mínima de $${c.min.toLocaleString('es-CO')}` };
  return { valid: true, code: code.toUpperCase(), type: c.type, value: c.value, min: c.min, message: c.text };
}
const discountOf = (info, subtotal) => (!info.valid ? 0 : info.type === 'pct' ? Math.round((subtotal * info.value) / 100) : Math.min(info.value, subtotal));

function setOrderStatus(db, o, status) {
  o.status = status;
  o.history.push({ status, at: now() });
  notify(db, o.customerId, `Tu pedido #${o.code} ahora está: ${STATUS_META[status].label}`);

  if (status === 'CONFIRMADO' && !db.deliveries.some((d) => d.orderId === o.id)) {
    db.deliveries.push({ id: uid('d'), orderId: o.id, courierId: null, status: 'PENDIENTE', history: [{ status: 'PENDIENTE', at: now() }] });
    db.users.filter((u) => u.role === 'REPARTIDOR' && u.available).forEach((u) => notify(db, u.id, `Nueva entrega disponible (#${o.code})`));
  }
  if (status === 'LISTO_PARA_RECOGER') {
    const d = db.deliveries.find((x) => x.orderId === o.id);
    if (d?.courierId) notify(db, d.courierId, `El pedido #${o.code} ya está listo para recoger`);
  }
  if (status === 'CANCELADO' || status === 'RECHAZADO') {
    o.items.forEach((it) => { const pr = db.products.find((x) => x.id === it.productId); if (pr) pr.stock += it.qty; });
    const d = db.deliveries.find((x) => x.orderId === o.id);
    if (d && !['ENTREGADA', 'CANCELADA'].includes(d.status)) { d.status = 'CANCELADA'; d.history.push({ status: 'CANCELADA', at: now() }); }
    const m = merchantOf(db, o.merchantId);
    if (m && status === 'CANCELADO') notify(db, m.ownerId, `El pedido #${o.code} fue cancelado`);
  }
}

function setDeliveryStatus(db, d, status) {
  d.status = status;
  d.history.push({ status, at: now() });
}

// ---------- router ----------
const routes = [];
const r = (method, pattern, handler, opts = {}) =>
  routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler, auth: opts.auth !== false, roles: opts.roles });

const myMerchant = (db, me) => db.merchants.find((m) => m.ownerId === me.id) || fail(404, 'Tu usuario no tiene un comercio asociado');

// ----- Auth -----
r('POST', '/auth/login', ({ db, body }) => {
  const u = db.users.find((x) => x.email.toLowerCase() === (body.email || '').toLowerCase());
  if (!u || u.password !== body.password) fail(401, 'Correo o contraseña incorrectos');
  return { token: makeToken(u), user: pub(u) };
}, { auth: false });

r('POST', '/auth/register', ({ db, body }) => {
  if (db.users.some((x) => x.email.toLowerCase() === (body.email || '').toLowerCase())) fail(409, 'Ese correo ya está registrado');
  const u = { id: uid('u'), name: body.name, email: body.email, password: body.password, phone: body.phone || '', role: 'CLIENTE', available: false, createdAt: now() };
  db.users.push(u);
  return { token: makeToken(u), user: pub(u) };
}, { auth: false });

r('GET', '/auth/me', ({ me }) => pub(me));
r('PUT', '/profile', ({ me, body }) => { me.name = body.name; me.phone = body.phone; return pub(me); });

// ----- Catálogo público -----
r('GET', '/categories', ({ db }) => [...new Set(db.merchants.map((m) => m.category))]);
r('GET', '/merchants', ({ db, query }) => db.merchants.filter((m) => !query.category || m.category === query.category));
r('GET', '/merchants/:id', ({ db, params }) => {
  const m = merchantOf(db, params.id) || fail(404, 'Comercio no encontrado');
  return { ...m, products: db.products.filter((p) => p.merchantId === m.id && p.active) };
});

// ----- Carrito / cupones -----
r('GET', '/coupons/validate', ({ query }) => couponInfo(query.code, Number(query.subtotal || 0)));
r('POST', '/cart/validate', ({ db, body }) => {
  const outOfStock = [];
  let subtotal = 0;
  (body.items || []).forEach((it) => {
    const p = db.products.find((x) => x.id === it.productId);
    if (!p || !p.active || p.stock < it.qty) outOfStock.push({ productId: it.productId, name: p?.name || 'Producto', available: p?.stock || 0 });
    else subtotal += p.price * it.qty;
  });
  return { ok: outOfStock.length === 0, outOfStock, subtotal };
});

// ----- Direcciones -----
r('GET', '/addresses', ({ db, me }) => db.addresses.filter((a) => a.userId === me.id));
r('POST', '/addresses', ({ db, me, body }) => {
  const mine = db.addresses.filter((a) => a.userId === me.id);
  const a = { id: uid('a'), userId: me.id, label: body.label, street: body.street, city: body.city, notes: body.notes || '', isDefault: mine.length === 0 };
  db.addresses.push(a);
  return a;
});
r('PUT', '/addresses/:id', ({ db, me, params, body }) => {
  const a = db.addresses.find((x) => x.id === params.id && x.userId === me.id) || fail(404, 'Dirección no encontrada');
  Object.assign(a, { label: body.label, street: body.street, city: body.city, notes: body.notes || '' });
  return a;
});
r('PATCH', '/addresses/:id/default', ({ db, me, params }) => {
  db.addresses.filter((a) => a.userId === me.id).forEach((a) => { a.isDefault = a.id === params.id; });
  return { ok: true };
});
r('DELETE', '/addresses/:id', ({ db, me, params }) => {
  const i = db.addresses.findIndex((x) => x.id === params.id && x.userId === me.id);
  if (i < 0) fail(404, 'Dirección no encontrada');
  const was = db.addresses[i];
  db.addresses.splice(i, 1);
  const left = db.addresses.filter((a) => a.userId === me.id);
  if (was.isDefault && left[0]) left[0].isDefault = true;
  return { ok: true };
});

// ----- Pedidos -----
r('POST', '/orders', ({ db, me, body }) => {
  const m = merchantOf(db, body.merchantId) || fail(404, 'Comercio no encontrado');
  if (!m.open) fail(409, 'Este comercio no está recibiendo pedidos ahora');
  const addr = db.addresses.find((a) => a.id === body.addressId && a.userId === me.id) || fail(400, 'Selecciona una dirección de entrega');
  const out = [];
  const items = (body.items || []).map((it) => {
    const p = db.products.find((x) => x.id === it.productId);
    if (!p || !p.active || p.stock < it.qty) out.push({ productId: it.productId, name: p?.name || 'Producto', available: p?.stock || 0 });
    return { productId: it.productId, name: p?.name, price: p?.price, qty: it.qty, emoji: p?.emoji };
  });
  if (out.length) fail(409, 'Algunos productos se agotaron mientras comprabas', { outOfStock: out });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const info = body.coupon ? couponInfo(body.coupon, subtotal) : { valid: false };
  const discount = discountOf(info, subtotal);
  const total = Math.max(0, subtotal - discount) + m.deliveryFee;

  items.forEach((it) => { db.products.find((x) => x.id === it.productId).stock -= it.qty; });
  const o = {
    id: uid('o'), code: String(1001 + db.orders.length), customerId: me.id, merchantId: m.id, items, subtotal, discount,
    deliveryFee: m.deliveryFee, total, coupon: info.valid ? info.code : null, status: 'PENDIENTE',
    address: `${addr.label}: ${addr.street}, ${addr.city}`, paymentMethod: body.paymentMethod, paymentStatus: 'PENDIENTE',
    createdAt: now(), history: [{ status: 'PENDIENTE', at: now() }], rating: null,
  };
  db.orders.push(o);
  return enrichOrder(db, o);
}, { roles: ['CLIENTE'] });

r('GET', '/orders', ({ db, me, query }) => {
  let list = db.orders;
  if (me.role === 'CLIENTE') list = list.filter((o) => o.customerId === me.id);
  else if (me.role === 'COMERCIO') list = list.filter((o) => o.merchantId === myMerchant(db, me).id);
  else if (me.role === 'REPARTIDOR') list = list.filter((o) => db.deliveries.some((d) => d.orderId === o.id && d.courierId === me.id));
  if (query.status) list = list.filter((o) => o.status === query.status);
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => enrichOrder(db, o));
});

r('GET', '/orders/:id', ({ db, me, params }) => {
  const o = db.orders.find((x) => x.id === params.id) || fail(404, 'Pedido no encontrado');
  if (me.role === 'CLIENTE' && o.customerId !== me.id) fail(403, 'Este pedido no es tuyo');
  return enrichOrder(db, o);
});

r('PATCH', '/orders/:id/status', ({ db, me, params, body }) => {
  const o = db.orders.find((x) => x.id === params.id) || fail(404, 'Pedido no encontrado');
  const next = body.status;
  if (!(ORDER_TRANSITIONS[o.status] || []).includes(next)) fail(409, `Transición inválida: ${o.status} → ${next}`);
  if (me.role === 'CLIENTE' && !(o.customerId === me.id && next === 'CANCELADO' && o.status === 'PENDIENTE')) fail(403, 'Solo puedes cancelar pedidos pendientes');
  if (me.role === 'COMERCIO') {
    if (o.merchantId !== myMerchant(db, me).id) fail(403, 'Este pedido no es de tu comercio');
    if (!['CONFIRMADO', 'RECHAZADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'CANCELADO'].includes(next)) fail(403, 'Ese cambio lo hace el repartidor');
  }
  if (me.role === 'REPARTIDOR') fail(403, 'Los repartidores actualizan la entrega, no el pedido');
  if (next === 'CONFIRMADO' && o.paymentStatus !== 'APROBADO') fail(409, 'El pago aún no está aprobado');
  setOrderStatus(db, o, next);
  return enrichOrder(db, o);
});

r('POST', '/orders/:id/rating', ({ db, me, params, body }) => {
  const o = db.orders.find((x) => x.id === params.id && x.customerId === me.id) || fail(404, 'Pedido no encontrado');
  if (o.status !== 'ENTREGADO') fail(409, 'Solo puedes calificar pedidos entregados');
  if (o.rating) fail(409, 'Ya calificaste este pedido');
  o.rating = { merchant: body.merchant, courier: body.courier, comment: body.comment || '' };
  return enrichOrder(db, o);
}, { roles: ['CLIENTE'] });

// ----- Pagos (simulador) -----
r('POST', '/payments/simulate', ({ db, me, body }) => {
  const o = db.orders.find((x) => x.id === body.orderId && x.customerId === me.id) || fail(404, 'Pedido no encontrado');
  if (!['APROBADO', 'RECHAZADO', 'PENDIENTE'].includes(body.result)) fail(400, 'Resultado de pago inválido');
  if (o.status !== 'PENDIENTE' || o.paymentStatus === 'APROBADO') fail(409, 'Este pedido ya no admite cambios de pago');
  o.paymentStatus = body.result;
  if (body.result === 'APROBADO') {
    const m = merchantOf(db, o.merchantId);
    notify(db, m.ownerId, `Nuevo pedido pagado #${o.code} por ${o.total.toLocaleString('es-CO')}`);
    notify(db, o.customerId, `Pago aprobado para el pedido #${o.code}`);
  }
  return enrichOrder(db, o);
}, { roles: ['CLIENTE'] });

// ----- Comercio -----
r('GET', '/my/merchant', ({ db, me }) => myMerchant(db, me), { roles: ['COMERCIO'] });
r('PATCH', '/my/merchant', ({ db, me, body }) => { const m = myMerchant(db, me); m.open = !!body.open; return m; }, { roles: ['COMERCIO'] });
r('GET', '/my/products', ({ db, me }) => db.products.filter((p) => p.merchantId === myMerchant(db, me).id), { roles: ['COMERCIO'] });
r('POST', '/my/products', ({ db, me, body }) => {
  const m = myMerchant(db, me);
  const p = { id: uid('p'), merchantId: m.id, name: body.name, price: Number(body.price), category: body.category, emoji: body.emoji || '🍽️', stock: Number(body.stock), active: body.active !== false };
  db.products.push(p);
  return p;
}, { roles: ['COMERCIO'] });
r('PUT', '/my/products/:id', ({ db, me, params, body }) => {
  const p = db.products.find((x) => x.id === params.id && x.merchantId === myMerchant(db, me).id) || fail(404, 'Producto no encontrado');
  Object.assign(p, { name: body.name, price: Number(body.price), category: body.category, emoji: body.emoji || p.emoji, stock: Number(body.stock), active: body.active !== false });
  return p;
}, { roles: ['COMERCIO'] });
r('DELETE', '/my/products/:id', ({ db, me, params }) => {
  const i = db.products.findIndex((x) => x.id === params.id && x.merchantId === myMerchant(db, me).id);
  if (i < 0) fail(404, 'Producto no encontrado');
  db.products.splice(i, 1);
  return { ok: true };
}, { roles: ['COMERCIO'] });
r('PATCH', '/my/products/:id/stock', ({ db, me, params, body }) => {
  const p = db.products.find((x) => x.id === params.id && x.merchantId === myMerchant(db, me).id) || fail(404, 'Producto no encontrado');
  if (Number(body.stock) < 0) fail(400, 'El stock no puede ser negativo');
  p.stock = Number(body.stock);
  return p;
}, { roles: ['COMERCIO'] });
r('POST', '/my/categories', ({ db, me, body }) => {
  const m = myMerchant(db, me);
  const name = (body.name || '').trim();
  if (!name) fail(400, 'Escribe un nombre');
  if (m.categories.some((c) => c.toLowerCase() === name.toLowerCase())) fail(409, 'Esa categoría ya existe');
  m.categories.push(name);
  return m;
}, { roles: ['COMERCIO'] });
r('DELETE', '/my/categories/:name', ({ db, me, params }) => {
  const m = myMerchant(db, me);
  const name = decodeURIComponent(params.name);
  if (db.products.some((p) => p.merchantId === m.id && p.category === name)) fail(409, 'No puedes borrar una categoría que tiene productos');
  m.categories = m.categories.filter((c) => c !== name);
  return m;
}, { roles: ['COMERCIO'] });

// ----- Repartidor -----
r('PATCH', '/courier/availability', ({ me, body }) => { me.available = !!body.available; return pub(me); }, { roles: ['REPARTIDOR'] });
r('GET', '/deliveries', ({ db, me }) => {
  const byDate = (a, b) => b.history[0].at.localeCompare(a.history[0].at);
  const mine = db.deliveries.filter((d) => d.courierId === me.id).sort(byDate).map((d) => enrichDelivery(db, d));
  const available = me.available ? db.deliveries.filter((d) => d.status === 'PENDIENTE' && !d.courierId).map((d) => enrichDelivery(db, d)) : [];
  return { mine, available };
}, { roles: ['REPARTIDOR'] });
r('POST', '/deliveries/:id/take', ({ db, me, params }) => {
  const d = db.deliveries.find((x) => x.id === params.id) || fail(404, 'Entrega no encontrada');
  if (!me.available) fail(409, 'Activa tu disponibilidad para tomar entregas');
  if (d.courierId || d.status !== 'PENDIENTE') fail(409, 'Otra persona ya tomó esta entrega');
  d.courierId = me.id;
  setDeliveryStatus(db, d, 'ASIGNADA');
  const o = db.orders.find((x) => x.id === d.orderId);
  notify(db, o.customerId, `${me.name} será tu repartidor en el pedido #${o.code}`);
  return enrichDelivery(db, d);
}, { roles: ['REPARTIDOR'] });
r('PATCH', '/deliveries/:id/status', ({ db, me, params, body }) => {
  const d = db.deliveries.find((x) => x.id === params.id) || fail(404, 'Entrega no encontrada');
  if (me.role === 'REPARTIDOR' && d.courierId !== me.id) fail(403, 'Esta entrega no es tuya');
  const next = body.status;
  if (!(DELIVERY_TRANSITIONS[d.status] || []).includes(next)) fail(409, `Transición inválida: ${d.status} → ${next}`);
  const o = db.orders.find((x) => x.id === d.orderId);
  if (next === 'RECOGIDA' && o.status !== 'LISTO_PARA_RECOGER') fail(409, 'El comercio aún no marca el pedido como listo para recoger');
  setDeliveryStatus(db, d, next);
  if (next === 'EN_CAMINO') setOrderStatus(db, o, 'EN_CAMINO');
  if (next === 'ENTREGADA') setOrderStatus(db, o, 'ENTREGADO');
  if (next === 'CANCELADA') setOrderStatus(db, o, 'CANCELADO');
  return enrichDelivery(db, d);
}, { roles: ['REPARTIDOR', 'ADMINISTRADOR'] });

// ----- Administrador -----
const ADM = { roles: ['ADMINISTRADOR'] };
r('GET', '/admin/stats', ({ db }) => ({
  users: db.users.length, merchants: db.merchants.length, orders: db.orders.length,
  revenue: db.orders.filter((o) => o.status === 'ENTREGADO').reduce((s, o) => s + o.total, 0),
  activeDeliveries: db.deliveries.filter((d) => ['ASIGNADA', 'RECOGIDA', 'EN_CAMINO'].includes(d.status)).length,
  pendingDeliveries: db.deliveries.filter((d) => d.status === 'PENDIENTE').length,
}), ADM);
r('GET', '/admin/users', ({ db }) => db.users.map(pub), ADM);
r('POST', '/admin/users', ({ db, body }) => {
  if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) fail(409, 'Ese correo ya está registrado');
  const u = { id: uid('u'), name: body.name, email: body.email, password: body.password, phone: body.phone || '', role: body.role, available: body.role === 'REPARTIDOR', createdAt: now() };
  db.users.push(u);
  return pub(u);
}, ADM);
r('PATCH', '/admin/users/:id/role', ({ db, me, params, body }) => {
  const u = db.users.find((x) => x.id === params.id) || fail(404, 'Usuario no encontrado');
  if (u.id === me.id) fail(409, 'No puedes cambiar tu propio rol');
  u.role = body.role;
  return pub(u);
}, ADM);
r('GET', '/admin/employees', ({ db }) => db.employees, ADM);
r('POST', '/admin/employees', ({ db, body }) => {
  const e = { id: uid('e'), name: body.name, type: body.type, position: body.position, document: body.document, createdAt: now() };
  db.employees.push(e);
  return e;
}, ADM);
r('DELETE', '/admin/employees/:id', ({ db, params }) => { db.employees = db.employees.filter((e) => e.id !== params.id); return { ok: true }; }, ADM);
r('GET', '/admin/merchants', ({ db }) => db.merchants.map((m) => ({ ...m, ownerName: db.users.find((u) => u.id === m.ownerId)?.name, ownerEmail: db.users.find((u) => u.id === m.ownerId)?.email })), ADM);
r('POST', '/admin/merchants', ({ db, body }) => {
  if (db.users.some((u) => u.email.toLowerCase() === body.ownerEmail.toLowerCase())) fail(409, 'El correo del propietario ya está registrado');
  const owner = { id: uid('u'), name: body.ownerName, email: body.ownerEmail, password: body.ownerPassword, phone: '', role: 'COMERCIO', available: false, createdAt: now() };
  db.users.push(owner);
  const m = { id: uid('m'), ownerId: owner.id, name: body.name, category: body.category, emoji: body.emoji || '🍽️', description: body.description || '', open: false, deliveryFee: Number(body.deliveryFee || 3000), rating: 0, categories: ['General'] };
  db.merchants.push(m);
  return m;
}, ADM);
r('GET', '/admin/couriers', ({ db }) => db.users.filter((u) => u.role === 'REPARTIDOR').map(pub), ADM);
r('GET', '/admin/deliveries', ({ db }) => [...db.deliveries].reverse().map((d) => ({ ...enrichDelivery(db, d), courierName: db.users.find((u) => u.id === d.courierId)?.name || null })), ADM);
r('POST', '/admin/deliveries/:id/assign', ({ db, params, body }) => {
  const d = db.deliveries.find((x) => x.id === params.id) || fail(404, 'Entrega no encontrada');
  if (!['PENDIENTE', 'ASIGNADA'].includes(d.status)) fail(409, 'Ya no se puede reasignar: el pedido fue recogido o finalizó');
  const c = db.users.find((u) => u.id === body.courierId && u.role === 'REPARTIDOR') || fail(404, 'Repartidor no encontrado');
  d.courierId = c.id;
  if (d.status === 'PENDIENTE') setDeliveryStatus(db, d, 'ASIGNADA');
  const o = db.orders.find((x) => x.id === d.orderId);
  notify(db, c.id, `Te asignaron la entrega del pedido #${o.code}`);
  notify(db, o.customerId, `${c.name} será tu repartidor en el pedido #${o.code}`);
  return enrichDelivery(db, d);
}, ADM);

// ----- Notificaciones -----
r('GET', '/notifications', ({ db, me }) => db.notifications.filter((n) => n.userId === me.id).slice(0, 50));
r('PATCH', '/notifications/read-all', ({ db, me }) => { db.notifications.forEach((n) => { if (n.userId === me.id) n.read = true; }); return { ok: true }; });
r('PATCH', '/notifications/:id/read', ({ db, me, params }) => { const n = db.notifications.find((x) => x.id === params.id && x.userId === me.id); if (n) n.read = true; return { ok: true }; });

// ---------- entrada ----------
export async function mockRequest(method, fullPath, body, tk) {
  await sleep(250 + Math.random() * 250);
  const [path, qs] = fullPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const db = load();
  for (const rt of routes) {
    if (rt.method !== method) continue;
    const m = rt.re.exec(path);
    if (!m) continue;
    let me = null;
    if (rt.auth) {
      try { me = db.users.find((u) => u.id === JSON.parse(atob(tk)).id); } catch { /* sin sesión */ }
      if (!me) fail(401, 'Tu sesión expiró. Inicia sesión de nuevo');
      if (rt.roles && !rt.roles.includes(me.role)) fail(403, 'No tienes permisos para esta acción');
    }
    const out = rt.handler({ db, me, params: m.groups || {}, query, body: body || {} });
    save(db);
    return structuredClone(out ?? { ok: true });
  }
  return fail(404, 'Ruta no encontrada');
}
