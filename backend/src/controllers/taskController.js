import taskStore from '../storage/taskStore.js';
import { notFound } from '../middleware/errorHandler.js';

/**
 * Task Controller - handles HTTP request/response logic for task operations.
 */

/**
 * Get all tasks with filtering, sorting, and pagination.
 * GET /api/tasks
 */
export const getAllTasks = (req, res) => {
  const { status, priority, search, tags, dueDateFrom, dueDateTo, sortBy, sortOrder, page, limit } = req.query;
  
  const result = taskStore.findAll({
    status,
    priority,
    search,
    tags,
    dueDateFrom,
    dueDateTo,
    sortBy,
    sortOrder,
    page: page || 1,
    limit: limit || 10
  });

  res.json({
    success: true,
    data: result.tasks,
    pagination: result.pagination
  });
};

/**
 * Get a single task by ID.
 * GET /api/tasks/:id
 */
export const getTaskById = (req, res, next) => {
  const { id } = req.params;
  const task = taskStore.findById(id);

  if (!task) {
    return next(notFound('Task'));
  }

  res.json({
    success: true,
    data: task
  });
};

/**
 * Create a new task.
 * POST /api/tasks
 */
export const createTask = (req, res) => {
  const taskData = {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    tags: req.body.tags
  };

  const task = taskStore.create(taskData);

  // Emit real-time event
  req.app.locals.io?.emit('task:created', task);

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully'
  });
};

/**
 * Update an existing task.
 * PUT /api/tasks/:id
 */
export const updateTask = (req, res, next) => {
  const { id } = req.params;
  
  const existingTask = taskStore.findById(id);
  if (!existingTask) {
    return next(notFound('Task'));
  }

  const updates = {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    tags: req.body.tags
  };

  // Remove undefined values - only update fields that were sent
  Object.keys(updates).forEach(key => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  const updatedTask = taskStore.update(id, updates);

  // Emit real-time event
  req.app.locals.io?.emit('task:updated', updatedTask);

  res.json({
    success: true,
    data: updatedTask,
    message: 'Task updated successfully'
  });
};

/**
 * Delete a task.
 * DELETE /api/tasks/:id
 */
export const deleteTask = (req, res, next) => {
  const { id } = req.params;

  const existingTask = taskStore.findById(id);
  if (!existingTask) {
    return next(notFound('Task'));
  }

  taskStore.delete(id);

  // Emit real-time event
  req.app.locals.io?.emit('task:deleted', { id });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
};

/**
 * Get task statistics.
 * GET /api/tasks/stats
 */
export const getTaskStats = (req, res) => {
  const stats = taskStore.getStats();

  res.json({
    success: true,
    data: stats
  });
};

/**
 * Delete multiple tasks.
 * POST /api/tasks/bulk-delete
 */
export const bulkDeleteTasks = (req, res) => {
  const { ids } = req.body;
  
  const result = taskStore.bulkDelete(ids);

  // Emit real-time event for each deleted task
  req.app.locals.io?.emit('tasks:bulk-deleted', { ids: result.deleted });

  res.json({
    success: true,
    data: result,
    message: `Successfully deleted ${result.deletedCount} task(s)`
  });
};

/**
 * Update status for multiple tasks.
 * PATCH /api/tasks/bulk-status
 */
export const bulkUpdateStatus = (req, res) => {
  const { ids, status } = req.body;
  
  const result = taskStore.bulkUpdateStatus(ids, status);

  // Emit real-time event for bulk update
  req.app.locals.io?.emit('tasks:bulk-updated', { tasks: result.updated });

  res.json({
    success: true,
    data: result,
    message: `Successfully updated ${result.updatedCount} task(s)`
  });
};

/**
 * Export tasks as CSV or JSON.
 * GET /api/tasks/export
 */
export const exportTasks = (req, res) => {
  const { format = 'json' } = req.query;
  
  // Get all tasks without pagination for export
  const result = taskStore.findAll({ limit: 10000 });
  const tasks = result.tasks;

  if (format === 'csv') {
    // Generate CSV
    const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'tags', 'createdAt', 'updatedAt'];
    const csvRows = [headers.join(',')];
    
    for (const task of tasks) {
      const row = [
        task.id,
        `"${(task.title || '').replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.dueDate || '',
        `"${(task.tags || []).join(';')}"`,
        task.createdAt,
        task.updatedAt
      ];
      csvRows.push(row.join(','));
    }
    
    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    return res.send(csv);
  }

  // JSON export (default)
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=tasks.json');
  res.json({
    exportedAt: new Date().toISOString(),
    count: tasks.length,
    tasks
  });
};
