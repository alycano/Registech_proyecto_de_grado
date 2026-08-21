const { z } = require('zod');

const crearPrestamoSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1).max(50),
        usuario_destino: z.string({ required_error: 'El usuario destino es requerido' }).min(1).max(50),
        observaciones: z.string().max(500).optional().nullable()
    })
});

const devolverPrestamoSchema = z.object({
    params: z.object({
        id: z.string({ required_error: 'El id del préstamo es requerido' }).min(1).max(50)
    })
});

const historialEquipoSchema = z.object({
    params: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1).max(50)
    })
});

module.exports = { crearPrestamoSchema, devolverPrestamoSchema, historialEquipoSchema };
