import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  bulkDeleteTasks,
  bulkUpdateStatus,
  exportTasks
} from '../controllers/taskController.js';
import {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  listTasksValidation,
  bulkDeleteValidation,
  bulkStatusValidation,
  exportValidation
} from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Task routes - RESTful endpoints for task management.
 */
const router = Router();

// Stats endpoint - placed before /:id to avoid route conflicts
router.get('/stats', asyncHandler(getTaskStats));

// Export tasks as CSV or JSON
router.get('/export', exportValidation, asyncHandler(exportTasks));

// Bulk operations - placed before /:id to avoid route conflicts
router.post('/bulk-delete', bulkDeleteValidation, asyncHandler(bulkDeleteTasks));
router.patch('/bulk-status', bulkStatusValidation, asyncHandler(bulkUpdateStatus));

// List all tasks with optional filters
router.get('/', listTasksValidation, asyncHandler(getAllTasks));

// Get single task by ID
router.get('/:id', taskIdValidation, asyncHandler(getTaskById));

// Create new task
router.post('/', createTaskValidation, asyncHandler(createTask));

// Update existing task
router.put('/:id', updateTaskValidation, asyncHandler(updateTask));

// Delete task
router.delete('/:id', taskIdValidation, asyncHandler(deleteTask));

export default router;
