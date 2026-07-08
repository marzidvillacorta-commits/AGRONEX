# AgroNex

Aplicación PWA independiente para registrar y supervisar el avance diario de labores agrícolas por cuadrilla, sector y cultivo.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Instalación y desarrollo local

```powershell
npm install
npm.cmd run dev
```

Abre `http://localhost:3000`.

## Validación de producción

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

## Publicar en GitHub y Vercel

1. Crea un repositorio vacío en GitHub y publica el contenido de esta carpeta.
2. Importa el repositorio desde Vercel.
3. Mantén el preset **Next.js** y los comandos detectados automáticamente.
4. Configura `NEXT_PUBLIC_SITE_URL` con la URL HTTPS definitiva, sin `/` al final.
5. Ejecuta el despliegue.

También puedes publicar desde la terminal:

```powershell
npx vercel --prod
```

## Publicar en Netlify

Importa el repositorio, selecciona Next.js y usa `npm run build` como comando de compilación. Configura `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS definitivo.

## Probar la PWA en celular

1. Publica la aplicación en una URL HTTPS.
2. Abre la URL desde el celular.
3. En Android con Chrome, usa **Instalar aplicación** o el botón **Instalar** de AgroNex.
4. En iPhone con Safari, pulsa **Compartir** y luego **Agregar a inicio**.
5. Abre AgroNex desde el icono creado y confirma que se muestre sin la interfaz del navegador.

## Acceso administrativo inicial

Contraseña temporal: `admin123`

Esta contraseña se conserva solo durante la sesión del navegador. Antes de usar AgroNex en producción debe reemplazarse por Supabase Auth y control de roles en la base de datos.
