# DomiFlow

Plataforma de domicilios para Bogotá con una interfaz para clientes, herramientas de operación para comercios y repartidores, y un CRM para administración. El frontend puede ejecutarse en modo demostración o conectarse al backend Spring Boot y Supabase PostgreSQL.

## Estructura del proyecto

```text
.
├── front/                    # Aplicación React + Vite
│   ├── components/           # Componentes de interfaz y layout
│   ├── context/              # Sesión, carrito, notificaciones y mensajes
│   ├── hooks/                # Hooks reutilizables
│   ├── lib/                  # API, datos demo, formato y constantes
│   ├── pages/                # Vistas por rol y autenticación
│   ├── services/             # Datos de las vistas de gestión
│   ├── types/                # Tipos compartidos
│   ├── App.jsx               # Rutas y control de acceso por rol
│   ├── main.jsx              # Entrada de React
│   └── styles.css            # Tailwind y estilos globales
├── backend/                  # API Spring Boot
│   ├── src/main/java/        # Controladores, seguridad y aplicación
│   ├── src/main/resources/   # Configuración y esquema Supabase
│   └── pom.xml
├── .gitignore
└── README.md
```

La carpeta `front/` organiza el código directamente por responsabilidad; no tiene una carpeta `src/`. Las instrucciones del proyecto están centralizadas en este archivo.

## Ejecutar el frontend

Requiere Node.js 18 o superior.

```powershell
cd front
npm install
npm run dev
```

Abre la dirección local que indique Vite, normalmente `http://localhost:5173`.

El modo de demostración usa datos locales y está activado por defecto. Las cuentas demo usan la contraseña `Demo1234`:

| Rol | Correo |
|---|---|
| Cliente | `cliente@demo.com` |
| Comercio | `comercio@demo.com`, `comercio2@demo.com`, `comercio3@demo.com` |
| Comercio demo de mercado/farmacia | `mercado@demo.com`, `farmacia@demo.com` |
| Repartidor | `repartidor@demo.com`, `repartidor2@demo.com` |
| Administrador | `admin@demo.com` |

Los comercios, calificaciones y tiempos del catálogo de demostración son ficticios. Cupones: `BIENVENIDO10` y `PROMO5000`.

## Ejecutar el backend con Supabase

Requiere Java 17, Maven y un proyecto Supabase con acceso a PostgreSQL.

1. Ejecuta [`backend/src/main/resources/db/schema.sql`](backend/src/main/resources/db/schema.sql) en el SQL Editor de Supabase.
2. Configura estas variables de entorno para Spring Boot:

   ```text
   SUPABASE_DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=<database-password>
   JWT_SECRET=<random-secret-of-at-least-32-bytes>
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   Para el pooler, usa la URL JDBC y el usuario que provee el panel de Supabase. Las credenciales se mantienen en el entorno del backend; no las pongas en Vite ni las subas al repositorio.

3. Inicia la API desde la raíz del repositorio:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

4. En otra terminal, copia `front/.env.example` a `front/.env` y establece `VITE_USE_MOCK=false`. El proxy de Vite dirige `/api` a Spring Boot en `http://localhost:8080`.
5. Registra una cuenta desde la interfaz. Para convertirla en la primera administradora, actualiza su rol en el SQL Editor y vuelve a iniciar sesión:

   ```sql
   update app_users set role = 'ADMINISTRADOR' where email = 'tu-correo@ejemplo.com';
   ```

Desde el CRM podrás crear comercios, usuarios y colaboradores. La API implementa registro y sesión con JWT, catálogo, direcciones, validación de carrito y stock, pedidos con transiciones, pagos simulados, operación de comercios, entregas y funciones principales del CRM.

## Comandos del frontend

Desde `front/`:

- `npm run dev`: inicia Vite.
- `npm run build`: genera el frontend de producción en `front/dist/`.
- `npm run preview`: sirve la compilación local.
- `npm run typecheck`: comprueba los archivos TypeScript.
