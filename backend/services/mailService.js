const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function enviarCorreo({ para, asunto, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP no configurado. Correo no enviado a:', para)
        return { enviado: false, razon: 'SMTP no configurado' }
    }

    const info = await transporter.sendMail({
        from: `"Registech" <${process.env.SMTP_USER}>`,
        to: para,
        subject: asunto,
        html
    })

    return { enviado: true, messageId: info.messageId }
}

module.exports = { enviarCorreo };
