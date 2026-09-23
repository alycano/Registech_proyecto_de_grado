const fs = require('fs');
let code = fs.readFileSync('backend/services/notificacionesService.js', 'utf8');

if (!code.includes('const emailService')) {
    code = code.replace(
        "const prisma = require('../lib/prisma')",
        "const prisma = require('../lib/prisma')\nconst emailService = require('./emailService')"
    );
}

const emailLogic = `
            await notificacionesRepository.crear({
                usuario: admin.usuario,
                tipo,
                mensaje
            })
            
            // Enviar correo de alerta al admin en background
            if (admin.correo) {
                emailService.enviarCorreo({
                    para: admin.correo,
                    asunto: \`Registech - Alerta de Sistema: \${tipo}\`,
                    html: \`
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                            <h2 style="color: #2b3a4a; text-align: center;">Alerta de Registech</h2>
                            <p style="font-size: 16px; color: #333;">Hola <strong>\${admin.nombre}</strong>,</p>
                            <p style="font-size: 16px; color: #333;">Se ha registrado una nueva actividad en el sistema:</p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0d6efd; margin: 20px 0;">
                                <p style="margin: 0; font-size: 16px;">\${mensaje}</p>
                            </div>
                            <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
                                Puedes revisar más detalles ingresando al panel de administración.
                            </p>
                        </div>
                    \`
                }).catch(err => console.error("Error enviando correo a admin:", err.message))
            }
`;

code = code.replace(
    /await notificacionesRepository\.crear\(\{\s*usuario: admin\.usuario,\s*tipo,\s*mensaje\s*\}\)/,
    emailLogic
);

fs.writeFileSync('backend/services/notificacionesService.js', code);
