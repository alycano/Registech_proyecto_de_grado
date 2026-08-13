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
│   └── db.js           # Conexión a la base de datos MySQL
├── controllers/        # Lógica de negocio por recurso
│   ├── areasController.js
│   ├── equiposController.js
│   ├── productosController.js
│   ├── usuariosController.js
│   └── ventasController.js
├── routes/             # Rutas HTTP por recurso
│   ├── areas.js
│   ├── equipos.js
│   ├── productos.js
│   ├── usuarios.js
│   └── ventas.js
└── utils/
    └── date.js         # Helpers reutilizables
```

Todos los endpoints se exponen bajo el prefijo `/api` (ej: `POST http://localhost:3000/api/login`). La documentación detallada de cada endpoint está en [`backend/README.md`](backend/README.md).

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

## Autor

**Aly.dev.1208** (Aly Santiago Cano)

- GitHub: [alycano](https://github.com/alycano)
- Repositorio: [Registech_proyecto_de_grado](https://github.com/alycano/Registech_proyecto_de_grado)


## Inicio de sesión con Googlecd 
Se agregó la opción de iniciar sesión con la cuenta de Google, 
además del login tradicional con usuario y contraseña.

Backend: se agregó una nueva forma de validar que el usuario realmente
tiene esa cuenta de Google antes de dejarlo entrar.

Base de datos: se ajustó para poder guardar los usuarios que
entran por Google (nombre, correo y foto de perfil).

Frontend: se agregó el botón de "Iniciar sesión con Google" en la pantalla de login.

Google Cloud Console: se configuraron las credenciales necesarias para que la aplicación pueda comunicarse con las cuentas de Google de forma segura.

## Autor

**Narilyn Bustamante**
- Repositorio: [Registech_proyecto_de_grado](https://github.com/narilin/Registech_proyecto_de_grado.git)