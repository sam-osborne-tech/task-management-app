import request from 'supertest';
import app from '../src/index.js';
import taskStore from '../src/storage/taskStore.js';

/**
 * Integration tests for Task API endpoints.
 * Testing everything because trust is earned, not given.
 */

describe('Task API', () => {
  // Reset store before each test - clean slate philosophy
  beforeEach(() => {
    taskStore.clear();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('running');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with required fields', async () => {
      const taskData = {
        title: 'Test Task'
      };

      const res = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('todo');
      expect(res.body.data.priority).toBe('medium');
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('should create a task with all fields', async () => {
      const taskData = {
        title: 'Complete Task',
        description: 'A fully specified task',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-12-31T23:59:59.000Z',
        tags: ['important', 'urgent']
      };

      const res = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Complete Task');
      expect(res.body.data.description).toBe('A fully specified task');
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.tags).toEqual(['important', 'urgent']);
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ description: 'No title here' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject task with title exceeding 100 chars', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'x'.repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task with invalid status', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task with invalid priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test', priority: 'super_high' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(() => {
      // Seed some tasks for listing tests
      taskStore.create({ title: 'Task 1', status: 'todo', priority: 'low' });
      taskStore.create({ title: 'Task 2', status: 'in_progress', priority: 'medium' });
      taskStore.create({ title: 'Task 3', status: 'completed', priority: 'high' });
    });

    it('should return all tasks', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app).get('/api/tasks?status=todo');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('todo');
    });

    it('should filter by priority', async () => {
      const res = await request(app).get('/api/tasks?priority=high');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('high');
    });

    it('should search by title', async () => {
      const res = await request(app).get('/api/tasks?search=Task%201');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Task 1');
    });

    it('should paginate results', async () => {
      const res = await request(app).get('/api/tasks?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalCount).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.pagination.hasNextPage).toBe(true);
    });

    it('should sort by field ascending', async () => {
      const res = await request(app).get('/api/tasks?sortBy=title&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('Task 1');
      expect(res.body.data[2].title).toBe('Task 3');
    });

    it('should reject invalid status filter', async () => {
      const res = await request(app).get('/api/tasks?status=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by ID', async () => {
      const created = taskStore.create({ title: 'Find Me' });

      const res = await request(app).get(`/api/tasks/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Find Me');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/api/tasks/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app).get('/api/tasks/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const created = taskStore.create({ title: 'Original Title' });

      const res = await request(app)
        .put(`/api/tasks/${created.id}`)
        .send({ title: 'Updated Title', status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('completed');
    });

    it('should partially update a task', async () => {
      const created = taskStore.create({ 
        title: 'Original', 
        description: 'Keep this',
        priority: 'low'
      });

      const res = await request(app)
        .put(`/api/tasks/${created.id}`)
        .send({ priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Original');
      expect(res.body.data.description).toBe('Keep this');
      expect(res.body.data.priority).toBe('high');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/api/tasks/00000000-0000-0000-0000-000000000000')
        .send({ title: 'New Title' });

      expect(res.status).toBe(404);
    });

    it('should update updatedAt timestamp', async () => {
      const created = taskStore.create({ title: 'Test' });
      const originalUpdatedAt = created.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const res = await request(app)
        .put(`/api/tasks/${created.id}`)
        .send({ title: 'Updated' });

      expect(res.body.data.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const created = taskStore.create({ title: 'Delete Me' });

      const res = await request(app).delete(`/api/tasks/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify task is gone
      const getRes = await request(app).get(`/api/tasks/${created.id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).delete('/api/tasks/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/tasks/stats', () => {
    beforeEach(() => {
      taskStore.create({ title: 'Todo 1', status: 'todo', priority: 'low' });
      taskStore.create({ title: 'Todo 2', status: 'todo', priority: 'medium' });
      taskStore.create({ title: 'In Progress', status: 'in_progress', priority: 'high' });
      taskStore.create({ title: 'Completed', status: 'completed', priority: 'high' });
      // Overdue task
      taskStore.create({ 
        title: 'Overdue', 
        status: 'todo', 
        priority: 'high',
        dueDate: new Date(Date.now() - 86400000).toISOString() // yesterday
      });
    });

    it('should return task statistics', async () => {
      const res = await request(app).get('/api/tasks/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(5);
      expect(res.body.data.byStatus.todo).toBe(3);
      expect(res.body.data.byStatus.in_progress).toBe(1);
      expect(res.body.data.byStatus.completed).toBe(1);
      expect(res.body.data.byPriority.low).toBe(1);
      expect(res.body.data.byPriority.medium).toBe(1);
      expect(res.body.data.byPriority.high).toBe(3);
      expect(res.body.data.overdue).toBe(1);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});


