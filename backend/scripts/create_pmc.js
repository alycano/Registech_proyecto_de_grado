require('dotenv').config();
const { pool } = require('../lib/db');

async function createPMCTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS productos_menor_cuantia (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                cantidad_total INTEGER DEFAULT 0,
                cantidad_disponible INTEGER DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabla productos_menor_cuantia creada con exito.');
    } catch (error) {
        console.error('Error creando la tabla:', error);
    } finally {
        pool.end();
    }
}

createPMCTable();
