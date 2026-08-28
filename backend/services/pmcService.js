const pmcRepository = require('../repository/pmcRepository');
const AppError = require('../utils/AppError');

class PMCService {
    async obtenerTodos() {
        return await pmcRepository.getAll();
    }

    async crearProducto(data) {
        if (!data.nombre || !data.cantidad_total) {
            throw new AppError('El nombre y la cantidad total son obligatorios', 400);
        }
        return await pmcRepository.create(data);
    }

    async actualizarProducto(id, data) {
        const producto = await pmcRepository.getById(id);
        if (!producto) {
            throw new AppError('Producto PMC no encontrado', 404);
        }
        return await pmcRepository.update(id, data);
    }

    async eliminarProducto(id) {
        const producto = await pmcRepository.getById(id);
        if (!producto) {
            throw new AppError('Producto PMC no encontrado', 404);
        }
        return await pmcRepository.delete(id);
    }

    async entregarProducto(id) {
        const producto = await pmcRepository.getById(id);
        if (!producto) {
            throw new AppError('Producto PMC no encontrado', 404);
        }
        if (producto.cantidad_disponible <= 0) {
            throw new AppError('No hay stock disponible para entregar este producto', 400);
        }
        return await pmcRepository.updateStock(id, producto.cantidad_disponible - 1);
    }

    async devolverProducto(id) {
        const producto = await pmcRepository.getById(id);
        if (!producto) {
            throw new AppError('Producto PMC no encontrado', 404);
        }
        if (producto.cantidad_disponible >= producto.cantidad_total) {
            throw new AppError('El stock disponible no puede ser mayor al stock total adquirido', 400);
        }
        return await pmcRepository.updateStock(id, producto.cantidad_disponible + 1);
    }
}

module.exports = new PMCService();
