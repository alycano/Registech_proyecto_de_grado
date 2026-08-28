require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcryptjs')
const db = require('../lib/db')

async function resetPasswords() {
    const usuarios = [
        { usuario: 'admin', contrasena: 'admin123' },
        { usuario: 'rh', contrasena: 'rh123' },
        { usuario: 'soporte', contrasena: 'soporte123' },
    ]

    for (const { usuario, contrasena } of usuarios) {
        const hash = bcrypt.hashSync(contrasena, 10)
        const result = await db.query('UPDATE usuarios SET contrasena = $1 WHERE usuario = $2 RETURNING usuario, correo', [hash, usuario])
        if (result.rows.length > 0) {
            console.log(`  OK: ${usuario} (${result.rows[0].correo}) -> ${contrasena}`)
        } else {
            console.log(`  SKIP: ${usuario} no existe en la DB`)
        }
    }

    await db.pool.end()
    console.log('\nListo. Ya puedes iniciar sesión.')
}

resetPasswords()
