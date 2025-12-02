import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation middleware for task API endpoints.
 * Uses express-validator for input sanitization and validation.
 */

// Valid enum values - because we can't trust anyone to get these right
const VALID_STATUSES = ['todo', 'in_progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status'];
const VALID_EXPORT_FORMATS = ['csv', 'json'];

/**
 * Middleware to check validation results and return errors.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for creating a task.
 */
export const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be 100 characters or less'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  
  body('dueDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format. Use ISO 8601 format.');
      }
      return true;
    }),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.some(tag => typeof tag !== 'string')) {
        throw new Error('All tags must be strings');
      }
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for updating a task.
 */
export const updateTaskValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID format. Expected UUID.'),
  
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty if provided')
    .isLength({ max: 100 })
    .withMessage('Title must be 100 characters or less'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  
  body('dueDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return true;
    }),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags && tags.some(tag => typeof tag !== 'string')) {
        throw new Error('All tags must be strings');
      }
      if (tags && tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for task ID parameter.
 */
export const taskIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID format. Expected UUID.'),
  
  handleValidationErrors
];

/**
 * Validation rules for listing tasks with filters.
 */
export const listTasksValidation = [
  query('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status filter must be one of: ${VALID_STATUSES.join(', ')}`),
  
  query('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority filter must be one of: ${VALID_PRIORITIES.join(', ')}`),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be 100 characters or less'),
  
  query('tags')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tags filter must be 200 characters or less'),
  
  query('dueDateFrom')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid dueDateFrom format. Use ISO 8601 format.');
      }
      return true;
    }),
  
  query('dueDateTo')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid dueDateTo format. Use ISO 8601 format.');
      }
      return true;
    }),
  
  query('sortBy')
    .optional()
    .isIn(VALID_SORT_FIELDS)
    .withMessage(`Sort field must be one of: ${VALID_SORT_FIELDS.join(', ')}`),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be "asc" or "desc"'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validation rules for bulk delete operations.
 */
export const bulkDeleteValidation = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('ids must be an array with 1-100 items'),
  
  body('ids.*')
    .isUUID()
    .withMessage('Each id must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Validation rules for bulk status update.
 */
export const bulkStatusValidation = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('ids must be an array with 1-100 items'),
  
  body('ids.*')
    .isUUID()
    .withMessage('Each id must be a valid UUID'),
  
  body('status')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  
  handleValidationErrors
];

/**
 * Validation rules for export.
 */
export const exportValidation = [
  query('format')
    .optional()
    .isIn(VALID_EXPORT_FORMATS)
    .withMessage(`Format must be one of: ${VALID_EXPORT_FORMATS.join(', ')}`),
  
  handleValidationErrors
];
