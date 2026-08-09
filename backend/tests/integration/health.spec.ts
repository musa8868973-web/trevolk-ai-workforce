import request from 'supertest';

import { createApp } from '../../src/app';

describe('GET /api/v1/health', () => {
  const app = createApp();

  it('returns 200 with a healthy status envelope', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeDefined();
  });
});

describe('GET /api/v1/unknown-route', () => {
  const app = createApp();

  it('returns a standardized 404 error envelope', async () => {
    const response = await request(app).get('/api/v1/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe('NOT_FOUND');
  });
});
