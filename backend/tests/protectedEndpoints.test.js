import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Protected API Endpoints Access Control', () => {
  it('GET /api/v1/auth/me should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/complaints/my should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/complaints/my');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/complaints should return 401 without session', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .send({ title: 'Test complaint title' });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/assignments/my-tasks should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/assignments/my-tasks');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/transfers/incoming should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/transfers/incoming');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/analytics/department should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/analytics/department');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/analytics/city should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/analytics/city');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notifications should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/sla/rules should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/sla/rules');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/escalations should return 401 without session', async () => {
    const res = await request(app).get('/api/v1/escalations');
    expect(res.status).toBe(401);
  });
});

