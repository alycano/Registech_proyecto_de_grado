require('dotenv').config();
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const usuariosRoutes = require('./routes/usuarios')
const areasRoutes = require('./routes/areas')
const equiposRoutes = require('./routes/equipos')
const productosRoutes = require('./routes/productos')
const ventasRoutes = require('./routes/ventas')
const finanzasRoutes = require('./routes/finanzas')

// CREAR INSTANCIA DE EXPRESS
const app = express()

// PROTEGER HEADERS HTTP
app.use(helmet())

// LIMITE DE INTENTOS EN EL LOGIN (ANTI FUERZA BRUTA)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos' }
})
app.use('/api/login', loginLimiter)

// PERMITIR PETICIONES DE OTROS DOMINIOS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))

// MIDDLEWARE PARA ANALIZAR JSON (CON LIMITE DE TAMAÑO)
app.use(express.json({ limit: '100kb' }))

// IMPORTAMOS EL USO DE LAS RUTAS
app.use('/api/usuarios', usuariosRoutes)
app.use('/api', areasRoutes)
app.use('/api', equiposRoutes)
app.use('/api', productosRoutes)
app.use('/api', ventasRoutes)
app.use('/api', finanzasRoutes)

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
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido en el cuerpo de la petición' })
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'El cuerpo de la petición supera el tamaño permitido' })
    }
    if (err.type === 'request.aborted') {
        return res.status(400).json({ error: 'Petición cancelada' })
    }
    console.error('Error no controlado:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
})

// INICIAR EL SERVIDOR
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`)
})
