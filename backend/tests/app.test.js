import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('NagrikSeva Express App Routes', () => {
  it('GET / should return platform overview', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('NagrikSeva API');
    expect(res.body.endpoints).toBe('/api/v1');
  });

  it('GET /api/v1/health should return health check', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
  });

  it('GET /api/v1/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/session should return unauthenticated status when no session', async () => {
    const res = await request(app).get('/api/v1/auth/session');
    expect(res.status).toBe(200);
    expect(res.body.data.authenticated).toBe(false);
  });

  it('POST /api/v1/auth/login should fail validation on missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

