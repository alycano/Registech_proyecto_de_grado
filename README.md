# Registech - Proyecto de Grado

**Proyecto de Grado: Análisis y Desarrollo de Software**

Sistema web para el inventario y la gestión de equipos de TI de la empresa Registech. El sistema permite administrar usuarios, áreas, equipos tecnológicos, préstamos y reportes de fallas a través de un panel de control basado en roles.

Actualmente el proyecto cuenta con la base funcional para integrar en el futuro módulos adicionales como Ventas, Almacén y Finanzas.

---

## Arquitectura y Tecnologías

El sistema está dividido en backend y frontend, comunicados vía API REST.

### Backend (API REST)
El backend utiliza una arquitectura N-Capas para separar las responsabilidades del sistema.

- Tecnologías: Node.js, Express.
- Base de Datos: PostgreSQL (Neon).
- ORM: Prisma.
- Validación de Datos: Zod.

Estructura del Backend:
- Rutas (routes/): Definen los endpoints y aplican middlewares de autenticación y validación.
- Controladores (controllers/): Reciben las peticiones, llaman a los servicios y devuelven la respuesta.
- Servicios (services/): Contienen la lógica de negocio del sistema.
- Repositorios (repository/): Realizan las consultas a la base de datos usando Prisma.

### Frontend (SPA)
- Tecnologías: React, Vite, Bootstrap 5.
- Autenticación: Google OAuth y JWT.
- Funcionalidad: Rutas protegidas y renderizado condicional del dashboard dependiendo del área del usuario.

---

## Seguridad y Auditoría

El sistema implementa los siguientes controles de seguridad en el backend:

- Inactividad (Sliding Sessions): Los tokens JWT tienen una duración de 15 minutos. Cada vez que un usuario realiza una petición válida, el token y la cookie httpOnly se renuevan. Si hay 15 minutos de inactividad, la sesión caduca automáticamente en el servidor.
- Trazabilidad y Auditoría: Se cuenta con una tabla de auditoría en la base de datos. Las acciones de los usuarios (como crear préstamos, resolver reportes, iniciar sesión) quedan registradas con la descripción de la acción y la fecha.
- Protección general: Uso de Helmet, Express-Rate-Limit (máximo 10 intentos por IP en el login), políticas de CORS y validación estricta de datos de entrada con Zod.

---

## Módulos Funcionales

1. Autenticación (Auth)
   - Login con credenciales encriptadas (bcrypt).
   - Integración de login con Google OAuth.

2. Gestión de Usuarios y Áreas
   - CRUD de usuarios del sistema.
   - Catálogo de áreas de la empresa (Tecnología, RRHH, Soporte, etc.).

3. Inventario de Equipos (TI)
   - Registro y listado de equipos.
   - Asignación de responsables.
   - Reporte de fallas (cambio de estado a mantenimiento).
   - Resolución de reportes por los técnicos.

4. Préstamos
   - Asignación temporal de equipos.
   - Devolución de equipos.
   - Historial de préstamos.

5. Estadísticas
   - Conteo de equipos totales, disponibles, prestados, en mantenimiento y de baja.

---

## Cómo ejecutar el proyecto

### API (Backend)

```bash
cd backend
npm install

# Copiar .env.example a .env y configurar DATABASE_URL y JWT_SECRET
# Sincronizar Prisma con la base de datos:
npx prisma db push

npm run dev
```
La API correrá en http://localhost:3000.

### Aplicación Web (Frontend)

```bash
cd frontend
npm install

# Configurar VITE_GOOGLE_CLIENT_ID en el archivo .env
npm run dev
```
La aplicación web correrá en http://localhost:5173.

---

## Autores

- Aly Santiago Cano
- Narilyn Bustamante
- Cesar Augusto Cardona Arango
- Jhonatan David Gutierrez Guterres

Mockups del sistema: [Enlace a los prototipos](https://stitch.withgoogle.com/projects/15267342535273535427)