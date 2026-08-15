# Registech - Proyecto de Grado

**Proyecto de Grado: Análisis y Desarrollo de Software**

Sistema web para el inventario y la gestión de equipos de TI de la empresa **Registech**. El sistema permite administrar usuarios, áreas, equipos tecnológicos, mantenimientos, productos y ventas, con un panel por áreas y un flujo completo de reporte y solución de fallas.

---

## Contenido del repositorio

| Carpeta | Descripción |
|---------|-------------|
| `backend/` | API REST (Node.js + Express + MySQL) — toda la lógica del sistema |
| `frontend/` | Aplicación web (React + Vite + Bootstrap) — interfaz del usuario |

---

## Estructura de la API (`backend/`)

La API está organizada por capas:

```
backend/
├── index.js            # Punto de entrada - servidor Express
├── .env.example        # Plantilla de variables de entorno
├── db_inv_ti.sql       # Script SQL - estructura e inserción de datos
├── package.json        # Configuración y dependencias
├── config/
│   ├── db.js           # Conexión a la base de datos MySQL (o stub si DB_STUB=1)
│   └── db.stub.js      # Base de datos en memoria para desarrollo sin MySQL
├── controllers/        # Lógica de negocio por recurso
│   ├── areasController.js
│   ├── equiposController.js
│   ├── productosController.js
│   ├── usuariosController.js
│   └── ventasController.js
├── middlewares/
│   └── auth.js         # Autenticación por JWT y autorización por área
├── routes/             # Rutas HTTP por recurso
│   ├── areas.js
│   ├── equipos.js
│   ├── productos.js
│   ├── usuarios.js
│   └── ventas.js
└── utils/
    ├── date.js         # Helpers de fechas
    ├── jwt.js          # Firma y verificación de tokens JWT
    └── sanitize.js     # Sanitización y validación de entradas
```

Todos los endpoints se exponen bajo el prefijo `/api` (ej: `POST http://localhost:3000/api/login`). La documentación detallada de cada endpoint está en [`backend/README.md`](backend/README.md).

---

## Seguridad implementada

El módulo de seguridad cubre autenticación, autorización y protección del servidor:

### Autenticación con bcrypt y JWT
- Las contraseñas se guardan **hashadas con bcrypt** (costo 10). Al crear o editar un usuario, la contraseña se encripta antes de almacenarse; nunca se guarda en texto plano.
- El login emite un **token JWT** firmado con `JWT_SECRET` y expiración de 7 días. El token se devuelve en el cuerpo de la respuesta y también se guarda en una cookie `httpOnly`.
- El login por Google verifica el `credential` contra Google y emite el mismo tipo de token.

### Autorización
- `authMiddleware` exige un encabezado `Authorization: Bearer <token>` válido en todas las rutas protegidas (devuelve `401` si falta o es inválido).
- `requireArea(...)` limita el acceso según el área del usuario (devuelve `403` si no tiene permiso). Ej.: la gestión de usuarios requiere el área `Recursos Humanos` o `Tecnologia`.

### Protección del servidor
- **helmet**: establece cabeceras HTTP seguras.
- **Rate limit** en `/api/login`: máximo 10 intentos por 15 minutos por IP (devuelve `429`).
- **CORS** restringido al origen del frontend (`CLIENT_URL`) con `credentials: true`.
- **Límite de tamaño** del cuerpo JSON (100 KB) para evitar abusos.

### Validación y sanitización de entradas
- Todas las consultas usan **parámetros preparados (`?`)**, evitando inyección SQL.
- Los textos se sanitizan (se eliminan bloques `<script>` y atributos de eventos) y se truncan según su longitud máxima.
- Se validan formatos: correo electrónico, áreas permitidas, estados de usuario y números (precios y existencias no negativos, existencias enteras).

### Manejo de errores
- Respuestas **JSON** uniformes, sin filtrar detalles internos ni stack traces.
- `400` JSON inválido, `404` ruta no encontrada, `413` cuerpo demasiado grande y `500` genérico.

### Variables de entorno relevantes
| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave para firmar los tokens JWT (cambiar en producción) |
| `CLIENT_URL` | Origen permitido para CORS |
| `DB_STUB` | `1` activa la base de datos en memoria (desarrollo sin MySQL) |

**Nota:** para desarrollo local sin MySQL, el archivo `.env` incluye `DB_STUB=1`, que activa el stub en memoria con los usuarios de prueba de la tabla de abajo. Con la base de datos real se omite `DB_STUB` o se pone en `0`.

---

## Mockups y Prototipos

Los mockups del sistema se encuentran en el siguiente enlace:

**[Ver Mockups del Sistema Registech](https://stitch.withgoogle.com/projects/15267342535273535427)**

El prototipo incluye las pantallas principales de la aplicación:

- **Login** - Acceso al sistema con usuario y contraseña
- **Dashboard** - Vista principal con la información del área
- **Gestión de Tecnología** - Equipos, soportes y historiales de mantenimiento
- **Recursos Humanos** - Listado y gestión de usuarios/asociados
- **Módulos en desarrollo** - Almacén, ventas y finanzas

---

## Cómo ejecutar el proyecto

### Prerrequisitos
- Node.js instalado
- MySQL corriendo en localhost

### API (backend)

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Ejecutar el script db_inv_ti.sql en MySQL para crear las tablas

# 4. Iniciar el servidor en modo desarrollo
npm run dev
```

La API estará disponible en `http://localhost:3000`.

### Frontend (aplicación web)

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Usuarios de prueba

| Usuario | Contraseña | Área |
|---------|------------|------|
| `admin` | `admin123` | Tecnologia |
| `rh` | `rh123` | Recursos Humanos |
| `soporte` | `soporte123` | Soporte |
| `almacen` | `almacen123` | Almacen |
| `ventas` | `ventas123` | Ventas |
| `fianzas` | `fianzas123` | Fianzas |
| `administracion` | `administracion123` | Administración |

---

## Inicio de sesión con Google
Se agregó la opción de iniciar sesión con la cuenta de Google, 
además del login tradicional con usuario y contraseña.

Backend: se agregó una nueva forma de validar que el usuario realmente
tiene esa cuenta de Google antes de dejarlo entrar.

Base de datos: se ajustó para poder guardar los usuarios que
entran por Google (nombre, correo y foto de perfil).

Frontend: se agregó el botón de "Iniciar sesión con Google" en la pantalla de login.

Google Cloud Console: se configuraron las credenciales necesarias para que la aplicación pueda comunicarse con las cuentas de Google de forma segura.

**Autor: Narilyn Bustamante**
- Repositorio: [Registech_proyecto_de_grado](https://github.com/narilin/Registech_proyecto_de_grado.git)

---

## Autor

**Aly.dev.1208** (Aly Santiago Cano)

- GitHub: [alycano](https://github.com/alycano)
- Repositorio: [Registech_proyecto_de_grado](https://github.com/alycano/Registech_proyecto_de_grado)