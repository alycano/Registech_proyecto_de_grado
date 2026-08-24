# Registech - Backend 🚀

Este es el backend del sistema **Registech**, diseñado como proyecto de grado para el Análisis y Desarrollo de Software. Ha evolucionado desde un servidor básico hasta una arquitectura robusta, escalable y lista para producción.

## 🛠️ Tecnologías y Stack
- **Framework:** Node.js con **Express 5.2.1** (aprovechando el manejo nativo de promesas y errores asíncronos).
- **Base de Datos:** PostgreSQL alojado en la nube (**Neon DB**).
- **ORM / Query Builder:** **Prisma** combinado con consultas crudas optimizadas mediante `pg-pool`.
- **Seguridad:** JWT (JSON Web Tokens), `bcryptjs` (hash de contraseñas), `helmet` (cabeceras HTTP seguras) y `express-rate-limit` (prevención de ataques de fuerza bruta).
- **Validación de Datos:** **Zod** (Middlewares estrictos de validación de esquemas).
- **Manejo de Archivos:** **Multer** para la subida y alojamiento estático de evidencias fotográficas.
- **Correos Electrónicos:** **Nodemailer** para notificaciones y recuperación de contraseñas.
- **Entorno y Despliegue:** **Docker** y **Docker Compose**.

---

## 🏗️ Evolución y Ciclo de Vida (Logros Técnicos)

A lo largo del proyecto, el backend ha pasado por múltiples refactorizaciones para cumplir con los estándares actuales de la industria:

1. **Arquitectura N-Capas (Clean Architecture):**
   El código monolítico fue separado en capas con responsabilidades únicas:
   - **Routes:** Definen los endpoints y aplican middlewares (Autenticación, Multer, Zod).
   - **Controllers:** Orquestan el flujo HTTP (Request/Response) sin lógica de negocio.
   - **Services:** Contienen el corazón del negocio (validaciones lógicas, reglas del sistema).
   - **Repositories:** Se encargan única y exclusivamente de la persistencia de datos (SQL y Prisma).

2. **Migración de Base de Datos (MySQL a PostgreSQL):**
   Se migró exitosamente la base de datos a PostgreSQL en la nube (Neon) utilizando Prisma para asegurar la integridad referencial y facilitar la mantenibilidad.

3. **Manejo Centralizado de Errores (AppError):**
   Se eliminaron los repetitivos bloques `try-catch` en los controladores implementando una clase personalizada `AppError` que trabaja en conjunto con un middleware global en Express 5, mejorando drásticamente la legibilidad del código.

4. **Infraestructura de Archivos (Multer):**
   Se configuró un sistema local de alojamiento de archivos estáticos (`/uploads`) permitiendo adjuntar evidencia fotográfica en devoluciones de préstamos y reportes de mantenimiento.

5. **Dockerización:**
   Todo el backend fue empaquetado en contenedores de Docker, garantizando que el sistema funcione idénticamente en cualquier computadora y simplificando el despliegue a producción.

---

## 📦 Módulos Principales

- **🛡️ Autenticación y Usuarios:** Login, registro, recuperación de contraseña por correo, y gestión de roles (Administrador, Soporte, Recursos Humanos).
- **💻 Equipos (Inventario):** CRUD de equipos, asignación de responsables, gestión del ciclo de vida (adquisición a baja).
- **🔄 Préstamos:** Control de entrega y devolución de equipos. *Novedad:* Permite adjuntar fotos de evidencia al devolver un equipo dañado.
- **🛠️ Mantenimiento:** Sistema de reportes de fallas, trazabilidad de técnicos asignados y resoluciones/aprobaciones.
- **🏢 Áreas:** Gestión de los departamentos de la empresa con conteo automático de uso.
- **📊 Dashboard y Estadísticas:** Generación de métricas en tiempo real y exportación de reportes a CSV.
- **👁️ Auditoría:** Registro automático de cada acción crítica realizada por los usuarios (quién, qué y cuándo).

---

## ⚙️ Configuración y Ejecución Local

1. **Variables de entorno (.env):**
   Debes crear un archivo `.env` en la raíz de la carpeta `backend` con las siguientes variables (puedes guiarte con `db.stub.js`):
   ```env
   PORT=3000
   DATABASE_URL="postgres://usuario:password@host/neondb?sslmode=require"
   JWT_SECRET="tu_secreto_super_seguro"
   ```

2. **Instalación:**
   ```bash
   npm install
   ```

3. **Base de Datos (Prisma):**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Levantar Servidor (Modo Desarrollo):**
   ```bash
   npm run dev
   ```

*(Nota: Si usas Docker, basta con ejecutar `docker-compose up -d --build` desde la raíz del proyecto).*
