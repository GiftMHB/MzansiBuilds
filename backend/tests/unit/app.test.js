const request = require('supertest');
const app = require('../../src/app');

describe('Health Check Endpoint', () => {
  test('GET /health should return 200 OK with correct message', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.message).toBe('MzansiBuilds API is running');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('API Rate Limiting', () => {
  test('Should have rate limiting on /api routes', async () => {
    // Make 101 requests quickly to test rate limit
    const requests = [];
    for (let i = 0; i < 101; i++) {
      requests.push(request(app).get('/api/test'));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(res => res.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});