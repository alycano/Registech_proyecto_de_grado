const express = require('express')
const cors = require('cors')

const usuariosRoutes = require('./routes/usuarios')
const areasRoutes = require('./routes/areas')
const equiposRoutes = require('./routes/equipos')
const productosRoutes = require('./routes/productos')
const ventasRoutes = require('./routes/ventas')
const finanzasRoutes = require('./routes/finanzas')

// CREAR INSTANCIA DE EXPRESS
const app = express()

// PERMITIR PETICIONES DE OTROS DOMINIOS
app.use(cors())

// MIDDLEWARE PARA ANALIZAR JSON
app.use(express.json())

// IMPORTAMOS EL USO DE LAS RUTAS
app.use('/api', usuariosRoutes)
app.use('/api', areasRoutes)
app.use('/api', equiposRoutes)
app.use('/api', productosRoutes)
app.use('/api', ventasRoutes)
app.use('/api', finanzasRoutes)

// RUTA DE SALUD DEL SERVIDOR
app.get('/api/health', (req, res) => {
    res.json({ ok: true, servicio: 'Registech API' })
})

// INICIAR EL SERVIDOR
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`)
})
