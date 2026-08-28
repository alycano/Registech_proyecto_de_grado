**SERVICIO NACIONAL DE APRENDIZAJE – SENA**

**TECNOLOGÍA EN ANÁLISIS Y DESARROLLO DE SOFTWARE – ADSO**

**MANUAL TÉCNICO Y DE OPERACIÓN**

Plantilla institucional para instalación, configuración, despliegue,
operación, mantenimiento, respaldo y recuperación

| Campo | Información |
| - | - |
| Nombre del proyecto | Registech (Gestión de Ciclo de Vida de Activos TI) |
| Centro de formación | SENA |
| Equipo responsable | Aly Santiago Cano y Equipo |
| Versión del producto | 1.0.0 |
| Versión del documento | 1.0 |
| Clasificación | Documento técnico controlado |

| Finalidad del manual |
| - |
| Permitir que una persona técnica diferente al equipo autor pueda instalar, configurar, ejecutar, desplegar, mantener, diagnosticar y recuperar el sistema siguiendo instrucciones verificables y sin depender de conocimiento informal o configuraciones ocultas. |

# **Control documental**

| Versión | Fecha | Descripción del cambio | Elaboró | Estado |
| - | - | - | - | - |
| 1.0 | Actual | Versión inicial documentando arquitectura, BD y despliegue local/Docker | Equipo de Desarrollo | Aprobado |

# **1. Propósito y alcance del manual**
Este manual documenta los procedimientos técnicos y operativos necesarios para reproducir, desplegar y mantener el sistema **Registech**. Corresponde con el código fuente en GitHub, la arquitectura N-Capas en Node.js, las migraciones en Prisma, y el frontend en React.

## **1.2 Audiencia**
* **Desarrollador:** Instalación local, mantenimiento evolutivo (Node, React, Prisma).
* **Instructor / Evaluador:** Comprobar reproducibilidad de la base de datos PostgreSQL, inicio de sesión y endpoints.

# **3. Identificación técnica del producto**

| Campo | Valor |
| - | - |
| Nombre técnico del sistema | Registech |
| Rama de entrega | main |
| Tipo de solución | Web (Single Page Application - SPA) |
| Arquitectura general | N-Capas (Controladores, Servicios, Repositorios) |
| Licencia | UNLICENSED (Propietaria) |

## **3.1 Resumen tecnológico**

| Capa / servicio | Tecnología | Versión | Función |
| - | - | - | - |
| Frontend | React + Vite | 18.x | Interfaz de Usuario SPA |
| Backend | Node.js + Express | 5.2.1 | API REST y Lógica de negocio |
| Base de datos | PostgreSQL (Neon DB) | 15+ | Persistencia y trazabilidad |
| ORM | Prisma | 7.9.1 | Mapeo objeto-relacional y migraciones |
| Contenedores | Docker + Docker Compose | Latest | Despliegue estandarizado |
| Seguridad | JWT, Bcryptjs, Helmet, Zod | Varias | Autenticación y validación |
| Manejo de Archivos| Multer | 2.2.0 | Recepción de evidencias fotográficas |

# **4. Requisitos de infraestructura**

## **4.2 Dependencias de software**
| Dependencia | Obligatoria | Verificación |
| - | - | - |
| Node.js (v18+) | Sí | `node -v` |
| npm | Sí | `npm -v` |
| Git | Sí | `git --version` |
| Docker Desktop | Condicionada | `docker -v` |

## **4.3 Puertos, protocolos y conectividad**
| Servicio | Puerto | Protocolo | Origen permitido | Justificación |
| - | - | - | - | - |
| Frontend | 5173 | HTTP | Localhost | Interfaz de usuario de Vite |
| Backend / API | 3000 | HTTP | Localhost:5173 | API REST |
| Base de datos | 5432 | TCP (postgres) | IP Servidor | Conexión a Neon DB |

# **5. Estructura del repositorio**
El proyecto adopta un patrón monorepo lógico dividido en dos servicios principales:

| Ruta | Contenido | Artefactos principales |
| - | - | - |
| `/backend` | Código de la API REST Node.js | `index.js`, `AppError.js` |
| `/backend/routes` | Enrutamiento HTTP | `prestamos.js`, `equipos.js` |
| `/backend/controllers` | Orquestadores de petición/respuesta | `prestamosController.js` |
| `/backend/services` | Lógica de negocio | `prestamosService.js` |
| `/backend/repository` | Consultas SQL y Prisma | `prestamosRepository.js` |
| `/backend/prisma` | Esquema de Base de Datos | `schema.prisma` |
| `/backend/uploads` | Almacenamiento de fotos (estático)| Evidencias fotográficas |
| `/frontend` | Aplicación SPA | `index.html`, `package.json` |
| `/frontend/src/api` | Diccionario de endpoints (Axios) | `apiRoutes.js` |
| `/frontend/src/components`| Interfaces y vistas | `Prestamos.jsx`, `Dashboard.jsx` |
| `/` (Raíz) | Orquestación Docker | `docker-compose.yml` |

# **6. Configuración y gestión de variables**
No se deben subir credenciales a GitHub. Se requiere un archivo `.env` en el backend y otro en el frontend.

**Variables en `backend/.env`:**
| Variable | Descripción | Obligatoria | Valor de ejemplo | Secreto |
| - | - | - | - | - |
| PORT | Puerto del backend | Sí | 3000 | No |
| DATABASE_URL | Conexión PostgreSQL (Neon) | Sí | postgres://usr:pass@host/db | Sí |
| JWT_SECRET | Firma de Tokens | Sí | super_secreto_123 | Sí |
| CLIENT_URL | Origen CORS | Sí | http://localhost:5173 | No |

**Variables en `frontend/.env`:**
| Variable | Descripción | Obligatoria | Valor de ejemplo | Secreto |
| - | - | - | - | - |
| VITE_API_URL | URL del Backend | Sí | http://localhost:3000/api | No |

# **7. Instalación y ejecución en ambiente local**

| Paso | Comando | Directorio |
| - | - | - |
| Clonar repositorio | `git clone https://github.com/alycano/Registech_proyecto_de_grado.git` | Raíz |
| Instalar Frontend | `npm install` | `/frontend` |
| Instalar Backend | `npm install` | `/backend` |
| Base de datos (Prisma) | `npx prisma db push` | `/backend` |
| Iniciar Frontend | `npm run dev` | `/frontend` |
| Iniciar Backend | `npm run dev` | `/backend` |

*(Opcional) Ejecución con Docker: `docker-compose up -d --build` en la raíz del proyecto.*

# **8. Base de datos y Migraciones**
La base de datos PostgreSQL está alojada en Neon DB.
* **ORM:** Prisma Client.
* **Archivos clave:** `schema.prisma` gestiona la estructura (usuarios, equipos, prestamos).
* **Solución a desincronizaciones:** Si el esquema de Prisma y Neon difieren (Ej: falta la columna "area" en prestamos), se debe correr `npx prisma db push` para aplicar los cambios del `schema.prisma` a la nube de manera destructiva controlada, o inyectar las columnas mediante script SQL crudo usando `pg-pool`.

# **14. Logs y Manejo de Errores**
Se implementó un **Manejador Global de Errores** (Global Error Handler) utilizando Express 5 y una clase personalizada `AppError`.
* **Fuente:** `backend/utils/AppError.js` y `backend/index.js`
* **Formato:** Todas las respuestas de error de la API devuelven un JSON estandarizado: `{ "error": "Mensaje detallado" }`.
* **Beneficio:** Evita la caída del servidor por "Unhandled Promise Rejections" y unifica la comunicación con las alertas de SweetAlert en el Frontend.

# **18. Diagnóstico y solución de problemas (Incidentes Frecuentes)**

| Código | Síntoma | Causa probable | Solución |
| - | - | - | - |
| INC-01 | Error "Cannot find module '../lib/db'" al iniciar backend | `lib/db.js` está en `.gitignore` y no se descargó de GitHub. | Crear el archivo localmente y enlazarlo con `process.env.DATABASE_URL` o quitarlo del `.gitignore`. |
| INC-02 | Error 500 "column 'area' does not exist" al crear préstamo | La BD en la nube (Neon) está desincronizada con el código (schema.prisma). | Ejecutar migración o script SQL (`ALTER TABLE prestamos ADD COLUMN...`). |
| INC-03 | Frontend no conecta, dice "No se pudo conectar" | Axios apunta al puerto incorrecto. | Validar que el archivo `frontend/src/api/apiRoutes.js` apunte al `PORT` donde corre el backend. |
| INC-04 | Las fotos (evidencias) no se guardan | Permisos en la carpeta `uploads/` o Multer mal configurado. | Crear la carpeta `backend/uploads` si no existe; enviar los datos desde React utilizando objeto `FormData`, no JSON. |
