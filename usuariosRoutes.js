import express from 'express'
import db from './conexion.js'

const router = express.Router()

// RUTA PARA EL LOGIN
router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body
  if (!usuario || !contrasena) {
    return res.status(400).send('Usuario y contraseña son obligatorios')
  }

  db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?', [usuario, contrasena], (err, results) => {
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
  })
})

// RUTA PARA OBTENER TODOS LOS USUARIOS
router.get('/usuarios', (req, res) => {
  db.query('SELECT usuario, nombre, area, correo, estado FROM usuarios', (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err)
      return res.status(500).send('Error en la consulta')
    }
    res.json(results)
  })
})

// RUTA PARA AGREGAR UN NUEVO USUARIO
router.post('/usuarios', (req, res) => {
  const { usuario, contrasena, nombre, area, correo, estado } = req.body

  if (!usuario || !contrasena || !nombre || !area || !correo) {
    return res.status(400).send('Todos los campos son obligatorios')
  }

  const query = `INSERT INTO usuarios (usuario, contrasena, nombre, area, correo, estado) VALUES (?, ?, ?, ?, ?, ?)`

  db.query(query, [usuario, contrasena, nombre, area, correo, estado || 'activo'], (err, results) => {
    if (err) {
      console.error('Error al agregar el usuario: ', err)
      return res.status(500).send('Error al agregar el usuario')
    }

    res.status(200).send({
      usuario, nombre, area, correo, estado: estado || 'activo'
    })
  })
})

// RUTA PARA EDITAR UN USUARIO
router.put('/usuarios/:usuarioParam', (req, res) => {
  const { usuarioParam } = req.params
  const { usuario, contrasena, nombre, area, correo, estado } = req.body

  const query = `UPDATE usuarios SET usuario = ?, contrasena = ?, nombre = ?, area = ?, correo = ?, estado = ? WHERE usuario = ?`

  db.query(query, [usuario, contrasena, nombre, area, correo, estado, usuarioParam], (err, result) => {
    if (err) {
      console.error('Error al editar: ', err)
      return res.status(500).send('Error al editar el usuario')
    }

    res.send('Usuario actualizado')
  })
})

// RUTA PARA ELIMINAR UN USUARIO
router.delete('/usuarios/:usuario', (req, res) => {
  const { usuario } = req.params
  const query = `DELETE FROM usuarios WHERE usuario = ?`

  db.query(query, [usuario], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuario:', err)
      return res.status(500).send('Error al eliminar el usuario')
    }

    res.send('Usuario eliminado')
  })
})

export default router