import 'dotenv/config'
import mysql from 'mysql2'

<<<<<<< HEAD:conexion.js
// CONFIGURACIÓN DE LA CONEXIÓN A LA BASE DE DATOS
const dbConfig = {
=======
// CONFIGURACION DE LA CONEXION A LA BASE DE DATOS
const db = mysql.createConnection({
>>>>>>> upstream/main:backend/config/db.js
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_final'
})

<<<<<<< HEAD:conexion.js
const db = mysql.createConnection(dbConfig)

// CONECTAR A LA BASE DE DATOs
=======
// CONECTAR A LA BASE DE DATOS
>>>>>>> upstream/main:backend/config/db.js
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message)
        return
    }

    console.log('Conectado a la base de datos MySQL')
})

<<<<<<< HEAD:conexion.js
export default db
=======
module.exports = db
>>>>>>> upstream/main:backend/config/db.js
