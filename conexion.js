import 'dotenv/config'
import mysql from 'mysql2'

// CONFIGURACIÓN DE LA CONEXIÓN A LA BASE DE DATOS
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_final'
}

const db = mysql.createConnection(dbConfig)

// CONECTAR A LA BASE DE DATOs
db.connect((err) => {
    if (err) {
        console.log('Error al conectar a la base de datos ', err)
        return
    }

    console.log('Conectado a la base de datos MySQL')
})

export default db