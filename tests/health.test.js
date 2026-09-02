import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /health', () => {
  it('returns status 200 with { status: "running" } without auth', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'running',
    });
  });

  it('does not require authorization header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
