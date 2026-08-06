require('dotenv').config()
const mysql = require('mysql2')

// CONFIGURACION DE LA CONEXION A LA BASE DE DATOS
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_final'
})

// CONECTAR A LA BASE DE DATOS
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message)
        return
    }

    console.log('Conectado a la base de datos MySQL')
})

module.exports = db
