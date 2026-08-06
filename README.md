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
| body-parser | ^2.3.0 | Parsear peticiones JSON |
| nodemon | ^3.1.14 | Auto-reinicio en desarrollo |

---

## Estructura del Proyecto

```
Proyecto_Final/
├── .env                    # Variables de entorno (credenciales DB, puerto)
├── package.json            # Configuración del proyecto y dependencias
├── package-lock.json       # Lock de dependencias
├── index.js                # Punto de entrada - servidor Express
├── conexion.js             # Conexión a la base de datos MySQL
├── db_inv_ti.sql           # Script SQL - estructura e inserción de datos
├── usuariosRoutes.js       # Rutas CRUD de usuarios y login
├── areasRoutes.js          # Rutas de consulta de áreas
├── equiposRoutes.js        # Rutas de gestión de equipos y mantenimiento
├── productosRoutes.js      # Rutas CRUD de productos
└── ventasRoutes.js         # Rutas de registro y consulta de ventas
```

---

## Archivos y Funcionalidad

### 1. `package.json`
**Propósito:** Configuración del proyecto npm.

- Define el nombre, versión y descripción del proyecto
- Establece `index.js` como punto de entrada
- Incluye script de desarrollo: `npm run dev` (ejecuta nodemon)
- Dependencias: express, cors, body-parser, mysql2, dotenv, nodemon, pg

---

### 2. `.env`
**Propósito:** Variables de entorno para la configuración del servidor y la base de datos.

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=proyecto_final
```

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

### 4. `conexion.js`
**Propósito:** Configurar y exportar la conexión a MySQL.

- Lee las variables de entorno desde `.env`
- Crea la conexión usando `mysql2.createConnection()`
- Maneja errores de conexión
- Exporta la instancia de conexión para uso en rutas

---

### 5. `index.js`
**Propósito:** Punto de entrada del servidor. Configura Express y levanta el servidor.

- Crea instancia de Express
- Habilita CORS para peticiones de otros dominios
- Configura body-parser para parsear JSON
- Registra todas las rutas en la raíz (`/`)
- Inicia el servidor en el puerto 3000

---

### 6. `usuariosRoutes.js`
**Propósito:** CRUD completo de usuarios y autenticación.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/login` | Autenticar usuario (usuario + contraseña) |
| `GET` | `/usuarios` | Obtener todos los usuarios |
| `POST` | `/usuarios` | Crear nuevo usuario |
| `PUT` | `/usuarios/:usuarioParam` | Editar usuario existente |
| `DELETE` | `/usuarios/:usuario` | Eliminar usuario |

**Lógica del Login:**
- Valida que usuario y contraseña no estén vacíos
- Busca en la tabla `usuarios` por ambas credenciales
- Retorna datos del usuario (nombre, área, estado) si es exitoso
- Retorna 401 si las credenciales son incorrectas

**Lógica de Crear Usuario:**
- Valida que todos los campos obligatorios estén presentes
- Si no se especifica estado, asigna `'activo'` por defecto

---

### 7. `areasRoutes.js`
**Propósito:** Consulta de áreas de la empresa.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/areas` | Obtener todas las áreas |

---

### 8. `equiposRoutes.js`
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

### 9. `productosRoutes.js`
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

### 10. `ventasRoutes.js`
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

## Orden de Creación de Archivos

El proyecto fue creado en el siguiente orden lógico:

1. **`package.json`** - Inicialización del proyecto npm e instalación de dependencias
2. **`.env`** - Configuración de variables de entorno
3. **`db_inv_ti.sql`** - Diseño e implementación de la base de datos
4. **`conexion.js`** - Capa de conexión a MySQL
5. **`index.js`** - Punto de entrada del servidor
6. **`usuariosRoutes.js`** - Gestión de usuarios y login
7. **`areasRoutes.js`** - Consulta de áreas
8. **`equiposRoutes.js`** - Gestión de equipos y mantenimiento
9. **`productosRoutes.js`** - CRUD de productos
10. **`ventasRoutes.js`** - Registro de ventas

---

## Instalación y Ejecución

### Prerrequisitos
- Node.js instalado
- MySQL corriendo en localhost
- Crear la base de datos ejecutando el script `db_inv_ti.sql`

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar el script SQL en MySQL para crear las tablas
# (usar MySQL Workbench o consola)

# 3. Iniciar el servidor en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## Endpoints Disponibles

### Autenticación
| Método | Ruta | Body |
|--------|------|------|
| `POST` | `/login` | `{ "usuario": "...", "contrasena": "..." }` |

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