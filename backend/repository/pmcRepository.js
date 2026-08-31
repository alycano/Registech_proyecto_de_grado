const { pool } = require('../lib/db');

class PMCRepository {
    async getAll() {
        const result = await pool.query('SELECT * FROM productos_menor_cuantia ORDER BY creado_en DESC');
        return result.rows;
    }

    async getById(id) {
        const result = await pool.query('SELECT * FROM productos_menor_cuantia WHERE id = $1', [id]);
        return result.rows[0];
    }

    async create(data) {
        const { nombre, descripcion, cantidad_total } = data;
        const result = await pool.query(
            'INSERT INTO productos_menor_cuantia (nombre, descripcion, cantidad_total, cantidad_disponible) VALUES ($1, $2, $3, $3) RETURNING *',
            [nombre, descripcion, cantidad_total]
        );
        return result.rows[0];
    }

    async update(id, data) {
        const { nombre, descripcion, cantidad_total, cantidad_disponible } = data;
        const result = await pool.query(
            'UPDATE productos_menor_cuantia SET nombre = $1, descripcion = $2, cantidad_total = $3, cantidad_disponible = $4 WHERE id = $5 RETURNING *',
            [nombre, descripcion, cantidad_total, cantidad_disponible, id]
        );
        return result.rows[0];
    }

    async delete(id) {
        await pool.query('DELETE FROM productos_menor_cuantia WHERE id = $1', [id]);
        return true;
    }

    async updateStock(id, newStock) {
        const result = await pool.query(
            'UPDATE productos_menor_cuantia SET cantidad_disponible = $1 WHERE id = $2 RETURNING *',
            [newStock, id]
        );
        return result.rows[0];
    }
}

module.exports = new PMCRepository();
