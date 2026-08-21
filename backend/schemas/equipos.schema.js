const { z } = require('zod');

const asignarUsuarioSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1, 'No puede estar vacío').max(50),
        usuario: z.string().max(50).optional().nullable()
    })
});

const reporteFallaSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1).max(50),
        falla: z.string({ required_error: 'La falla es requerida' }).min(1).max(500)
    })
});

const resolverReporteSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1).max(50),
        id_historial: z.string({ required_error: 'El id_historial es requerido' }).min(1).max(30),
        tecnico: z.string({ required_error: 'El técnico es requerido' }).min(1).max(50),
        solucion: z.string({ required_error: 'La solución es requerida' }).min(1).max(1000)
    })
});

const buscarMantenimientosSchema = z.object({
    body: z.object({
        filter: z.string({ required_error: 'El filtro es requerido' }).min(1, 'Se debe proporcionar al menos uno de los elementos').max(100)
    })
});

module.exports = { asignarUsuarioSchema, reporteFallaSchema, resolverReporteSchema, buscarMantenimientosSchema };
