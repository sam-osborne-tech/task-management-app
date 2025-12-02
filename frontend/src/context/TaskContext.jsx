import { createContext, useContext, useReducer, useCallback } from 'react';
import { taskApi } from '../services/api';

const TaskContext = createContext(null);

const initialState = {
  tasks: [],
  stats: null,
  pagination: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  }
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload.tasks,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        stats: state.stats ? {
          ...state.stats,
          total: state.stats.total + 1,
          byStatus: {
            ...state.stats.byStatus,
            [action.payload.status]: state.stats.byStatus[action.payload.status] + 1
          },
          byPriority: {
            ...state.stats.byPriority,
            [action.payload.priority]: state.stats.byPriority[action.payload.priority] + 1
          }
        } : null
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: { ...initialState.filters }
      };
    
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const fetchTasks = useCallback(async (customFilters = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const filters = { ...state.filters, ...customFilters };
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
      );
      const response = await taskApi.getTasks(cleanFilters);
      dispatch({ type: 'SET_TASKS', payload: response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.filters]);

  const fetchStats = useCallback(async () => {
    try {
      const stats = await taskApi.getStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newTask = await taskApi.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      await fetchStats();
      return newTask;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [fetchStats]);

  const updateTask = useCallback(async (id, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedTask = await taskApi.updateTask(id, updates);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      dispatch({ type: 'SET_LOADING', payload: false });
      await fetchStats();
      return updatedTask;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [fetchStats]);

  const deleteTask = useCallback(async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await taskApi.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      await fetchStats();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [fetchStats]);

  const bulkDeleteTasks = useCallback(async (ids) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await taskApi.bulkDelete(ids);
      ids.forEach(id => dispatch({ type: 'DELETE_TASK', payload: id }));
      dispatch({ type: 'SET_LOADING', payload: false });
      await fetchStats();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [fetchStats]);

  const bulkUpdateStatus = useCallback(async (ids, status) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await taskApi.bulkUpdateStatus(ids, status);
      result.updated.forEach(task => dispatch({ type: 'UPDATE_TASK', payload: task }));
      dispatch({ type: 'SET_LOADING', payload: false });
      await fetchStats();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [fetchStats]);

  const setFilters = useCallback((newFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const value = {
    ...state,
    fetchTasks,
    fetchStats,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    bulkUpdateStatus,
    setFilters,
    resetFilters
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

export default TaskContext;

