# AgroNex

Aplicación PWA independiente para registrar y supervisar el avance diario de labores agrícolas por cuadrilla, sector y cultivo.

## Flujos disponibles

- Encargado de labor: selecciona su usuario, revisa su tarea y cuadrilla, registra avance total e individual y consulta su rendimiento.
- Supervisor general: accede tocando el logo AgroNex, revisa toda la operación, planifica tareas y gestiona encargados, cuadrillas, trabajadores, sectores y configuración.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Instalar dependencias

```powershell
npm install
```

## Correr localmente

```powershell
npm.cmd run dev
```

Abre `http://localhost:3000`.

## Validar producción

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

## Publicar en Vercel

1. Crea un repositorio vacío en GitHub y publica el contenido de esta carpeta.
2. Importa el repositorio desde Vercel.
3. Mantén el preset Next.js y los comandos detectados automáticamente.
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
3. En Android con Chrome, usa Instalar aplicación o el botón Instalar de AgroNex.
4. En iPhone con Safari, pulsa Compartir y luego Agregar a inicio.
5. Abre AgroNex desde el icono creado y confirma que se muestre sin la interfaz del navegador.

## Probar trabajo sin internet

1. Ejecuta `npm.cmd run build`.
2. Publica AgroNex en HTTPS o corre la versión local.
3. Abre AgroNex con internet.
4. Instala la PWA.
5. Navega por las pantallas principales una vez.
6. Activa modo avión.
7. Abre AgroNex desde el icono instalado.
8. Registra avance o guarda una tarea.
9. Desactiva modo avión.
10. Verifica la pantalla Sincronización en el panel del Supervisor general.

### Android

- Usa Chrome.
- Instala AgroNex desde el aviso del navegador o desde el botón Instalar.
- Después de cargar las pantallas principales, activa modo avión y abre la app desde el icono instalado.
- Guarda un avance y revisa que aparezca como pendiente en Sincronización.

### iPhone

- Usa Safari.
- Pulsa Compartir y luego Agregar a inicio.
- Abre AgroNex desde el icono creado.
- Activa modo avión, guarda un avance y vuelve a activar internet para revisar la sincronización simulada.

## Acceso inicial del Supervisor general

Contraseña temporal: `admin123`

Esta contraseña se conserva solo durante la sesión del navegador. Antes de usar AgroNex en producción debe reemplazarse por Supabase Auth y control de roles en la base de datos.

