import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import db from './conexion.js'

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/auth/google', async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    return res.status(400).json({ error: 'Falta el credential' })
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    db.query(
      'SELECT * FROM usuarios WHERE google_id = ? OR correo = ?',
      [googleId, email],
      (err, results) => {
        if (err) {
          console.error('Error buscando usuario de Google:', err)
          return res.status(500).json({ error: 'Error en la consulta' })
        }

        const generarTokenYResponder = (usuario) => {
          const token = jwt.sign(
            { id: usuario.id_usuario, correo: usuario.correo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          )

          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
          })

          res.json({
            usuario: {
              id: usuario.id_usuario,
              correo: usuario.correo,
              nombre: usuario.nombre,
              area: usuario.area,
              estado: usuario.estado,
              foto: usuario.foto_url || picture
            }
          })
        }

        if (results.length > 0) {
          const usuarioExistente = results[0]
          db.query(
            'UPDATE usuarios SET google_id = ?, nombre = ?, foto_url = ? WHERE id_usuario = ?',
            [googleId, name, picture, usuarioExistente.id_usuario],
            (errUpdate) => {
              if (errUpdate) {
                console.error('Error actualizando usuario de Google:', errUpdate)
                return res.status(500).json({ error: 'Error al actualizar usuario' })
              }
              generarTokenYResponder({ ...usuarioExistente, nombre: name, foto_url: picture })
            }
          )
        } else {
          db.query(
            'INSERT INTO usuarios (google_id, correo, nombre, foto_url, estado) VALUES (?, ?, ?, ?, ?)',
            [googleId, email, name, picture, 'activo'],
            (errInsert, resultInsert) => {
              if (errInsert) {
                console.error('Error creando usuario de Google:', errInsert)
                return res.status(500).json({ error: 'Error al crear usuario' })
              }
              generarTokenYResponder({
                id_usuario: resultInsert.insertId,
                correo: email,
                nombre: name,
                area: null,
                estado: 'activo',
                foto_url: picture
              })
            }
          )
        }
      }
    )
  } catch (error) {
    console.error('Error en login con Google:', error)
    res.status(401).json({ error: 'Token inválido' })
  }
})

export default router