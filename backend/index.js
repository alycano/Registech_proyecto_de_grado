require('dotenv').config();
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

const usuariosRoutes = require('./routes/usuarios')
const areasRoutes = require('./routes/areas')
const equiposRoutes = require('./routes/equipos')
const prestamosRoutes = require('./routes/prestamos')
const dashboardRoutes = require('./routes/dashboard')
const solicitudesRoutes = require('./routes/solicitudes')

// CREAR INSTANCIA DE EXPRESS
const app = express()

// PROTEGER HEADERS HTTP (PERMITIENDO MOSTRAR LAS IMAGENES DEL BACKEND EN EL FRONTEND)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// LIMITE DE INTENTOS EN EL LOGIN (ANTI FUERZA BRUTA)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos' }
})
app.use('/api/login', loginLimiter)

// LIMITE DE INTENTOS PARA RECUPERACION DE CONTRASENA
const recuperacionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes de recuperación. Intenta de nuevo en 15 minutos' }
})
app.use('/api/usuarios/solicitar-recuperacion', recuperacionLimiter)
app.use('/api/usuarios/restablecer-password', recuperacionLimiter)

// PERMITIR PETICIONES DE OTROS DOMINIOS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))

// MIDDLEWARE PARA ANALIZAR JSON (CON LIMITE DE TAMAÑO)
app.use(express.json({ limit: '100kb' }))
// PERMITIR EL USO DE COOKIES
app.use(cookieParser())

// IMPORTAMOS EL USO DE LAS RUTAS
app.use('/api', usuariosRoutes)
app.use('/api', areasRoutes)
app.use('/api', equiposRoutes)
app.use('/api', prestamosRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', solicitudesRoutes)

// SERVIR LAS EVIDENCIAS FOTOGRAFICAS DE MANTENIMIENTO
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }))

// RUTA DE SALUD DEL SERVIDOR
app.get('/api/health', (req, res) => {
    res.json({ ok: true, servicio: 'Registech API' })
})

// RUTA NO ENCONTRADA (RESPUESTA JSON SIN DETALLES INTERNOS)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' })
})

// MANEJO CENTRALIZADO DE ERRORES
app.use((err, req, res, next) => {
    // Si es un error operativo nuestro (AppError)
    if (err.isOperational) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    // Errores propios de Express/Librerías
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' })
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'El cuerpo de la petición supera el tamaño permitido' })
    }
    if (err.type === 'request.aborted') {
        return res.status(400).json({ error: 'Petición cancelada' })
    }
    
    // Error de programación o desconocido
    console.error('Error no controlado:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
})

// INICIAR EL SERVIDOR
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`)
})
