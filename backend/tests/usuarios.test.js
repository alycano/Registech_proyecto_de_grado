const request = require('supertest')
const app = require('../index')

let adminToken
let csrfToken
let cookies

beforeAll(async () => {
    const res = await request(app)
        .post('/api/login')
        .send({ correo: 'admin@registech.com', contrasena: 'admin123' })
    adminToken = res.body.token
    csrfToken = res.body.csrf_token

    const setCookies = res.headers['set-cookie']
    if (setCookies) {
        cookies = setCookies.map(c => c.split(';')[0]).join('; ')
    }
})

describe('GET /api/usuarios', () => {
    it('debería rechazar sin token', async () => {
        const res = await request(app).get('/api/usuarios')
        expect(res.status).toBe(401)
    })

    it('debería retornar lista de usuarios con token válido', async () => {
        const res = await request(app)
            .get('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThan(0)
    })

    it('usuarios no deberían incluir campo contrasena', async () => {
        const res = await request(app)
            .get('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        res.body.forEach(u => {
            expect(u.contrasena).toBeUndefined()
        })
    })
})

describe('GET /api/areas', () => {
    it('debería retornar lista de áreas con token', async () => {
        const res = await request(app)
            .get('/api/areas')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThan(0)
    })
})

describe('POST /api/usuarios (crear)', () => {
    it('debería crear o detectar usuario existente', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({
                usuario: 'testuser_e2e',
                contrasena: 'Test1234!',
                nombre: 'Usuario de Prueba',
                area: 'Tecnologia',
                correo: 'testuser_e2e@correo.com',
                estado: 'activo'
            })
        expect([200, 201, 409]).toContain(res.status)
    })

    it('debería rechazar si faltan campos obligatorios', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({ usuario: 'test' })
        expect(res.status).toBe(400)
    })
})
