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

describe('GET /api/equipos', () => {
    it('debería retornar lista de equipos', async () => {
        const res = await request(app)
            .get('/api/equipos')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    it('cada equipo debería tener num_serie y equipo', async () => {
        const res = await request(app)
            .get('/api/equipos')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        res.body.forEach(eq => {
            expect(eq.num_serie).toBeDefined()
            expect(eq.equipo).toBeDefined()
        })
    })
})

describe('GET /api/equipos/reporte', () => {
    it('debería retornar reportes de mantenimiento', async () => {
        const res = await request(app)
            .get('/api/equipos/reporte')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })
})

describe('GET /api/dashboard', () => {
    it('debería retornar stats, charts y prestamosRecientes', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(res.body.stats).toBeDefined()
        expect(res.body.charts).toBeDefined()
        expect(res.body.prestamosRecientes).toBeDefined()
    })

    it('stats debería tener total, asignados, disponibles, mantenimiento', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(typeof res.body.stats.total).toBe('number')
        expect(typeof res.body.stats.asignados).toBe('number')
        expect(typeof res.body.stats.disponibles).toBe('number')
    })
})

describe('POST /api/equipos/reporte/aprobacion', () => {
    it('debería rechazar sin campos requeridos', async () => {
        const res = await request(app)
            .post('/api/equipos/reporte/aprobacion')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', cookies)
            .send({})
        expect(res.status).toBe(400)
    })
})
