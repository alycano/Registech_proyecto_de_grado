const { z } = require('zod');

const crearPrestamoSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1).max(50),
        usuario_destino: z.string({ required_error: 'El usuario destino es requerido' }).min(1).max(50),
        area: z.string().max(100).optional().nullable(),
        observaciones: z.string().max(500).optional().nullable(),
        fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable(),
        fecha_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable()
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
