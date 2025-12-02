import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory task storage implementation.
 * Uses a Map for O(1) lookups by ID.
 * Designed with methods that mirror database operations for easy migration to a real database.
 */
class TaskStore {
  constructor() {
    this.tasks = new Map();
    this._seedData();
  }

  /**
   * Seeds the store with sample tasks for demonstration purposes.
   */
  _seedData() {
    const sampleTasks = [
      {
        title: 'Set up project structure',
        description: 'Initialize the monorepo with backend and frontend folders',
        status: 'completed',
        priority: 'high',
        tags: ['setup', 'infrastructure'],
        dueDate: new Date(Date.now() - 86400000).toISOString()
      },
      {
        title: 'Implement REST API',
        description: 'Build all CRUD endpoints with proper validation',
        status: 'in_progress',
        priority: 'high',
        tags: ['backend', 'api'],
        dueDate: new Date(Date.now() + 86400000).toISOString()
      },
      {
        title: 'Design dashboard UI',
        description: 'Create mockups for the task management dashboard',
        status: 'todo',
        priority: 'medium',
        tags: ['frontend', 'design'],
        dueDate: new Date(Date.now() + 172800000).toISOString()
      },
      {
        title: 'Write unit tests',
        description: 'Add comprehensive test coverage for critical paths',
        status: 'todo',
        priority: 'low',
        tags: ['testing'],
        dueDate: null
      }
    ];

    sampleTasks.forEach(task => this.create(task));
  }

  /**
   * Creates a new task with auto-generated ID and timestamps.
   * @param {Object} taskData - The task data (title, description, etc.)
   * @returns {Object} The created task with all fields populated
   */
  create(taskData) {
    const now = new Date().toISOString();
    const task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(task.id, task);
    return { ...task };
  }

  /**
   * Retrieves a task by ID.
   * @param {string} id - The task ID
   * @returns {Object|null} The task or null if not found
   */
  findById(id) {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  /**
   * Retrieves all tasks with optional filtering, sorting, and pagination.
   * @param {Object} options - Query options
   * @returns {Object} Paginated results with metadata
   */
  findAll(options = {}) {
    const {
      status,
      priority,
      search,
      tags,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = options;

    let results = Array.from(this.tasks.values());

    // Filter by status
    if (status) {
      results = results.filter(task => task.status === status);
    }

    // Filter by priority
    if (priority) {
      results = results.filter(task => task.priority === priority);
    }

    // Filter by tags (comma-separated, matches tasks that have ANY of the specified tags)
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());
      results = results.filter(task => 
        task.tags && task.tags.some(taskTag => 
          tagList.includes(taskTag.toLowerCase())
        )
      );
    }

    // Filter by due date range
    if (dueDateFrom) {
      const fromDate = new Date(dueDateFrom);
      results = results.filter(task => 
        task.dueDate && new Date(task.dueDate) >= fromDate
      );
    }

    if (dueDateTo) {
      const toDate = new Date(dueDateTo);
      results = results.filter(task => 
        task.dueDate && new Date(task.dueDate) <= toDate
      );
    }

    // Search across title and description
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort results
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    results.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle null values for dueDate sorting
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // String comparison for dates and other strings
      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * sortMultiplier;
      }

      return (aVal - bVal) * sortMultiplier;
    });

    // Pagination
    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      tasks: paginatedResults.map(t => ({ ...t })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Updates an existing task.
   * @param {string} id - The task ID
   * @param {Object} updates - The fields to update
   * @returns {Object|null} The updated task or null if not found
   */
  update(id, updates) {
    const task = this.tasks.get(id);
    if (!task) {
      return null;
    }

    // Only update allowed fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const sanitizedUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    const updatedTask = {
      ...task,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(id, updatedTask);
    return { ...updatedTask };
  }

  /**
   * Deletes a task by ID.
   * @param {string} id - The task ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    return this.tasks.delete(id);
  }

  /**
   * Deletes multiple tasks by IDs.
   * @param {string[]} ids - Array of task IDs to delete
   * @returns {Object} Result with deleted count and any not found IDs
   */
  bulkDelete(ids) {
    const deleted = [];
    const notFound = [];

    for (const id of ids) {
      if (this.tasks.has(id)) {
        this.tasks.delete(id);
        deleted.push(id);
      } else {
        notFound.push(id);
      }
    }

    return { deleted, notFound, deletedCount: deleted.length };
  }

  /**
   * Updates status for multiple tasks.
   * @param {string[]} ids - Array of task IDs to update
   * @param {string} status - New status to set
   * @returns {Object} Result with updated tasks and any not found IDs
   */
  bulkUpdateStatus(ids, status) {
    const updated = [];
    const notFound = [];

    for (const id of ids) {
      const task = this.tasks.get(id);
      if (task) {
        const updatedTask = {
          ...task,
          status,
          updatedAt: new Date().toISOString()
        };
        this.tasks.set(id, updatedTask);
        updated.push({ ...updatedTask });
      } else {
        notFound.push(id);
      }
    }

    return { updated, notFound, updatedCount: updated.length };
  }

  /**
   * Gets task statistics including counts by status, priority, and overdue items.
   * @returns {Object} Statistics about tasks
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    const now = new Date();

    const stats = {
      total: tasks.length,
      byStatus: {
        todo: 0,
        in_progress: 0,
        completed: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0
      },
      overdue: 0
    };

    tasks.forEach(task => {
      // Count by status
      stats.byStatus[task.status]++;
      
      // Count by priority
      stats.byPriority[task.priority]++;
      
      // Count overdue (has due date, not completed, past due)
      if (task.dueDate && task.status !== 'completed') {
        const dueDate = new Date(task.dueDate);
        if (dueDate < now) {
          stats.overdue++;
        }
      }
    });

    return stats;
  }

  /**
   * Clears all tasks. Useful for testing.
   */
  clear() {
    this.tasks.clear();
  }
}

// Singleton instance for application-wide use
const taskStore = new TaskStore();

export default taskStore;
