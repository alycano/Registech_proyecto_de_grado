# Registech - Proyecto Final

**Proyecto de Grado: Análisis y Desarrollo de Software**

API REST para el sistema de inventario y gestión de equipos de TI de la empresa Registech. Permite administrar usuarios, áreas, equipos tecnológicos, productos, ventas y mantenimiento de equipos.

---

## Tecnologías Utilizadas

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Node.js | - | Runtime de JavaScript |
| Express | ^5.2.1 | Framework web para Node.js |
| MySQL2 | ^3.22.6 | Cliente para base de datos MySQL |
| dotenv | ^17.4.2 | Variables de entorno |
| cors | ^2.8.6 | Habilitar peticiones cross-origin |
| nodemon | ^3.1.14 | Auto-reinicio en desarrollo |
| bcryptjs | - | Encriptación de contraseñas |
| jsonwebtoken | - | Firma y verificación de tokens JWT |
| helmet | - | Cabeceras HTTP seguras |
| express-rate-limit | - | Límite de intentos de login |

---

## Estructura del Proyecto

```
Registech_proyecto_de_grado/
├── backend/                # API REST (Node.js + Express)
│   ├── .env.example        # Plantilla de variables de entorno
│   ├── package.json        # Configuración del proyecto y dependencias
│   ├── package-lock.json   # Lock de dependencias
│   ├── index.js            # Punto de entrada - servidor Express
│   ├── db_inv_ti.sql       # Script SQL - estructura e inserción de datos
│   ├── config/
│   │   ├── db.js           # Conexión a MySQL (o stub si DB_STUB=1)
│   │   └── db.stub.js      # Base de datos en memoria para desarrollo sin MySQL
│   ├── controllers/        # Lógica de negocio de cada recurso
│   │   ├── areasController.js
│   │   ├── equiposController.js
│   │   ├── productosController.js
│   │   ├── usuariosController.js
│   │   └── ventasController.js
│   ├── middlewares/
│   │   └── auth.js         # Autenticación por JWT y autorización por área
│   ├── routes/             # Definición de rutas HTTP por recurso
│   │   ├── areas.js
│   │   ├── equipos.js
│   │   ├── productos.js
│   │   ├── usuarios.js
│   │   └── ventas.js
│   └── utils/
│       ├── date.js         # Helpers reutilizables (formato de fechas)
│       ├── jwt.js          # Firma y verificación de tokens JWT
│       └── sanitize.js     # Sanitización y validación de entradas
└── frontend/               # Aplicación React + Vite
```

**Convención:** todas las rutas se exponen bajo el prefijo `/api` (ej: `GET /api/equipos`).

---

## Archivos y Funcionalidad

### 1. `package.json`
**Propósito:** Configuración del proyecto npm.

- Define el nombre, versión y descripción del proyecto
- Establece `index.js` como punto de entrada
- Incluye script de desarrollo: `npm run dev` (ejecuta nodemon)
- Dependencias: express, cors, mysql2, dotenv, nodemon

---

### 2. `.env.example`
**Propósito:** Plantilla de variables de entorno para la configuración del servidor y la base de datos. Cópiala a `.env` y ajusta los valores.

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=proyecto_final
JWT_SECRET=registech_dev_secret_cambiar_en_produccion
CLIENT_URL=http://localhost:5173
DB_STUB=1
```

> `DB_STUB=1` activa una base de datos en memoria con usuarios de prueba, útil para desarrollo sin MySQL. Con la base real, se omite o se pone en `0`.

---

### 3. `db_inv_ti.sql`
**Propósito:** Script de base de datos con la estructura de tablas e inserción de datos iniciales.

**Tablas creadas:**

| Tabla | Descripción | PK |
|-------|-------------|-----|
| `areas` | Áreas de la empresa | `area` (varchar) |
| `estados_equipos` | Estados posibles de un equipo | `estado` (varchar) |
| `usuarios` | Usuarios del sistema | `id_usuario` (serial) |
| `equipos` | Equipos tecnológicos asignados | `num_serie` (varchar) |
| `historial_mantenimientos` | Registro de mantenimientos | `id_historial` (varchar) |
| `productos` | Productos del inventario | `codigo` (varchar) |
| `ventas` | Registro de ventas realizadas | `id_venta` (varchar) |

**Datos iniciales:**
- 7 áreas (Tecnología, Administración, Recursos Humanos, Finanzas, Soporte, Almacén, Ventas)
- 5 estados de equipos (Activo, En mantenimiento, Baja, Inactivo, Reservado)
- 20 productos (artículos de hogar con precios y existencias)
- 35 equipos tecnológicos distribuidos por áreas

---

### 4. `config/db.js`
**Propósito:** Configurar y exportar la conexión a MySQL.

- Lee las variables de entorno desde `.env`
- Crea la conexión usando `mysql2.createConnection()`
- Maneja errores de conexión
- Exporta la instancia de conexión para uso en rutas

---

### 5. `index.js`
**Propósito:** Punto de entrada del servidor. Configura Express y levanta el servidor.

- Crea instancia de Express
- Aplica **helmet** para cabeceras HTTP seguras
- Configura **rate limit** en `/api/login` (10 intentos / 15 min por IP)
- Habilita CORS solo para el origen del frontend (`CLIENT_URL`) con `credentials: true`
- Configura `express.json({ limit: '100kb' })` para parsear JSON con límite de tamaño
- Registra todas las rutas bajo el prefijo `/api`
- Responde `404` en JSON para rutas inexistentes
- Manejo centralizado de errores (JSON limpio, sin detalles internos)
- Inicia el servidor en el puerto 3000

---

### 6. `routes/usuarios.js` + `controllers/usuariosController.js`
**Propósito:** CRUD completo de usuarios y autenticación.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/login` | Autenticar usuario (correo + contraseña) |
| `POST` | `/usuarios/solicitar-recuperacion` | Generar código temporal de 6 dígitos |
| `POST` | `/usuarios/restablecer-password` | Restablecer contraseña con el código |
| `GET` | `/usuarios` | Obtener todos los usuarios (RRHH o Tecnología) |
| `POST` | `/usuarios` | Crear nuevo usuario (RRHH o Tecnología) |
| `PUT` | `/usuarios/:usuarioParam` | Editar usuario existente (RRHH o Tecnología) |
| `DELETE` | `/usuarios/:usuario` | Eliminar usuario (RRHH o Tecnología) |

**Lógica del Login:**
- Valida que usuario y contraseña estén presentes
- Busca al usuario solo por `usuario` (consulta parametrizada)
- Compara la contraseña con `bcrypt.compareSync` contra el hash guardado
- Emite un **token JWT** firmado con `JWT_SECRET` (expira en 7 días)
- Guarda el token en una cookie `httpOnly` y lo devuelve en el body
- Retorna 401 si las credenciales son incorrectas

**Lógica de Crear Usuario:**
- Valida campos obligatorios, formato de correo, área permitida y estado
- Encripta la contraseña con bcrypt antes de guardarla
- Si no se especifica estado, asigna `'activo'` por defecto

---

### 7. `routes/areas.js` + `controllers/areasController.js`
**Propósito:** Consulta de áreas de la empresa.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/areas` | Obtener todas las áreas |

---

### 8. `routes/equipos.js` + `controllers/equiposController.js`
**Propósito:** Gestión completa de equipos y sistema de mantenimiento.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/estados_equipo` | Obtener todos los estados posibles |
| `GET` | `/equipos` | Obtener todos los equipos |
| `POST` | `/equipos/asignacion` | Asignar usuario a un equipo |
| `POST` | `/equipos/reporte/add` | Registrar nuevo reporte de falla |
| `GET` | `/equipos/reporte` | Obtener mantenimientos pendientes |
| `POST` | `/equipos/reporte/solucion` | Registrar solución de mantenimiento |
| `POST` | `/equipos/mantenimientos/find` | Buscar mantenimientos por filtro |

**Lógica de Asignación:**
- Recibe `num_serie` y `usuario` en el body
- Si el usuario está vacío, asigna `NULL` (equipo sin responsable)
- Actualiza el campo `responsable` en la tabla `equipos`

**Lógica de Reporte de Falla (transaccional):**
1. Actualiza el estado del equipo a `"Mantenimiento"`
2. Inserta registro en `historial_mantenimientos` con fecha actual y falla descrita
3. Usa transacciones con `beginTransaction` / `commit` / `rollback`

**Lógica de Solución (transaccional):**
1. Actualiza el estado del equipo a `"activo"`
2. Actualiza el historial con fecha de solución, técnico y solución aplicada
3. Usa transacciones para mantener integridad

**Búsqueda de Mantenimientos:**
- Busca por `id_historial`, `num_serie` o `usuario_tecnico`
- Solo retorna mantenimientos que ya tienen solución (`solucion IS NOT NULL`)

---

### 9. `routes/productos.js` + `controllers/productosController.js`
**Propósito:** CRUD completo de productos del inventario.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/productos` | Obtener todos los productos |
| `GET` | `/producto?codigo=X` | Obtener producto por código |
| `POST` | `/productos` | Crear nuevo producto |
| `PUT` | `/productos` | Editar producto existente |
| `DELETE` | `/productos/:producto` | Eliminar producto por código |

**Lógica de Crear/Editar:**
- Valida que todos los campos obligatorios estén presentes
- Campos: código, nombre, descripción, precio público, precio proveedor, existencias

---

### 10. `routes/ventas.js` + `controllers/ventasController.js`
**Propósito:** Registro y consulta de ventas.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/ventas?inicio=X&fin=Y` | Obtener ventas en rango de fechas |
| `POST` | `/ventas` | Registrar nueva venta |

**Lógica de Consulta por Fechas:**
- Requiere parámetros `inicio` y `fin` como query strings
- Valida que las fechas sean válidas y que inicio no sea mayor que fin
- Formatea las fechas a `YYYY-MM-DD` para la consulta SQL
- Usa `BETWEEN` para filtrar el rango

**Lógica de Registro de Venta:**
- Recibe un string con formato: `PRODUCTOS_TOTAL_VENDEDOR` separado por `_`
- Genera `id_venta` usando `Date.now()`
- Genera fecha de venta con formato `YYYY-MM-DD`
- Extrae productos, total y vendedor del string recibido
- Valida que el total sea un número válido

---

## Seguridad

### `middlewares/auth.js`
**Propósito:** Proteger los endpoints de la API.

- `authMiddleware`: exige `Authorization: Bearer <token>` válido en las rutas protegidas (devuelve `401` si falta o es inválido) y adjunta `req.usuario` con el payload del JWT.
- `requireArea(...)`: limita el acceso según el área del usuario (devuelve `403` si no tiene permiso). Ej.: `requireArea('Recursos Humanos', 'Tecnologia')`.

### `utils/jwt.js`
**Propósito:** Firma y verificación de tokens JWT con `JWT_SECRET`.

### `utils/sanitize.js`
**Propósito:** Sanitización y validación de entradas.

- `sanitizarTexto`: recorta, elimina caracteres de control y limita longitud.
- `sanitizarHtml`: además elimina bloques `<script>` y atributos de eventos (`onerror`, `onload`, etc.).
- `esCorreoValido`: valida formato de correo electrónico.
- `sanitizarNumero`: convierte a número y valida que sea finito.

### Medidas aplicadas
- Contraseñas hashadas con **bcrypt** (nunca en texto plano).
- Tokens **JWT** con expiración para las sesiones.
- Consultas SQL **parametrizadas** (anti inyección SQL).
- **Sanitización** de textos (anti XSS) y validación de tipos/formatos.
- **helmet** + **rate limit** en login + **CORS** restringido + límite de tamaño de body.
- Errores respondidos en **JSON** sin detalles internos.

---

## Orden de Creación de Archivos

El proyecto fue creado en el siguiente orden lógico:

1. **`package.json`** - Inicialización del proyecto npm e instalación de dependencias
2. **`.env.example`** - Configuración de variables de entorno
3. **`db_inv_ti.sql`** - Diseño e implementación de la base de datos
4. **`config/db.js`** - Capa de conexión a MySQL
5. **`index.js`** - Punto de entrada del servidor
6. **`controllers/`** - Lógica de negocio de usuarios, áreas, equipos, productos y ventas
7. **`routes/`** - Definición de endpoints por recurso
8. **`utils/date.js`** - Helpers reutilizables

---

## Instalación y Ejecución

### Prerrequisitos
- Node.js instalado
- MySQL corriendo en localhost
- Crear la base de datos ejecutando el script `db_inv_ti.sql`

### Pasos

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Ejecutar el script SQL en MySQL para crear las tablas
# (usar MySQL Workbench o consola)

# 4. Iniciar el servidor en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

El frontend se ejecuta por separado desde la carpeta `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

> **Nota:** todos los endpoints de la API usan el prefijo `/api`.
> Ejemplo: `POST http://localhost:3000/api/login`

---

## Endpoints Disponibles

### Autenticación
| Método | Ruta | Body |
|--------|------|------|
| `POST` | `/login` | `{ "correo": "...", "contrasena": "..." }` |
| `POST` | `/usuarios/solicitar-recuperacion` | `{ "correo": "..." }` |
| `POST` | `/usuarios/restablecer-password` | `{ "correo": "...", "codigo": "...", "nuevaContrasena": "..." }` |

> Todas las demás rutas requieren el encabezado `Authorization: Bearer <token>` obtenido en el login.

### Usuarios
| Método | Ruta | Body/Params |
|--------|------|-------------|
| `GET` | `/usuarios` | - |
| `POST` | `/usuarios` | `{ "usuario", "contrasena", "nombre", "area", "correo", "estado" }` |
| `PUT` | `/usuarios/:usuarioParam` | `{ "usuario", "contrasena", "nombre", "area", "correo", "estado" }` |
| `DELETE` | `/usuarios/:usuario` | - |

### Áreas
| Método | Ruta |
|--------|------|
| `GET` | `/areas` |

### Equipos
| Método | Ruta | Body/Params |
|--------|------|-------------|
| `GET` | `/estados_equipo` | - |
| `GET` | `/equipos` | - |
| `POST` | `/equipos/asignacion` | `{ "num_serie", "usuario" }` |
| `POST` | `/equipos/reporte/add` | `{ "num_serie", "falla" }` |
| `GET` | `/equipos/reporte` | - |
| `POST` | `/equipos/reporte/solucion` | `{ "num_serie", "id_historial", "tecnico", "solucion" }` |
| `POST` | `/equipos/mantenimientos/find` | `{ "filter" }` |

### Productos
| Método | Ruta | Body/Params |
|--------|------|-------------|
| `GET` | `/productos` | - |
| `GET` | `/producto?codigo=X` | Query param |
| `POST` | `/productos` | `{ "codigo", "nom_producto", "desc_producto", "pre_publico", "pre_proveedor", "existencias" }` |
| `PUT` | `/productos` | `{ "codigo", "nom_producto", "desc_producto", "pre_publico", "pre_proveedor", "existencias" }` |
| `DELETE` | `/productos/:producto` | - |

### Ventas
| Método | Ruta | Body/Params |
|--------|------|-------------|
| `GET` | `/ventas?inicio=X&fin=Y` | Query params (fechas) |
| `POST` | `/ventas` | `{ "venta": "PRODUCTOS_TOTAL_VENDEDOR" }` |

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

## Autor

**Aly.dev.1208** (Aly Santiago Cano)

- GitHub: [alycano](https://github.com/alycano)
- Repositorio: [Registech_proyecto_de_grado](https://github.com/alycano/Registech_proyecto_de_grado)
