const request = require('supertest');
const app = require('../server/index');

describe('GET /api/health', () => {
  it('should return 200 and operational status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
  });
});
