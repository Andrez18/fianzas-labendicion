# Préstamos La Bendición

Aplicación web para la gestión y consulta de préstamos de clientes del supermercado **La Bendición**. Permite al equipo administrativo registrar clientes, préstamos, abonos y comprobantes, mientras que cada cliente puede consultar el estado de su(s) préstamo(s) desde su propia cuenta.

Construida con **Next.js 16** (App Router) y **Supabase** (autenticación, base de datos y storage).

## Características

- **Panel administrativo** (`/admin`)
  - Listado y búsqueda de clientes
  - Registro y edición de clientes, préstamos y pagos
  - Carga de comprobantes/facturas por préstamo, con vista tipo lightbox
  - Gestión de administradores adicionales
- **Cuenta de cliente** (`/cuenta`)
  - Inicio de sesión independiente del panel admin, con sesión vía cookies `httpOnly`
  - Consulta de préstamos, abonos y saldo pendiente
- **Autenticación** con Supabase Auth (correo/contraseña), rutas protegidas por middleware
- **PWA (Progressive Web App)**
  - Instalable en Android/Chrome y iOS (Safari)
  - Botón flotante de instalación en la esquina inferior derecha (solo en celulares)
  - Página de fallback offline (`/offline`) y service worker
- Compresión de imágenes en el cliente antes de subir comprobantes
- UI con Tailwind CSS y componentes propios en `components/ui`

## Requisitos previos

- Node.js 20+
- pnpm (el proyecto usa `pnpm` como gestor de paquetes)
- Un proyecto de [Supabase](https://supabase.com) creado

## Configuración

1. Instala las dependencias:

   ```bash
   pnpm install
   ```

2. Crea un archivo `.env.local` (o `.env`) en la raíz con las siguientes variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: disponibles en el panel de Supabase, en *Project Settings → API*.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave de servicio (server-side), usada para operaciones administrativas. **No la expongas en el cliente.**

3. Ejecuta las migraciones SQL ubicadas en `scripts/`, en orden, sobre tu base de datos de Supabase (por ejemplo desde el SQL Editor de Supabase):

   ```
   scripts/001_supabase_schema.sql
   scripts/002_admin_management.sql
   scripts/003_fix_admins_rls_recursion.sql
   scripts/004_fix_admins_rls_recursion_final.sql
   scripts/005_payments.sql
   scripts/006_client_updated_at.sql
   ```

## Desarrollo

```bash
pnpm dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Scripts disponibles

| Comando        | Descripción                              |
| -------------- | ----------------------------------------- |
| `pnpm dev`     | Levanta el servidor de desarrollo         |
| `pnpm build`   | Genera el build de producción             |
| `pnpm start`   | Sirve el build de producción              |
| `pnpm lint`    | Corre ESLint sobre el proyecto            |

## Estructura del proyecto

```
app/
  admin/         Panel administrativo (protegido por middleware)
  auth/          Login, registro y callback de autenticación
  cuenta/        Vista de cuenta para clientes
  offline/       Página de fallback cuando no hay conexión
  actions.ts     Server actions
components/
  ui/            Componentes base de UI
  *.tsx          Componentes de negocio (clientes, préstamos, pagos, PWA, etc.)
lib/
  supabase/      Clientes de Supabase (browser, server, admin, middleware)
  client-session.ts   Manejo de sesión de clientes vía cookies httpOnly
  image-compression.ts Compresión de imágenes en el cliente
  types.ts       Tipos compartidos
scripts/         Migraciones SQL de la base de datos (Supabase)
public/          Assets estáticos, manifest.webmanifest, íconos, sw.js
middleware.ts    Protección de rutas /admin y manejo de sesión Supabase
```

## Autenticación y seguridad

- Las rutas bajo `/admin` están protegidas por `middleware.ts`, que valida la sesión de Supabase y redirige a `/auth/login` si no hay usuario autenticado.
- La verificación de si un usuario es administrador se hace mediante una función `SECURITY DEFINER` en la base de datos, evitando problemas de recursión en las políticas RLS.
- La sesión de los clientes (vista `/cuenta`) es independiente de la de los administradores y se maneja con cookies `httpOnly` (ver `lib/client-session.ts`).

## PWA

- El manifest se encuentra en `public/manifest.webmanifest` y el service worker en `public/sw.js`, registrado desde `components/pwa-register.tsx`.
- El botón de instalación (`components/pwa-install-button.tsx`) se muestra automáticamente en dispositivos móviles:
  - En Android/Chrome, dispara el prompt nativo de instalación (`beforeinstallprompt`).
  - En iOS, muestra instrucciones para agregar la app a la pantalla de inicio desde Safari.

## Despliegue

El proyecto está preparado para desplegarse en [Vercel](https://vercel.com), incluyendo integración con `@vercel/analytics`. Recuerda configurar las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en el panel del proyecto de Vercel.