const validate = (schema) => (req, res, next) => {
    const resultado = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!resultado.success) {
        return res.status(400).json({
            error: 'Errores de validación',
            detalles: (resultado.error.issues || []).map(e => ({
                campo: e.path.join('.').replace('body.', '').replace('params.', ''),
                mensaje: e.message
            }))
        });
    }

    next();
};

module.exports = { validate };
