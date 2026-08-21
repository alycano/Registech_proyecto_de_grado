const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        return res.status(400).json({
            error: 'Errores de validación',
            detalles: err.errors.map(e => ({ campo: e.path.join('.').replace('body.', '').replace('params.', ''), mensaje: e.message }))
        });
    }
};

module.exports = { validate };
