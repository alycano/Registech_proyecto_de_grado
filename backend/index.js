const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const usuariosRoutes = require('./routes/usuarios')
const areasRoutes = require('./routes/areas')
const equiposRoutes = require('./routes/equipos')
const productosRoutes = require('./routes/productos')
const ventasRoutes = require('./routes/ventas')

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

// MIDDLEWARE PARA ANALIZAR JSON
app.use(express.json())

// IMPORTAMOS EL USO DE LAS RUTAS
app.use('/api', usuariosRoutes)
app.use('/api', areasRoutes)
app.use('/api', equiposRoutes)
app.use('/api', productosRoutes)
app.use('/api', ventasRoutes)

// RUTA DE SALUD DEL SERVIDOR
app.get('/api/health', (req, res) => {
    res.json({ ok: true, servicio: 'Registech API' })
})

// INICIAR EL SERVIDOR
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`)
})
