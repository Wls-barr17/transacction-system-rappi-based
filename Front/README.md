# DomiFlow · Frontend

Frontend completo (React 18 + Vite + Tailwind 3 + TypeScript + estructura shadcn) de la plataforma de domicilios, con los 4 módulos:
Cliente, Comercio, Repartidor y Administrador.

## 1. Qué debes instalar (una sola vez)

- **Node.js 18 o superior** (recomendado la versión LTS): https://nodejs.org
- **VS Code** (opcional): https://code.visualstudio.com

Comprueba en una terminal: `node -v` y `npm -v`.

## 2. Correr el proyecto

```bash
cd domiflow-frontend
npm install
npm run dev
```

Abre http://localhost:5173

## 3. Cuentas de prueba (modo mock, contraseña `Demo1234`)

| Rol | Correo |
|---|---|
| Cliente | cliente@demo.com |
| Comercio | comercio@demo.com (Pizzería) · comercio2@demo.com · comercio3@demo.com |
| Repartidor | repartidor@demo.com · repartidor2@demo.com |
| Administrador | admin@demo.com |

Cupones: `BIENVENIDO10` (10%) y `PROMO5000` ($5.000 en compras desde $20.000).

### Recorrido para probar todo el flujo
1. **Cliente**: elige un comercio → agrega productos → carrito → checkout → pago (simulador) → **Aprobar**.
2. **Comercio** (otra ventana de incógnito): Pedidos → Aceptar → Iniciar preparación → Marcar listo.
3. **Repartidor**: Mis entregas → Tomar entrega → Recogida → En camino → Confirmar entrega.
4. **Cliente**: sigue el pedido y califica.
5. **Administrador**: revisa el panel, asigna repartidores, gestiona usuarios, empleados y comercios.

## 4. Backend simulado vs. backend real

Por defecto `.env` tiene `VITE_USE_MOCK=true`: todo se guarda en el `localStorage` del navegador
(archivo `src/lib/mockDb.js`) para que puedas probar sin servidor.

Cuando tengas tu API REST:
1. En `.env` pon `VITE_USE_MOCK=false`.
2. En `vite.config.js` ajusta el `target` del proxy (por defecto `http://localhost:8080`).
3. Tu API debe responder en las mismas rutas que usa el mock (`/api/auth/login`, `/api/auth/register`,
   `/api/merchants`, `/api/orders`, `/api/payments/simulate`, `/api/notifications`, …).
   El JWT se envía en `Authorization: Bearer <token>`. La lista completa de rutas está en `src/lib/mockDb.js`.
4. Los errores deben devolver `{ "message": "texto" }` con el status HTTP correspondiente
   (el stock agotado usa 409 con `{ "message": "...", "outOfStock": [{ "productId", "name", "available" }] }`).

Para reiniciar los datos de prueba: borra `domiflow_db_v1` en DevTools → Application → Local Storage.

## 5. TypeScript, shadcn y componentes de 21st.dev

- El proyecto ya está preparado para **TypeScript** (`tsconfig.json`, alias `@/` → `src/`) y para **shadcn**
  (`components.json`, tokens CSS en `src/index.css`, helper `cn` en `src/lib/utils.ts`, carpeta `src/components/ui`).
- Los archivos antiguos siguen en `.jsx`; los nuevos están en `.tsx`. Puedes migrar el resto poco a poco.
- Después de actualizar, vuelve a ejecutar `npm install` (hay dependencias nuevas: radix-ui, motion, tailwind-merge, etc.).
- `npm run typecheck` revisa los tipos (opcional; `npm run dev` y `npm run build` no lo necesitan).
- Para agregar más componentes shadcn: `npx shadcn@latest add dialog` (usará `src/components/ui`).

Componentes de 21st.dev integrados:

| Componente | Archivo | Dónde se usa |
|---|---|---|
| gradient-bar-hero-section | `components/ui/gradient-bar-hero-section.tsx` | Página de inicio (`/`) |
| sign-in | `components/ui/sign-in.tsx` | `/login` (`pages/auth/SignIn.tsx`) |
| footer-section | `components/ui/footer-section.tsx` | Inicio y toda la app (`layout/AppFooter.tsx`) |
| not-found (Empty + Avatar + Button) | `components/ui/not-found-page.tsx` | Rutas inexistentes (404) |
| calendar / animated-glowing-search-bar | `Calendar.jsx` / `GlowingSearchBar.jsx` | Versiones propias (aún no pegaste el código original) |

## 6. Estructura

```
src/
  lib/          constants (máquinas de estado), api, mockDb, utils
  context/      Auth, Cart, Toast, Notifications (polling 8 s)
  hooks/        useFetch (con polling opcional)
  components/
    ui/         AppButton (anti doble clic), shadcn button/avatar/empty, Input, StatusBadge, Calendar, GlowingSearchBar, Modal, ...
    layout/     AppShell, FooterSection, GradientBarHero
  pages/
    auth/ cliente/ comercio/ repartidor/ admin/ shared/
```

## 7. Requisitos de UX/UI cubiertos

- **Doble clic**: `Button` se deshabilita y muestra spinner mientras dura la acción.
- **Stock agotado en checkout**: el producto se resalta en rojo con icono y botón "Quitar del pedido"; no se puede confirmar hasta quitarlo.
- **Validación en tiempo real**: cupones, login, registro y formularios validan antes de enviar.
- **Estados del pedido/entrega**: `ORDER_TRANSITIONS` y `DELIVERY_TRANSITIONS` en `src/lib/constants.js`; la UI solo ofrece el siguiente paso válido (y el mock rechaza saltos inválidos con 409).
- **Repartidor**: máximo 2 clics por cambio de estado; no puede marcar ENTREGADA sin pasar por RECOGIDA.
- **Simulador de pagos**: botones verde (APROBADO), rojo (RECHAZADO), amarillo (PENDIENTE).
- **Accesibilidad**: estados con icono + texto (no solo color), colores con contraste ≥ 4.5:1, navegación con teclado, `aria-*`, enlace "Saltar al contenido", `prefers-reduced-motion`.
- **Testing**: atributos `data-testid` estables (ej. `confirm-order`, `pay-approved`, `cart-total`, `status-badge-ENTREGADO`).
