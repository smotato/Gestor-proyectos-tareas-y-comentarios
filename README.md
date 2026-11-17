# Gestor de proyectos

Aplicación web para que un equipo de clase reparta el trabajo y vea quién
hace qué. Cada proyecto tiene miembros con roles, tareas asignadas con
estado y prioridad, comentarios y un registro de actividad.

Proyecto del curso de Desarrollo Web.
Autor: Sergio Stiven Motato

## Funcionalidades

- Crear proyectos e invitar miembros con un código (vence a los 7 días).
- Roles por proyecto: propietario, editor y lector.
- Tareas con responsable, prioridad, fecha límite y estado.
- Comentarios en las tareas.
- Registro de actividad del proyecto.
- Filtros por estado y responsable, y vista de "mis tareas".

## Tecnologías

| Parte          | Tecnología                                               |
| -------------- | -------------------------------------------------------- |
| Frontend y API | Next.js 16 (App Router), React 19, TypeScript            |
| Autenticación  | Firebase Auth (correo y contraseña) + cookie de sesión   |
| Base de datos  | Firestore, solo desde el servidor con Firebase Admin SDK |
| Validación     | Zod                                                      |
| Pruebas        | Vitest + React Testing Library                           |
| Despliegue     | Vercel                                                   |

## Requisitos

- Node 24 (el proyecto trae `.nvmrc`)
- Java 21 (lo necesitan los emuladores de Firebase)
- En Windows: WSL2 con Ubuntu

## Cómo ejecutarlo

1. Instalar dependencias:

   ```bash
   npm ci
   ```

2. Crear el archivo `.env.local` copiando `.env.example`. Para trabajar en
   local con los emuladores no hacen falta valores reales.

3. En una terminal, levantar los emuladores de Firebase:

   ```bash
   npm run emuladores
   ```

4. En otra terminal, levantar la app:

   ```bash
   npm run dev
   ```

5. Abrir http://localhost:3000

## Scripts

| Comando                | Qué hace                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `npm run dev`          | Levanta la app en modo desarrollo                                        |
| `npm run build`        | Compila para producción                                                  |
| `npm run start`        | Sirve la compilación de producción (después de `build`)                  |
| `npm run emuladores`   | Levanta Auth y Firestore locales                                         |
| `npm run test`         | Corre las pruebas con cobertura                                          |
| `npm run typecheck`    | Revisa los tipos con TypeScript                                          |
| `npm run lint`         | Revisa el código con ESLint, sin advertencias                            |
| `npm run format`       | Da formato a todo el proyecto con Prettier                               |
| `npm run format:check` | Comprueba el formato sin cambiar nada                                    |
| `npm run check`        | Tipos + lint + formato + pruebas. Tiene que pasar antes de subir cambios |

## Documentación de la API

- **`openapi.yaml`** (en la raíz) describe todas las rutas de `src/app/api` en
  OpenAPI 3.1: parámetros, cuerpos, respuestas de éxito y de error (`400`,
  `401`, `403`, `404`, `409`, `410`, `429`) y esquemas. Todo error tiene la forma
  `{ "error": "mensaje", "detalles"?: [{ "campo", "mensaje" }] }`. Puedes
  abrirlo en cualquier visor de OpenAPI.
- **`bruno/`** es una colección de [Bruno](https://www.usebruno.com/) para
  probar la API a mano. Por cada ruta principal trae un caso exitoso, un `400`,
  un `401` y un `403` o `404`.

Para usar la colección:

1. Levanta los emuladores y la app (`npm run emuladores` y `npm run dev`).
2. En Bruno elige **Open Collection** y selecciona la carpeta `bruno/`; luego
   el entorno **local** (`baseUrl` es `http://localhost:3000`).
3. Pon en la variable secreta `idToken` un token del emulador de Auth. En
   [`bruno/README.md`](bruno/README.md) está el comando para conseguirlo.
4. Corre las carpetas en orden con el **Runner**: las primeras peticiones
   guardan el id del proyecto, de la tarea y el código de invitación que usan
   las demás.

## Integración continua

El flujo `.github/workflows/ci.yml` se ejecuta en cada `push` y `pull request`
a `main`, con Node 24: instala con `npm ci`, corre `npm run check`, compila con
`npm run build` y audita con `npm audit --audit-level=high`. No necesita
secretos: las pruebas simulan Firebase y la compilación no se conecta a él.

## Estructura

```text
src/
├── app/            páginas y rutas de la API (app/api/**)
├── components/     componentes reutilizables
├── hooks/          hooks propios
├── schemas/        esquemas Zod (cliente y servidor)
├── services/       reglas de negocio
├── repositories/   acceso a Firestore
└── lib/            Firebase, autenticación, errores, límite de frecuencia
tests/              pruebas (Vitest)
bruno/              colección de Bruno para probar la API
openapi.yaml        documentación de la API
docs/               especificación del proyecto
ia/                 configuración y evidencias del uso de IA
.github/workflows/  integración continua
```

## Despliegue en Vercel

### 1. Firebase

1. Crea un proyecto de Firebase y habilita **Authentication → Email/Password**.
2. Crea Firestore en **modo producción**. Las reglas del proyecto
   (`firestore.rules`) niegan todo: solo el servidor entra con el Admin SDK.
3. Publica las reglas y los índices con la CLI de Firebase. Los índices son
   necesarios: sin ellos fallan las consultas de proyectos y de tareas.

   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes --project <id-del-proyecto>
   ```

4. En **Configuración del proyecto → Cuentas de servicio** genera una clave
   privada. De ese archivo salen los valores del servidor (abajo). No lo subas
   a Git ni lo pegues en ningún chat.

### 2. Vercel

1. Importa el repositorio en Vercel: detecta Next.js y usa `npm run build`.
2. En **Settings → General** elige Node.js 24.x.
3. En **Settings → Environment Variables** agrega las variables de la tabla
   (Production y Preview) y vuelve a desplegar.
4. Despliega desde la interfaz de Vercel, o desde tu máquina con
   `vercel deploy --prod`.

### Variables de entorno

Solo los nombres; los valores van en Vercel y en tu `.env.local`, nunca en Git.

| Variable                           | Dónde se usa  | Notas                                                              |
| ---------------------------------- | ------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | Navegador     | Configuración web de Firebase (es pública por diseño)              |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Navegador     | Configuración web de Firebase                                      |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | Navegador     | Configuración web de Firebase                                      |
| `NEXT_PUBLIC_FIREBASE_APP_ID`      | Navegador     | Configuración web de Firebase                                      |
| `FIREBASE_PROJECT_ID`              | Solo servidor | De la cuenta de servicio                                           |
| `FIREBASE_CLIENT_EMAIL`            | Solo servidor | De la cuenta de servicio                                           |
| `FIREBASE_PRIVATE_KEY`             | Solo servidor | De la cuenta de servicio; en Vercel con `\n` literales             |
| `SITE_URL`                         | Solo servidor | Opcional: tu dominio propio, para Open Graph, `robots` y `sitemap` |

Estas variables son solo para desarrollo con emuladores y **no deben existir en
producción**: `NEXT_PUBLIC_USAR_EMULADORES`, `FIREBASE_AUTH_EMULATOR_HOST` y
`FIRESTORE_EMULATOR_HOST`.

Si no defines `SITE_URL`, el sitio usa el dominio de producción que Vercel ya
expone (`VERCEL_PROJECT_PRODUCTION_URL`).

### 3. Comprobar el despliegue

- `GET /api/auth/yo` sin sesión responde `401`.
- Crea una cuenta en `/registro`, inicia sesión y abre `/proyectos`.
- `/robots.txt` y `/sitemap.xml` muestran tu dominio.

## Dependencias y por qué las uso

| Paquete                              | Para qué                                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| `firebase`                           | Inicio de sesión en el navegador                                 |
| `firebase-admin`                     | Acceso a Firestore y verificación de sesión en el servidor       |
| `zod`                                | Validar datos en el formulario y en la API con las mismas reglas |
| `vitest`, `@vitest/coverage-v8`      | Pruebas y cobertura                                              |
| `@testing-library/*`, `jsdom`        | Probar componentes como lo haría un usuario                      |
| `prettier`, `eslint-config-prettier` | Formato automático del código                                    |
| `husky`, `lint-staged`               | Revisar el código antes de cada commit y push                    |
| `firebase-tools`                     | Emuladores de Firebase para no usar datos reales en desarrollo   |

npm bloquea por defecto los scripts de instalación. Revisé y aprobé solo los
de `@firebase/util` y `protobufjs`, que son paquetes conocidos que usa Firebase.

## Seguridad

- Ningún secreto se sube a Git (`.env*` está en `.gitignore`).
- Las reglas de Firestore niegan todo: el navegador nunca habla con la base
  de datos, todo pasa por la API.
- La sesión es una cookie `HttpOnly`; las peticiones que modifican datos
  comprueban el `Origin` y el `uid` sale siempre de la sesión.
- La API limita la frecuencia por IP y ruta (`429` con `Retry-After`) y envía
  cabeceras de seguridad (`Content-Security-Policy`, `X-Content-Type-Options`,
  `Referrer-Policy`).
- En desarrollo uso los emuladores, así que no tengo claves reales en el disco.

## Uso de IA

Usé Claude Code con una configuración propia que no le deja leer secretos ni
salir de la carpeta del proyecto. Los detalles, las pruebas de que las
restricciones funcionan y la bitácora están en la carpeta [`ia/`](ia/IA.md).
