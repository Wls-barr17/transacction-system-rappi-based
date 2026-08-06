export type AppTab = 'dashboard' | 'comercios' | 'productos' | 'promociones' | 'repartidores' | 'pedidos';

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface Commerce {
  id: number;
  name: string;
  category: string;
  city: string;
  agreementStatus: 'Activo' | 'Inactivo';
  status: 'Activo' | 'Inactivo';
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  commerce: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
}

export interface Promocion {
  id: number;
  code: string;
  discount: number;
  discountType: '%' | '$';
  startDate: string;
  endDate: string;
  usageLimit: number;
  minOrderValue: number;
  active: boolean;
}

export interface Repartidor {
  id: number;
  name: string;
  phone: string;
  vehicle: 'Moto' | 'Bici';
  status: 'Disponible' | 'En entrega' | 'Inactivo';
  zone: string;
  rating: number;
  currentOrder: string;
}

export interface Order {
  id: number;
  customer: string;
  merchant: string;
  driverAssigned: string;
  total: number;
  paymentMethod: string;
  status: 'Creado' | 'Preparando' | 'En camino' | 'Entregado' | 'Cancelado';
  createdAt: string;
}
