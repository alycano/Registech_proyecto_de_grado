const request = require('supertest')
const app = require('../index')

describe('POST /api/login', () => {
    it('debería rechazar login sin campos', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({})
        expect(res.status).toBe(400)
    })

    it('debería rechazar credenciales incorrectas', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ correo: 'noexiste@correo.com', contrasena: 'wrong123' })
        expect(res.status).toBe(401)
        expect(res.body.error).toMatch(/incorrectos|inválidas/i)
    })

    it('debería rechazar contraseña incorrecta', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ correo: 'admin@registech.com', contrasena: 'wrongpass' })
        expect(res.status).toBe(401)
    })

    it('debería retornar token y usuario con credenciales válidas', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ correo: 'admin@registech.com', contrasena: 'admin123' })
        expect(res.status).toBe(200)
        expect(res.body.mensaje).toBe('Login exitoso')
        expect(res.body.token).toBeDefined()
        expect(res.body.usuario).toBeDefined()
        expect(res.body.usuario.rol).toBe('admin')
        expect(res.body.usuario.correo).toBe('admin@registech.com')
    })

    it('debería retornar cookie httpOnly con el token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ correo: 'admin@registech.com', contrasena: 'admin123' })
        expect(res.status).toBe(200)
        const cookies = res.headers['set-cookie']
        expect(cookies).toBeDefined()
        const tokenCookie = cookies.find(c => c.startsWith('token='))
        expect(tokenCookie).toBeDefined()
        expect(tokenCookie).toContain('HttpOnly')
    })

    it('debería retornar csrf_token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ correo: 'admin@registech.com', contrasena: 'admin123' })
        expect(res.status).toBe(200)
        expect(res.body.csrf_token).toBeDefined()
        expect(typeof res.body.csrf_token).toBe('string')
    })
})
