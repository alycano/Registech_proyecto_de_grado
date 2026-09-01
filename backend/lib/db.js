const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

// Manejador de errores del pool: evita que un error de conexión (ECONNRESET,
// timeout, etc.) derribe todo el servidor por un evento 'error' no manejado.
pool.on('error', (err) => {
    console.error('Error en el pool de base de datos (no fatal):', err.message || err)
})

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
};
