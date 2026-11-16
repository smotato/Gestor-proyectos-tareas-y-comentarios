# Gestor de proyectos

Aplicación web para que un equipo de clase reparta el trabajo y vea quién
hace qué. Cada proyecto tiene miembros con roles, tareas asignadas con
estado y prioridad, comentarios y un registro de actividad.

Proyecto del curso de Desarrollo Web.
Autor: Sergio Stiven Motato

## Funcionalidades

- Crear proyectos e invitar miembros con un código.
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

| Comando              | Qué hace                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run dev`        | Levanta la app en modo desarrollo                                        |
| `npm run build`      | Compila para producción                                                  |
| `npm run emuladores` | Levanta Auth y Firestore locales                                         |
| `npm run test`       | Corre las pruebas con cobertura                                          |
| `npm run check`      | Tipos + lint + formato + pruebas. Tiene que pasar antes de subir cambios |

## Estructura

```text
src/
├── app/            páginas y rutas de la API (app/api/**)
├── components/     componentes reutilizables
├── hooks/          hooks propios
├── schemas/        esquemas Zod (cliente y servidor)
├── services/       reglas de negocio
├── repositories/   acceso a Firestore
└── lib/            Firebase, autenticación, errores
docs/               especificación del proyecto
ia/                 configuración y evidencias del uso de IA
```

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
- En desarrollo uso los emuladores, así que no tengo claves reales en el disco.

## Uso de IA

Usé Claude Code con una configuración propia que no le deja leer secretos ni
salir de la carpeta del proyecto. Los detalles, las pruebas de que las
restricciones funcionan y la bitácora están en la carpeta [`ia/`](ia/IA.md).
