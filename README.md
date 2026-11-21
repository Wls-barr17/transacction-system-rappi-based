# DomiFlow — domicilios para Bogotá

DomiFlow reúne una experiencia de compra para clientes, operación para comercios y repartidores y un CRM para administración. La interfaz usa una identidad cálida y propia, con referencias a Chapinero, Usaquén y Cedritos. Los comercios del modo demostración son ficticios.

## Arquitectura..


```text
.
├── front/                                  # React 18 + Vite: aplicación web, sin carpeta src/
│   ├── components/                         # Componentes compartidos y sistema visual
│   ├── context/                            # Sesión, carrito, notificaciones y toast
│   ├── hooks/                              # Hooks de interfaz
│   ├── lib/                                # Cliente API, mapas, formatos y datos demo
│   ├── pages/                              # Vistas de cliente, comercio, reparto y CRM
│   ├── services/                           # Servicios de datos de interfaz
│   ├── types/                              # Tipos compartidos
│   ├── App.jsx                             # Rutas y permisos por rol
│   └── styles.css                          # Estilos globales y tokens visuales
├── backend/                                # API REST Spring Boot 3 + Java 17
│   ├── src/main/java/co/domiflow/api/
│   │   ├── controller/                     # Auth, direcciones, catálogo y pedidos
│   │   ├── service/                        # Reglas de negocio y transacciones
│   │   ├── security/                       # JWT, filtro y política de acceso
│   │   ├── MarketplaceController.java      # CRM, comercios, notificaciones y entregas
│   │   └── ApiErrors.java                  # Errores HTTP consistentes
│   ├── src/main/resources/db/schema.sql    # Esquema PostgreSQL para Supabase
│   └── pom.xml
├── diagrama-clases-dao.puml                 # Clases de dominio, DAO y multiplicidades
├── diagrama-componentes.puml                # Capas y dependencias de la arquitectura
├── .gitignore                              # Ignora secretos locales y artefactos
└── README.md
```

Las credenciales locales van en `front/.env` y `backend/.env`. Los archivos `.env.example` documentan sus nombres; nunca guardes secretos reales en Git.

## Modelo de datos PostgreSQL

El esquema inicial cubre identidad, direcciones, comercios, horarios, catálogo, inventario, promociones, cupones, pedidos, pagos, entregas, notificaciones y calificaciones. Incluye claves foráneas, restricciones, índices, funciones, triggers y vistas. Las fotos se guardan como URL HTTPS en `app_users.avatar_url`, `merchants.image_url` y `products.image_url`; el almacenamiento de imágenes no requiere una API de catálogo externa.

El [diagrama UML de clases y DAO](diagrama-clases-dao.puml) muestra atributos, operaciones de persistencia y multiplicidades entre entidades, con composición para relaciones dueño-detalle como pedido e ítems. El [diagrama de componentes](diagrama-componentes.puml) presenta la arquitectura por capas. Los DAO del primer diagrama representan la separación recomendada: actualmente los servicios ejecutan consultas mediante `JdbcTemplate`.

El SQL de `backend/src/main/resources/db/schema.sql` es la fuente canónica. Su copia en `supabase-import/00_schema_supabase.sql` está destinada al SQL Editor de Supabase. `supabase-import/01_upgrade_existing.sql` solo actualiza el esquema PostgreSQL anterior de DomiFlow y conserva sus filas; no convierte el DDL MySQL de `rappi.db`.

## Requisitos

- Node.js 18 o posterior y npm.
- Java 17 y Maven.
- Proyecto Supabase con acceso a su base PostgreSQL.

## Modo demostración opcional

Desde `front/`:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

El modo demo usa datos guardados en el navegador y **no llama al backend ni escribe en Supabase**. Para activarlo manualmente, configura `VITE_USE_MOCK=true` en `front/.env`. Para el flujo normal conectado al backend, conserva `VITE_USE_MOCK=false` (valor del `.env.example`). Los usuarios y comercios de esta sección solo existen en el modo demo. Contraseña de demostración: `Demo1234`.

| Rol | Correos disponibles |
|---|---|
| Cliente | `cliente@demo.com` |
| Comercio | `comercio@demo.com`, `comercio2@demo.com`, `comercio3@demo.com`, `mercado@demo.com`, `farmacia@demo.com` |
| Repartidor | `repartidor@demo.com`, `repartidor2@demo.com` |
| Administrador / CRM | `admin@demo.com` |

Cupones de demostración: `BIENVENIDO10` y `PROMO5000`.

## Conectar Supabase y ejecutar el backend

1. `rappi.db` era un script DDL de MySQL sin registros de pedidos ni usuarios. Para un proyecto Supabase nuevo, ejecuta [`supabase-import/00_schema_supabase.sql`](supabase-import/00_schema_supabase.sql) desde **SQL Editor**. Si ya existe la base anterior de DomiFlow y quieres conservar datos, haz un backup y ejecuta [`supabase-import/01_upgrade_existing.sql`](supabase-import/01_upgrade_existing.sql) en su lugar. No ejecutes ambos.
2. Ejecuta [`supabase-import/02_media_and_demo_seed.sql`](supabase-import/02_media_and_demo_seed.sql) después del esquema o de la migración. Agrega campos de fotos y crea datos ficticios idempotentes: 20 restaurantes, 4 mercados, 4 droguerías, 10 productos por comercio, inventario, horarios, cupones, perfiles de demo y una dirección inicial de cliente. No importes también los CSV de promociones si corres este seed; los códigos ya se crean aquí. Los comercios son ficticios y no representan establecimientos reales.
3. Desde la carpeta `backend/`, crea el archivo local de configuración:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edita `backend/.env` con los datos de **Session pooler** del panel Supabase. Usa el usuario y puerto exactos que muestra el panel:

   ```dotenv
   SUPABASE_DB_URL=jdbc:postgresql://HOST_DEL_SESSION_POOLER:5432/postgres?sslmode=require
   SUPABASE_DB_USER=USUARIO_DEL_SESSION_POOLER
   SUPABASE_DB_PASSWORD=la_contrasena_de_base_de_datos
   JWT_SECRET=un_secreto_aleatorio_largo_de_al_menos_32_bytes
   JWT_EXPIRATION_HOURS=12
   DB_POOL_SIZE=5
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   `SUPABASE_DB_PASSWORD` es la contraseña de PostgreSQL, no una API key. Si la URL JDBC lleva `?user=...&password=...`, elimina esos parámetros y utiliza las variables separadas mostradas arriba.

5. En una terminal, desde `backend/`, inicia Spring Boot:

   ```powershell
   mvn spring-boot:run
   ```

   La API queda en `http://localhost:8080`; la configuración carga automáticamente el `backend/.env`.

6. En otra terminal, desde `front/`, edita `front/.env`:

   ```dotenv
   VITE_USE_MOCK=false
   VITE_API_URL=/api
   VITE_GOOGLE_MAPS_API_KEY=
   ```

   Vite reenvía las llamadas `/api` a Spring Boot en `localhost:8080`. Reinicia Vite después de cambiar variables `VITE_*`.

7. Puedes usar las cuentas del seed para entrar en cada panel:

   | Rol | Correo | Contraseña |
   |---|---|---|
   | Cliente | `cliente.demo@domiflow.test` | `DomiDemo2026!` |
   | Administrador / CRM | `admin.demo@domiflow.test` | `DomiDemo2026!` |
   | Domiciliario | `domiciliario.demo@domiflow.test` | `DomiDemo2026!` |
   | Comercio ejemplo R01 | `comercio.r01@domiflow.test` | `DomiDemo2026!` |

   Los otros propietarios usan `comercio.r02@domiflow.test` hasta `comercio.r20@domiflow.test`, `comercio.m01`–`m04` y `comercio.d01`–`d04`, con el mismo dominio y contraseña. Son cuentas compartidas para desarrollo; cambia o elimina todas antes de publicar la aplicación.

El cliente usa `/cliente`, el administrador `/admin`, el domiciliario `/repartidor` y los propietarios `/comercio`; después del login la app dirige cada rol a su panel. El login solo muestra correo y contraseña. Para probar pagos, crea el pedido como cliente y continúa al checkout Sandbox de Wompi; cada intento y su confirmación se guardan en `payment_attempts` y `payments`.

## Dónde configurar las claves

### Supabase

Los datos de conexión van únicamente en [`backend/.env`](backend/.env.example), que se crea copiando el ejemplo. La API utiliza `SUPABASE_DB_URL`, `SUPABASE_DB_USER` y `SUPABASE_DB_PASSWORD` para abrir la conexión PostgreSQL. No pongas la contraseña de base de datos, `service_role` ni secretos en `front/.env`, en React o en este README. La aplicación no necesita una clave Supabase anon/public para su conexión JDBC.

### Google Maps

La clave del navegador va en `front/.env`, en `VITE_GOOGLE_MAPS_API_KEY`. Reinicia Vite al cambiarla. En Google Cloud habilita facturación, **Maps JavaScript API** y **Places API (New)**. En restricciones HTTP agrega `http://localhost:5173/*` y limita la clave a esas APIs. La dirección también ofrece ubicación del dispositivo por geolocalización del navegador y permite escribir manualmente; el GPS necesita permiso del navegador. Al seleccionar una dirección con Maps o guardar coordenadas GPS, el perfil y checkout muestran el mapa centrado en el punto exacto de entrega. Las claves `VITE_*` son visibles en el navegador, por eso deben estar restringidas. Consulta la [guía oficial del widget Places](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new) y la [configuración de facturación de Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/usage-and-billing).

No envíes tus claves en el chat: configúralas directamente en esos archivos locales. Los `.env` están ignorados por Git.

### Wompi

El checkout del proyecto está preparado para Wompi **Sandbox**. Crea/activa tu comercio en el [dashboard de Wompi](https://comercios.wompi.co/) y selecciona el ambiente de pruebas. Copia las llaves de prueba con prefijos `pub_test_`, `test_integrity_` y `test_events_` en `backend/.env` usando los nombres que ya están allí. El checkout web no necesita la llave privada `prv_test_`; no pongas secretos de integridad/eventos ni llaves privadas en el frontend. Los prefijos y ambientes se describen en la [documentación oficial](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/).

El flujo ya implementado funciona así: Spring crea un intento único, toma el valor autoritativo del pedido, lo convierte a centavos y crea la firma SHA-256; React redirige al formulario oficial de Wompi Checkout. Wompi notifica el resultado a `POST /api/webhooks/wompi`; Spring valida el checksum del evento y solo entonces actualiza `orders`, `payments` y `payment_attempts`. La URL de retorno solo muestra el estado y no se usa como prueba de pago. Ver [Checkout Web](https://docs.wompi.co/docs/colombia/widget-checkout-web/) y [validación de webhooks](https://docs.wompi.co/docs/colombia/eventos/).

Para recibir webhooks cuando desarrollas en local, publica temporalmente el puerto `8080` mediante un túnel HTTPS (por ejemplo, ngrok o Cloudflare Tunnel) y configura en el dashboard de Sandbox la URL pública terminada en `/api/webhooks/wompi`. El túnel debe estar activo durante la prueba. Usa los [datos oficiales de prueba de Sandbox](https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/). En la cuenta, habilita los medios de pago que quieres probar.

Sandbox permite hacer transacciones de prueba sin mover dinero. La integración/uso no significa que los pagos reales sean gratis: Wompi publica para el Plan Avanzado una tarifa de **2,65% + $700 COP + IVA por transacción exitosa**; el IVA se aplica sobre la comisión. El Plan Gateway no cobra comisión de Wompi, pero requiere negociar las tarifas con el medio de pago/Bancolombia. Confirma el plan y las tarifas vigentes directamente con [Wompi](https://soporte.wompi.co/hc/es-419/articles/360020957133--Cu%C3%A1les-son-los-planes-y-tarifas-que-maneja-la-plataforma-Wompi).

## Funciones incluidas en la API

- Registro, inicio de sesión y perfil con JWT y contraseñas BCrypt.
- Control de permisos y propiedad de registros; se valida la cuenta activa y el rol vigente contra la base de datos en las peticiones autenticadas.
- Catálogo público, detalle de comercios, productos y validación de cupones.
- Direcciones propias con barrio/localidad y coordenadas de Maps; el perfil y el checkout muestran el mapa centrado en la dirección de entrega seleccionada.
- Creación transaccional de pedidos, comprobación y bloqueo de inventario, snapshots de productos, checkout Wompi Sandbox con firma y webhook verificado, historial, seguimiento y calificaciones.
- Operación de comercios, productos, categorías, repartos, disponibilidad de repartidores y notificaciones.
- Cupones y promociones consultados desde tablas relacionadas; la redención queda asociada al pedido y respeta vigencia, comercio opcional y límite de usos.
- Endpoints de CRM para indicadores, cuentas, empleados, comercios y asignación de entregas.

La configuración incluida solo admite Sandbox y no procesa dinero real. Antes de habilitar producción hay que revisar credenciales, HTTPS, URL de eventos, CORS, políticas de reembolsos y conciliación.

## Comandos útiles

Desde `front/`:

- `npm run dev`: servidor local de desarrollo.
- `npm run build`: compilación de producción en `front/dist/`.
- `npm run preview`: vista previa de la compilación.
- `npm run typecheck`: verificación TypeScript.

Desde `backend/`:

- `mvn spring-boot:run`: iniciar API local.
- `mvn package`: empaquetar la aplicación.

## API principal

Todas las rutas llevan el prefijo `/api`. Las rutas protegidas reciben `Authorization: Bearer <token>`.

| Dominio | Rutas representativas |
|---|---|
| Sesión | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me` |
| Catálogo | `GET /categories`, `GET /merchants`, `GET /merchants/{id}`, `POST /cart/validate` |
| Direcciones | `GET/POST /addresses`, `PUT/DELETE /addresses/{id}` |
| Pedidos y pagos | `GET/POST /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status`, `POST /orders/{id}/payments/wompi/session`, `GET /payments/provider`, `POST /webhooks/wompi`, `POST /orders/{id}/rating` |
| Comercio | `/my/merchant`, `/my/products`, `/my/categories`, `GET /orders`, `PATCH /orders/{id}/status` |
| Reparto | `GET /deliveries`, `POST /deliveries/{id}/take`, `PATCH /deliveries/{id}/status` |
| CRM | `/admin/stats`, `/admin/users`, `/admin/merchants`, `/admin/employees`, `/admin/deliveries`, `/admin/payments` |

El estado de la API se consulta en `GET /actuator/health` (ruta pública, sin detalles internos).
