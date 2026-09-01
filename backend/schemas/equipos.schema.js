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
        id_historial: z.string({ required_error: 'El id_historial es requerido' }).min(1).max(40),
        tecnico: z.string({ required_error: 'El técnico es requerido' }).min(1).max(50),
        solucion: z.string({ required_error: 'La solución es requerida' }).min(1).max(1000)
    })
});

const buscarMantenimientosSchema = z.object({
    body: z.object({
        filter: z.string({ required_error: 'El filtro es requerido' }).min(1, 'Se debe proporcionar al menos uno de los elementos').max(100)
    })
});

const decisionAprobacionSchema = z.object({
    body: z.object({
        id_historial: z.string({ required_error: 'El id_historial es requerido' }).min(1).max(40),
        decision: z.enum(['aprobada', 'rechazada'], { required_error: 'La decisión es requerida', invalid_type_error: 'Decisión inválida' })
    })
});

const crearEquipoSchema = z.object({
    body: z.object({
        num_serie: z.string({ required_error: 'El número de serie es requerido' }).min(1, 'El número de serie es requerido').max(50),
        equipo: z.string({ required_error: 'El nombre/modelo del equipo es requerido' }).min(1, 'El nombre/modelo es requerido').max(100),
        descripcion: z.string().max(500).optional().nullable(),
        sistema_operativo: z.string().max(60).optional().nullable(),
        area: z.string().max(100).optional().nullable(),
        fecha_adquisicion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)').optional().nullable(),
        estado: z.enum(['Disponible', 'En mantenimiento', 'Baja'], {
            errorMap: () => ({ message: 'Estado inicial inválido' })
        })
    })
});

module.exports = { asignarUsuarioSchema, reporteFallaSchema, resolverReporteSchema, buscarMantenimientosSchema, decisionAprobacionSchema, crearEquipoSchema };
