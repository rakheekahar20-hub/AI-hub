const request = require('supertest');
const app = require('../app');

test('GET /api/github/repos returns repositories', async () => {
  const response = await request(app).get('/api/github/repos');
  expect(response.status).toBe(200);
});