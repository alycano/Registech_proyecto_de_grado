const db = require('../config/db')

// OBTENER TODAS LAS AREAS
exports.getAreas = (req, res) => {
    db.query('SELECT * FROM areas', (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}
