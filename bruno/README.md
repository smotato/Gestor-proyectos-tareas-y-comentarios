# Colección de Bruno

Peticiones para probar la API a mano. Cada ruta principal (proyectos, miembros,
tareas, comentarios, invitaciones y actividad) tiene un caso exitoso, un `400`, un
`401` y un `403` o `404`. La documentación completa de la API está en
`openapi.yaml`.

## Antes de empezar

1. Levanta los emuladores y la app, cada uno en su terminal:

   ```bash
   npm run emuladores
   npm run dev
   ```

2. En Bruno: **Open Collection** y elige la carpeta `bruno/`. Selecciona el
   entorno **local** (`baseUrl = http://localhost:3000`).

3. Consigue un `idToken` del emulador de Auth. Crea una cuenta de prueba (si ya
   existe, usa `accounts:signInWithPassword` en lugar de `accounts:signUp`):

   ```bash
   curl -s -X POST \
     "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=clave-de-prueba" \
     -H "Content-Type: application/json" \
     -d '{"email":"bruno@ejemplo.com","password":"una-clave-de-prueba","returnSecureToken":true}'
   ```

   Copia el campo `idToken` de la respuesta en la variable **secreta** `idToken`
   del entorno. No se guarda en Git. Caduca a la hora, y «Iniciar sesión» exige
   uno de hace menos de 5 minutos: si falla con `401`, pide uno nuevo.

## Cómo ejecutarla

Corre las carpetas en orden con el **Runner** (están numeradas). Las primeras
peticiones dejan listas las variables que usan las demás:

| Variable     | La llena                 | La usan                       |
| ------------ | ------------------------ | ----------------------------- |
| `uid`        | `Quién soy`              | `Miembros`                    |
| `proyectoId` | `Crear proyecto`         | todas las carpetas siguientes |
| `tareaId`    | `Crear tarea`            | `Tareas` y `Comentarios`      |
| `codigo`     | `Generar una invitación` | `Invitaciones` (aceptar)      |

Todas las peticiones se autentican con `Authorization: Bearer {{idToken}}`, que la
API acepta además de la cookie de sesión. Las que modifican datos envían
`Origin: {{baseUrl}}` (la API rechaza con `403` un `Origin` de otro sitio).

## Lo que no cubre

- **`403` por rol** y **`200` al aceptar una invitación** necesitan una segunda
  cuenta (un editor o un lector, y quien acepta): repite los pasos de arriba con
  otro correo y cambia el `idToken` del entorno. Con otra cuenta también puedes
  comprobar `410` creando una invitación y esperando a que venza.
- **`DELETE /api/auth/sesion`** no está en la colección a propósito: revoca los
  tokens del usuario y el resto de las peticiones dejarían de funcionar.

## Si una petición «sin sesión» no devuelve 401

Bruno guarda las cookies. Si guardó la cookie `sesion` de «Iniciar sesión», borra
las cookies de la colección y vuelve a correr la petición.
