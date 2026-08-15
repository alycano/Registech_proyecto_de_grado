const request = require('supertest');
const app = require('../index'); // Asegúrate de que tu archivo principal exporte app

describe('Pruebas de la API de RegisTech', () => {
  it('Debería responder correctamente a la ruta principal', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBeLessThan(500);
  });
  
  afterAll(done => {
    if (app.close) {
      app.close(done);
    } else {
      done();
    }
  });
});
