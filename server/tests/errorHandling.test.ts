import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { db } from '../src/db/index.js';

describe('global error-handling middleware', () => {
  it('catches a synchronous throw from a route and returns a consistent 500 payload', async () => {
    const spy = vi.spyOn(db, 'select').mockImplementation(() => {
      throw new Error('boom');
    });
    try {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    } finally {
      spy.mockRestore();
    }
  });
});
