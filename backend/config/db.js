require('dotenv').config()
const mysql = require('mysql2')

// CONFIGURACION DE LA CONEXION A LA BASE DE DATOS
// Se usa un pool de conexiones para que se recupere solo si una conexion se cae
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_final',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    flags: ['CLIENT_FOUND_ROWS']
})

// VERIFICAR QUE EL POOL PUEDA CONECTAR A LA BASE DE DATOS
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message)
        return
    }

    connection.release()
    console.log('Conectado a la base de datos MySQL')
})

module.exports = db
