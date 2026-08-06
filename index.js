const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const usuariosRoutes = require('./usuariosRoutes')
const areasRoutes = require('./areasRoutes')
const equiposRoutes = require('./equiposRoutes')
const productosRoutes = require('./productosRoutes')
const ventasRoutes = require('./ventasRoutes')

//CREAR INSTANCIA DE EXPRESS
const app = express ()

//PERMITIR PETICIONES DE OTROS DOMINIOS
app.use(cors())

//MIDDLEWARE PARA ANALIZAR JSON
app.use(bodyParser.json())

//IMPORTAMOS EL USO DE LAS RUTAS
app.use ('/', usuariosRoutes)
app.use ('/', areasRoutes)
app.use ('/', equiposRoutes)
app.use ('/', productosRoutes)
app.use ('/', ventasRoutes)

//INICIAR EL SERVIDOR
const port = 3000
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
})

module.exports = app;