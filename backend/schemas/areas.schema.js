const { z } = require('zod');

const crearAreaSchema = z.object({
    body: z.object({
        area: z.string({ required_error: 'El nombre del departamento es obligatorio' })
            .min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres')
    })
});

const actualizarAreaSchema = z.object({
    params: z.object({
        area: z.string({ required_error: 'El departamento a modificar es obligatorio' }).min(1).max(100)
    }),
    body: z.object({
        area: z.string({ required_error: 'El nuevo nombre es obligatorio' })
            .min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres')
    })
});

module.exports = { crearAreaSchema, actualizarAreaSchema };
