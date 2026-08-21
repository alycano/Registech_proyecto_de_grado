# Registech - Proyecto de Grado

**Proyecto de Grado: Análisis y Desarrollo de Software**

Sistema web corporativo para el inventario y la gestión de equipos de TI de la empresa **Registech**. El sistema permite administrar usuarios, áreas, equipos tecnológicos, préstamos y reportes de fallas a través de un panel basado en roles (Dashboard dinámico). 

Actualmente, el proyecto cuenta con una arquitectura robusta, escalable y segura, lista para la integración futura de módulos adicionales (Ventas, Almacén, Finanzas).

---

## 🏗️ Arquitectura y Tecnologías

El sistema está dividido en dos aplicaciones independientes que se comunican vía API REST.

### Backend (API REST)
Construido bajo los más altos estándares de la industria, utilizando una **Arquitectura N-Capas** (N-Tier) para separar las responsabilidades y desacoplar la lógica de negocio de las consultas a la base de datos.

- **Tecnologías Core:** Node.js, Express.
- **Base de Datos:** PostgreSQL (alojada en Neon).
- **ORM:** Prisma (Tipado estricto, migraciones automáticas, prevención absoluta de inyecciones SQL).
- **Validación de Datos:** Zod (Validación estricta de esquemas antes de tocar los controladores).

**Estructura N-Capas del Backend:**
1. **Rutas (`routes/`):** Definen los endpoints y aplican Middlewares (Autenticación, Autorización y Validación Zod).
2. **Controladores (`controllers/`):** Capa ligera que recibe la petición (`req`), llama al servicio correspondiente, genera logs de auditoría y devuelve la respuesta (`res`).
3. **Servicios (`services/`):** Contienen toda la lógica de negocio (encriptación de contraseñas, orquestación de datos).
4. **Repositorios (`repository/`):** La única capa que interactúa con la base de datos a través de Prisma (consultas y transacciones).

### Frontend (SPA)
- **Tecnologías:** React 19, Vite, Bootstrap 5.
- **Autenticación:** Google OAuth (`@react-oauth/google`) y JWT tradicional.
- **Rutas Protegidas:** Uso de interceptores de Axios para manejar tokens expirados.
- **Vistas Dinámicas:** Renderizado condicional del Dashboard dependiendo del área del usuario (Tecnología, RRHH, Soporte, etc.).

---

## 🔒 Seguridad y Auditoría Avanzada

El sistema cuenta con un blindaje multicapa implementado puramente desde el backend:

### 1. Inactividad y "Sliding Sessions"
- Los JSON Web Tokens (JWT) generados tienen una vida útil estricta de **15 minutos**.
- Se implementó un middleware de *Sliding Session*: cada vez que un usuario realiza una petición válida al servidor, el token y la cookie `httpOnly` se renuevan por 15 minutos adicionales.
- Si el usuario pasa 15 minutos de inactividad total, la sesión caduca automáticamente en el servidor y el frontend expulsa al usuario por seguridad.

### 2. Trazabilidad Impecable (Módulo de Auditoría)
- Existe una tabla dedicada de `auditoria` en PostgreSQL.
- Cualquier acción que modifique el estado del sistema (crear un préstamo, resolver un reporte de falla, registrar un usuario, iniciar sesión) queda **registrada automáticamente** indicando qué usuario la realizó, la descripción de la acción y la fecha exacta (Timestamp).

### 3. Protección de Endpoints
- **Helmet:** Configuración de cabeceras HTTP seguras.
- **Express-Rate-Limit:** Prevención de ataques de fuerza bruta en los endpoints críticos (máximo 10 intentos por IP).
- **CORS:** Restringido exclusivamente a las URLs del frontend permitidas.
- **Zod:** Intercepta datos maliciosos o incompletos devolviendo un error HTTP 400 antes de procesar el JSON.

---

## 🚀 Módulos Funcionales Actuales

1. **Autenticación (Auth)**
   - Login tradicional (Usuario y Contraseña con bcrypt).
   - Login con Google (Google OAuth).
2. **Gestión de Usuarios (RRHH)**
   - CRUD completo de usuarios del sistema con validación de correos y contraseñas seguras.
3. **Gestión de Áreas**
   - Catálogo de áreas de la empresa (Tecnología, RRHH, Soporte, Ventas, Almacén, etc.).
4. **Inventario de Tecnología (Equipos)**
   - Registro y listado de equipos.
   - Asignación de responsables.
   - Sistema de reporte de fallas (cambia estado a "En Mantenimiento").
   - Resolución de reportes por parte de los técnicos con historial de soluciones.
5. **Préstamos de Equipos**
   - Sistema de asignación temporal de equipos disponibles.
   - Devolución de equipos (retorna el equipo a estado "Disponible").
   - Historial de préstamos por cada equipo.
6. **Dashboard y Estadísticas**
   - Conteo en tiempo real de equipos totales, disponibles, prestados, en mantenimiento y dados de baja.

---

## ⚙️ Cómo ejecutar el proyecto

### Prerrequisitos
- Node.js instalado.
- Cuenta en Neon (o servidor de PostgreSQL local) para la base de datos.

### API (Backend)

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Instalar dependencias (Express, Prisma, Zod, etc.)
npm install

# 3. Configurar variables de entorno
# Copiar .env.example a .env y agregar la DATABASE_URL (PostgreSQL) y JWT_SECRET

# 4. Sincronizar esquema de Prisma con la BD
npx prisma db push

# 5. Iniciar el servidor
npm run dev
```
La API estará disponible en `http://localhost:3000`.

### Aplicación Web (Frontend)

```bash
# 1. Entrar a la carpeta del frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (VITE_GOOGLE_CLIENT_ID)

# 4. Ejecutar entorno de desarrollo
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 👥 Equipo de Desarrollo

**Liderazgo de Arquitectura y Backend:**
- **Aly.dev.1208** (Aly Santiago Cano)
- GitHub: [alycano](https://github.com/alycano)

**Integración Frontend y Google OAuth:**
- **Narilyn Bustamante**
- GitHub: [narilin](https://github.com/narilin)

**Mockups y Prototipos:**
[Ver Mockups del Sistema Registech](https://stitch.withgoogle.com/projects/15267342535273535427)