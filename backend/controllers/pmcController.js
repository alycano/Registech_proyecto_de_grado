const pmcService = require('../services/pmcService');
const notificacionesService = require('../services/notificacionesService');

exports.obtenerTodos = async (req, res, next) => {
    const pmcs = await pmcService.obtenerTodos();
    res.json(pmcs);
};

exports.crearProducto = async (req, res, next) => {
    const nuevoProducto = await pmcService.crearProducto(req.body);
    res.status(201).json({ mensaje: 'Producto PMC creado exitosamente', producto: nuevoProducto });
};

exports.actualizarProducto = async (req, res, next) => {
    const productoActualizado = await pmcService.actualizarProducto(req.params.id, req.body);
    res.json({ mensaje: 'Producto PMC actualizado exitosamente', producto: productoActualizado });
};

exports.eliminarProducto = async (req, res, next) => {
    await pmcService.eliminarProducto(req.params.id);
    res.json({ mensaje: 'Producto PMC eliminado exitosamente' });
};

exports.entregarProducto = async (req, res, next) => {
    const producto = await pmcService.entregarProducto(req.params.id);
    await notificacionesService.notificarAdmins(
        'pmc',
        `El usuario ${req.usuario?.usuario || 'Sistema'} entregó 1 unidad del PMC: ${producto.nombre}.`
    );
    res.json({ mensaje: 'Stock restado (Entregado)', producto });
};

exports.devolverProducto = async (req, res, next) => {
    const producto = await pmcService.devolverProducto(req.params.id);
    await notificacionesService.notificarAdmins(
        'pmc',
        `El usuario ${req.usuario?.usuario || 'Sistema'} devolvió 1 unidad del PMC: ${producto.nombre}.`
    );
    res.json({ mensaje: 'Stock sumado (Devuelto)', producto });
};
