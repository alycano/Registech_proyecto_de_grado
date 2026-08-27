const request = require('supertest')
const app = require('../index')

describe('Health Check', () => {
    it('GET /api/health debería responder con status 200', async () => {
        const res = await request(app).get('/api/health')
        expect(res.status).toBe(200)
        expect(res.body.ok).toBe(true)
        expect(res.body.servicio).toBe('Registech API')
    })

    it('GET /api/ruta-inexistente debería responder 404', async () => {
        const res = await request(app).get('/api/ruta-inexistente')
        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Ruta no encontrada')
    })
})
