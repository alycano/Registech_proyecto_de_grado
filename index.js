import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import usuariosRoutes from './usuariosRoutes.js'
import areasRoutes from './areasRoutes.js'
import equiposRoutes from './equiposRoutes.js'
import productosRoutes from './productosRoutes.js'
import ventasRoutes from './ventasRoutes.js'
import googleAuthRoutes from './googleAuthRoutes.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(bodyParser.json())
app.use(cookieParser())

app.use('/', usuariosRoutes)
app.use('/', areasRoutes)
app.use('/', equiposRoutes)
app.use('/', productosRoutes)
app.use('/', ventasRoutes)
app.use('/', googleAuthRoutes)

const port = 3000
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
})