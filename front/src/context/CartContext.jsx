import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

const EMPTY = { merchant: null, items: [], coupon: null };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || EMPTY; } catch { return EMPTY; }
  });
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);

  const lineOf = (p) => ({ productId: p.id, name: p.name, price: p.price, emoji: p.emoji, stock: p.stock, qty: 1 });
  const merchantOf = (m) => ({ id: m.id, name: m.name, deliveryFee: m.deliveryFee });

  const add = (merchant, product) => {
    if (cart.merchant && cart.merchant.id !== merchant.id && cart.items.length) {
      const ok = window.confirm(`Tu carrito tiene productos de ${cart.merchant.name}. ¿Quieres vaciarlo y empezar con ${merchant.name}?`);
      if (!ok) return false;
      setCart({ merchant: merchantOf(merchant), items: [lineOf(product)], coupon: null });
      return true;
    }
    setCart((c) => {
      const exists = c.items.find((i) => i.productId === product.id);
      const items = exists
        ? c.items.map((i) => (i.productId === product.id ? { ...i, qty: Math.min(i.qty + 1, product.stock), stock: product.stock } : i))
        : [...c.items, lineOf(product)];
      return { ...c, merchant: merchantOf(merchant), items };
    });
    return true;
  };

  const setQty = (id, qty) =>
    setCart((c) => ({
      ...c,
      items: qty <= 0 ? c.items.filter((i) => i.productId !== id) : c.items.map((i) => (i.productId === id ? { ...i, qty: Math.min(qty, i.stock ?? 99) } : i)),
    }));
  const remove = (id) => setQty(id, 0);
  const clear = () => setCart(EMPTY);
  const setCoupon = (coupon) => setCart((c) => ({ ...c, coupon }));

  // Cálculo en cliente (el servidor lo vuelve a calcular al crear el pedido)
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const cp = cart.coupon;
  const discount = !cp || subtotal < (cp.min || 0) ? 0 : cp.type === 'pct' ? Math.round((subtotal * cp.value) / 100) : Math.min(cp.value, subtotal);
  const fee = cart.items.length ? cart.merchant?.deliveryFee || 0 : 0;
  const total = Math.max(0, subtotal - discount) + fee;
  const count = cart.items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ cart, add, setQty, remove, clear, setCoupon, subtotal, discount, fee, total, count }}>{children}</Ctx.Provider>;
}
