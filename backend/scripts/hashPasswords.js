require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const bcrypt = require('bcryptjs')
const db = require('../lib/db')

async function hashExistingPasswords() {
    try {
        const { rows } = await db.query('SELECT usuario, contrasena FROM usuarios')
        let updated = 0

        for (const user of rows) {
            if (user.contrasena && !user.contrasena.startsWith('$2')) {
                const hash = bcrypt.hashSync(user.contrasena, 10)
                await db.query('UPDATE usuarios SET contrasena = $1 WHERE usuario = $2', [hash, user.usuario])
                console.log(`  Hasheada: ${user.usuario} (${user.contrasena} -> bcrypt)`)
                updated++
            }
        }

        if (updated === 0) {
            console.log('  Todas las contraseñas ya están hasheadas.')
        } else {
            console.log(`\n  Listo. ${updated} contraseña(s) hasheada(s).`)
        }
    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        await db.pool.end()
    }
}

hashExistingPasswords()
