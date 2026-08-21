const { z } = require('zod');

const loginSchema = z.object({
    body: z.object({
        usuario: z.string({ required_error: 'El usuario es obligatorio' }).min(1, 'El usuario no puede estar vacío').max(50),
        contrasena: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña no puede estar vacía').max(128)
    })
});

const crearUsuarioSchema = z.object({
    body: z.object({
        usuario: z.string({ required_error: 'El usuario es obligatorio' }).min(3, 'Mínimo 3 caracteres').max(50),
        contrasena: z.string({ required_error: 'La contraseña es obligatoria' }).min(6, 'Mínimo 6 caracteres').max(128),
        nombre: z.string({ required_error: 'El nombre es obligatorio' }).max(200),
        area: z.string({ required_error: 'El área es obligatoria' }).max(100),
        correo: z.string({ required_error: 'El correo es obligatorio' }).email('Debe ser un correo válido').max(50),
        estado: z.string().optional()
    })
});

const actualizarUsuarioSchema = z.object({
    params: z.object({
        usuario: z.string({ required_error: 'El parámetro usuario es obligatorio' })
    }),
    body: z.object({
        usuario: z.string({ required_error: 'El usuario es obligatorio' }).max(50),
        contrasena: z.string({ required_error: 'La contraseña es obligatoria' }).min(6).max(128),
        nombre: z.string({ required_error: 'El nombre es obligatorio' }).max(200),
        area: z.string({ required_error: 'El área es obligatoria' }).max(100),
        correo: z.string({ required_error: 'El correo es obligatorio' }).email('Debe ser un correo válido').max(50),
        estado: z.string().optional()
    })
});

module.exports = { loginSchema, crearUsuarioSchema, actualizarUsuarioSchema };
