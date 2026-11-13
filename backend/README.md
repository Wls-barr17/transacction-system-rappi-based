# DomiFlow API · Spring Boot + Supabase

API REST para registro y sesión, catálogo, direcciones, stock, pedidos, pagos de demostración, gestión del comercio, entregas y vistas básicas del CRM. Los datos se guardan en Supabase PostgreSQL; no se necesita el cliente `service_role` de Supabase.

## Requisitos

- Java 17+
- Maven 3.8+
- Un proyecto de Supabase con acceso a PostgreSQL

## Preparar Supabase

1. En el SQL Editor de Supabase, ejecuta [`src/main/resources/db/schema.sql`](src/main/resources/db/schema.sql).
2. Crea una contraseña aleatoria de 32 bytes o más para firmar los JWT de la API. La API no publica contraseñas ni claves de Supabase.
3. Configura estas variables en la terminal o el entorno del servicio:

```text
SUPABASE_DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<database-password>
JWT_SECRET=<random-secret-at-least-32-bytes>
FRONTEND_ORIGIN=http://localhost:5173
```

Si usas el pooler de Supabase, copia la URL JDBC y el usuario que muestra el panel de conexión, y conserva `sslmode=require`.

## Iniciar

Desde `backend/`:

```bash
mvn spring-boot:run
```

La API escucha en `http://localhost:8080/api`. En `Front/.env`, configura `VITE_USE_MOCK=false`; Vite reenvía `/api` a Spring Boot. Para el primer acceso, registra una cuenta de cliente desde la interfaz. El rol de comercio, repartidor o administrador se asigna desde el CRM, una vez creada la primera cuenta administradora y promovida en SQL:

```sql
update app_users set role = 'ADMINISTRADOR' where email = 'tu-correo@ejemplo.com';
```

La cuenta debe volver a iniciar sesión para recibir un token con el rol actualizado.

## Rutas implementadas

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/profile`
- `GET /api/categories`, `GET /api/merchants`, `GET /api/merchants/{id}`
- `GET/POST/PUT/DELETE /api/addresses` (edición y borrado por identificador; propiedad verificada)
- `POST /api/cart/validate`, `GET /api/coupons/validate`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`, `PATCH /api/orders/{id}/status`
- `POST /api/payments/simulate`
- `/api/my/merchant`, `/api/my/products` para comercio
- `/api/deliveries`, `/api/courier/availability` y transiciones de entrega
- `/api/admin/stats`, usuarios, empleados, comercios y asignación de entregas
- `/api/notifications`

Los cambios de estado se verifican en el servidor. El stock se bloquea y vuelve a validar dentro de la transacción que crea el pedido. Los pagos son simulados y no cobran dinero.
