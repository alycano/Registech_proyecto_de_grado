const db = require('../config/db')

// LOGIN DE USUARIO
exports.login = (req, res) => {
    const { usuario, contrasena } = req.body

    if (!usuario || !contrasena) {
        return res.status(400).send('Usuario y contraseña son obligatorios')
    }

    db.query(
        'SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?',
        [usuario, contrasena],
        (err, results) => {
            if (err) {
                console.error('Error detallado en el Login de MySQL:', err)
                return res.status(500).send('Error en la consulta: ' + err.message)
            }

            if (results.length === 0) {
                return res.status(401).send('Usuario o contraseña incorrectos')
            }

            const usuarioEncontrado = results[0]
            res.status(200).send({
                mensaje: 'Login exitoso',
                usuario: {
                    usuario: usuarioEncontrado.usuario,
                    nombre: usuarioEncontrado.nombre,
                    area: usuarioEncontrado.area,
                    estado: usuarioEncontrado.estado
                }
            })
        }
    )
}

// OBTENER TODOS LOS USUARIOS
exports.getUsuarios = (req, res) => {
    db.query('SELECT usuario, nombre, area, correo, estado FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err)
            return res.status(500).send('Error en la consulta')
        }
        res.json(results)
    })
}

// AGREGAR UN NUEVO USUARIO
exports.createUsuario = (req, res) => {
    const { usuario, contrasena, nombre, area, correo, estado } = req.body

    if (!usuario || !contrasena || !nombre || !area || !correo) {
        return res.status(400).send('Todos los campos son obligatorios')
    }

    const estadoFinal = estado || 'activo'
    const query = `INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES (?, ?, ?, ?, ?, ?)`

    db.query(query, [usuario, contrasena, nombre, area, correo, estadoFinal], (err, results) => {
        if (err) {
            console.error('Error al agregar el usuario: ', err)
            return res.status(500).send('Error al agregar el usuario')
        }

        res.status(201).send({
            usuario, nombre, area, correo, estado: estadoFinal
        })
    })
}

// EDITAR UN USUARIO
exports.updateUsuario = (req, res) => {
    const { usuario: usuarioParam } = req.params
    const { usuario, contrasena, nombre, area, correo, estado } = req.body

    const query = `UPDATE usuarios SET usuario = ?, contrasena = ?, nombre = ?, area = ?, correo = ?, estado = ? WHERE usuario = ?`

    db.query(query, [usuario, contrasena, nombre, area, correo, estado, usuarioParam], (err, result) => {
        if (err) {
            console.error('Error al editar: ', err)
            return res.status(500).send('Error al editar el usuario')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado')
        }

        res.send('Usuario actualizado')
    })
}

// ELIMINAR UN USUARIO
exports.deleteUsuario = (req, res) => {
    const { usuario } = req.params
    const query = `DELETE FROM usuarios WHERE usuario = ?`

    db.query(query, [usuario], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err)
            return res.status(500).send('Error al eliminar el usuario')
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado')
        }

        res.send('Usuario eliminado')
    })
}
