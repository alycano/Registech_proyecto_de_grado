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
- Tecnologías: React, Vite, Bootstrap 5, Bootstrap Icons.
- Autenticación: JWT con usuario y contraseña creados por el administrador.
- Funcionalidad: Rutas protegidas y renderizado condicional del dashboard dependiendo del área del usuario.
- Navegación: Sidebar con página independiente por módulo (Equipos, Préstamos, Mantenimiento, Departamentos, Reportes y Configuración).
- Interfaz: Tema claro/oscuro con persistencia, notificaciones con SweetAlert2, tarjetas resumen (KPIs) con auto-refresco y alertas visuales de vencimiento en préstamos y órdenes.

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
   - Recuperación de contraseña mediante código temporal de verificación.
   - Cambio de contraseña autenticado desde Configuración.

2. Panel Principal (Dashboard)
   - Tarjetas resumen con las métricas del inventario.
   - Actividad reciente del sistema y notificaciones de órdenes pendientes.
   - Aprobación o rechazo de órdenes de mantenimiento directamente desde el panel (rol Tecnología).

3. Inventario de Equipos
   - Registro y listado de equipos en cuadrícula de tarjetas con estados.
   - Asignación de responsables y préstamo directo desde la tarjeta, con fechas de inicio/límite y ficha técnica.
   - Devolución rápida y alertas visuales de vencimiento (VENCIDO / Vence pronto).
   - Reporte de fallas con evidencia fotográfica (cambio de estado a mantenimiento).
   - Resolución de reportes por los técnicos.

4. Gestión de Préstamos
   - Registro de préstamos con fechas de inicio y límite, área destino y observaciones.
   - KPIs de vencimiento: activos, por vencer (3 días) y vencidos, con refresco automático.
   - Badges de vencimiento por fila en la tabla de préstamos activos.
   - Historial completo con búsqueda en vivo, filtro por estado, duración y situación.

5. Mantenimiento
   - Bandeja de órdenes de trabajo según el rol:
     - Soporte: registra daños con evidencia fotográfica y marca equipos como reparados.
     - Administrador: consulta el detalle completo de cada orden (diagnóstico, evidencia ampliable, aprobación con quién y cuándo, solución aplicada) sin modificarlas.
   - Flujo de estados: pendiente → aprobada/rechazada → reparada, con trazabilidad de aprobaciones.
   - KPIs de órdenes totales, por aprobar, en reparación y completadas.
   - Historial completo de mantenimientos con buscador por ID, número de serie o técnico.

6. Gestión de Usuarios y Departamentos
   - CRUD de usuarios del sistema.
   - CRUD de áreas/departamentos con conteos de equipos y usuarios asignados; al renombrar un departamento se actualizan sus referencias automáticamente.

7. Reportes
   - Exportación en CSV (compatible con Excel) de: inventario de equipos, préstamos, mantenimientos (incluye quién aprobó cada orden) y usuarios.

8. Configuración
   - Perfil del usuario autenticado (nombre, correo, departamento).
   - Cambio de contraseña verificando la actual.
   - Tema claro/oscuro con persistencia local.

9. Estadísticas
   - Conteo de equipos totales, disponibles, prestados, en mantenimiento y de baja.

---

## Roles del Sistema

| Área | Acceso |
|------|--------|
| Tecnología (Administrador) | Panel completo: inventario con registro de equipos, usuarios, departamentos, aprobación de órdenes de mantenimiento, reportes y configuración. En las órdenes solo consulta detalles, no repara. |
| Soporte | Bandeja de mantenimiento: registra daños con evidencia fotográfica y marca equipos como reparados cuando la orden está aprobada. |
| Recursos Humanos | Gestión de usuarios del sistema. |

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

# Opcional: configurar VITE_API_URL en el archivo .env (por defecto http://localhost:3000/api)
npm run dev
```
La aplicación web correrá en http://localhost:5173.

---

## Autores

- Aly Santiago Cano
- Narilyn Bustamante
- Cesar Augusto Cardona Arango
- Jhonatan David Gutierrez Gutierrez

Mockups del sistema: [Enlace a los prototipos](https://stitch.withgoogle.com/projects/15267342535273535427)