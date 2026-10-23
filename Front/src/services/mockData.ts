import type { Admin, Commerce, Product, Promocion, Repartidor, Order } from '../types';

export const adminMock: Admin = {
  id: 1,
  name: 'Sofía Ramírez',
  email: 'sofia@rappi-admin.com',
  role: 'Superadministradora',
  avatar: 'SR',
};

export const initialCommerces: Commerce[] = [
  { id: 101, name: 'Burger House', category: 'Fast Food', city: 'Bogotá', agreementStatus: 'Activo', status: 'Activo' },
  { id: 102, name: 'Sushi Zen', category: 'Japonesa', city: 'Medellín', agreementStatus: 'Activo', status: 'Activo' },
  { id: 103, name: 'La Pizzeta', category: 'Pizza', city: 'Cali', agreementStatus: 'Inactivo', status: 'Inactivo' },
  { id: 104, name: 'Green Bowl', category: 'Saludable', city: 'Bogotá', agreementStatus: 'Inactivo', status: 'Activo' },
];

export const initialProducts: Product[] = [
  { id: 501, name: 'Combo Burger', description: 'Hamburguesa clásica con papas', price: 24500, commerce: 'Burger House', category: 'Fast Food', imageUrl: 'https://via.placeholder.com/80', inStock: true },
  { id: 502, name: 'Sushi Roll', description: 'Roll nikkei con salsa teriyaki', price: 35500, commerce: 'Sushi Zen', category: 'Japonesa', imageUrl: 'https://via.placeholder.com/80', inStock: true },
  { id: 503, name: 'Pizza Margarita', description: 'Porción mediana con albahaca fresca', price: 28500, commerce: 'La Pizzeta', category: 'Pizza', imageUrl: 'https://via.placeholder.com/80', inStock: false },
];

export const initialPromotions: Promocion[] = [
  { id: 301, code: 'RAPPI10', discount: 10, discountType: '%', startDate: '2026-08-01', endDate: '2026-08-15', usageLimit: 500, minOrderValue: 25000, active: true },
  { id: 302, code: 'ENVIOFREE', discount: 15, discountType: '%', startDate: '2026-08-03', endDate: '2026-08-20', usageLimit: 200, minOrderValue: 0, active: true },
];

export const initialDrivers: Repartidor[] = [
  { id: 201, name: 'Camilo Ortiz', phone: '3001112233', vehicle: 'Moto', status: 'Disponible', zone: 'Centro', rating: 4.9, currentOrder: 'Ninguno' },
  { id: 202, name: 'Diana Pérez', phone: '3012223344', vehicle: 'Bici', status: 'En entrega', zone: 'Norte', rating: 4.7, currentOrder: 'Pedido #9002' },
  { id: 203, name: 'Mateo López', phone: '3023334455', vehicle: 'Moto', status: 'Inactivo', zone: 'Sur', rating: 4.5, currentOrder: 'Ninguno' },
];

export const initialOrders: Order[] = [
  { id: 9001, customer: 'Laura Gómez', merchant: 'Burger House', driverAssigned: 'Camilo Ortiz', total: 48250, paymentMethod: 'Tarjeta', status: 'En camino', createdAt: '2026-08-01T09:30:00' },
  { id: 9002, customer: 'Andrés Moreno', merchant: 'Sushi Zen', driverAssigned: 'Diana Pérez', total: 67500, paymentMethod: 'Efectivo', status: 'Preparando', createdAt: '2026-08-01T10:00:00' },
  { id: 9003, customer: 'María Villa', merchant: 'La Pizzeta', driverAssigned: 'Mateo López', total: 31000, paymentMethod: 'Tarjeta', status: 'Entregado', createdAt: '2026-08-01T10:15:00' },
];
