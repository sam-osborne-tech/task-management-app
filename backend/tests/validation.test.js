import request from 'supertest';
import app from '../src/index.js';
import taskStore from '../src/storage/taskStore.js';

/**
 * Validation tests for Task API.
 * Testing all the ways users can mess up their requests.
 */

describe('Task Validation', () => {
  beforeEach(() => {
    taskStore.clear();
  });

  describe('Title Validation', () => {
    it('should reject empty title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'title' })
        ])
      );
    });

    it('should reject whitespace-only title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });

    it('should trim title whitespace', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '  Valid Title  ' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Valid Title');
    });

    it('should reject title over 100 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'a'.repeat(101) });

      expect(res.status).toBe(400);
    });

    it('should accept title exactly 100 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'a'.repeat(100) });

      expect(res.status).toBe(201);
    });
  });

  describe('Description Validation', () => {
    it('should reject description over 500 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', description: 'a'.repeat(501) });

      expect(res.status).toBe(400);
    });

    it('should accept description exactly 500 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', description: 'a'.repeat(500) });

      expect(res.status).toBe(201);
    });
  });

  describe('Status Validation', () => {
    const validStatuses = ['todo', 'in_progress', 'completed'];

    validStatuses.forEach(status => {
      it(`should accept status: ${status}`, async () => {
        const res = await request(app)
          .post('/api/tasks')
          .send({ title: 'Test', status });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe(status);
      });
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', status: 'pending' });

      expect(res.status).toBe(400);
    });
  });

  describe('Priority Validation', () => {
    const validPriorities = ['low', 'medium', 'high'];

    validPriorities.forEach(priority => {
      it(`should accept priority: ${priority}`, async () => {
        const res = await request(app)
          .post('/api/tasks')
          .send({ title: 'Test', priority });

        expect(res.status).toBe(201);
        expect(res.body.data.priority).toBe(priority);
      });
    });

    it('should reject invalid priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', priority: 'critical' });

      expect(res.status).toBe(400);
    });
  });

  describe('Due Date Validation', () => {
    it('should accept valid ISO date', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', dueDate: '2025-12-31T23:59:59.000Z' });

      expect(res.status).toBe(201);
    });

    it('should accept null due date', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', dueDate: null });

      expect(res.status).toBe(201);
      expect(res.body.data.dueDate).toBeNull();
    });

    it('should reject invalid date format', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
    });
  });

  describe('Tags Validation', () => {
    it('should accept array of strings', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', tags: ['tag1', 'tag2'] });

      expect(res.status).toBe(201);
      expect(res.body.data.tags).toEqual(['tag1', 'tag2']);
    });

    it('should accept empty array', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', tags: [] });

      expect(res.status).toBe(201);
    });

    it('should reject non-array tags', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', tags: 'not-an-array' });

      expect(res.status).toBe(400);
    });

    it('should reject array with non-string elements', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', tags: ['valid', 123, 'also-valid'] });

      expect(res.status).toBe(400);
    });

    it('should reject more than 10 tags', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', tags: Array(11).fill('tag') });

      expect(res.status).toBe(400);
    });
  });

  describe('ID Parameter Validation', () => {
    it('should reject non-UUID ID for GET', async () => {
      const res = await request(app).get('/api/tasks/123');

      expect(res.status).toBe(400);
    });

    it('should reject non-UUID ID for PUT', async () => {
      const res = await request(app)
        .put('/api/tasks/invalid-id')
        .send({ title: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject non-UUID ID for DELETE', async () => {
      const res = await request(app).delete('/api/tasks/not-uuid');

      expect(res.status).toBe(400);
    });
  });

  describe('Query Parameter Validation', () => {
    it('should reject invalid sortBy field', async () => {
      const res = await request(app).get('/api/tasks?sortBy=invalid');

      expect(res.status).toBe(400);
    });

    it('should reject invalid sortOrder', async () => {
      const res = await request(app).get('/api/tasks?sortOrder=random');

      expect(res.status).toBe(400);
    });

    it('should reject page less than 1', async () => {
      const res = await request(app).get('/api/tasks?page=0');

      expect(res.status).toBe(400);
    });

    it('should reject limit greater than 100', async () => {
      const res = await request(app).get('/api/tasks?limit=101');

      expect(res.status).toBe(400);
    });

    it('should reject non-integer page', async () => {
      const res = await request(app).get('/api/tasks?page=abc');

      expect(res.status).toBe(400);
    });
  });
});

