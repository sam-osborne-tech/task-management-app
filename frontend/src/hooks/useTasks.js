import { useState, useCallback } from 'react';
import { taskApi } from '../services/api';

/**
 * Custom hook for task operations.
 * Alternative to using TaskContext for components that need isolated task state.
 */
export function useTaskOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    setError(err.message || 'An error occurred');
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskApi.getTasks(filters);
      setLoading(false);
      return response;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const fetchTask = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const task = await taskApi.getTask(id);
      setLoading(false);
      return task;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const createTask = useCallback(async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await taskApi.createTask(taskData);
      setLoading(false);
      return newTask;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const updateTask = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await taskApi.updateTask(id, updates);
      setLoading(false);
      return updatedTask;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const deleteTask = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.deleteTask(id);
      setLoading(false);
      return id;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await taskApi.getStats();
      setLoading(false);
      return stats;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  return {
    loading,
    error,
    clearError,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    fetchStats
  };
}

export default useTaskOperations;


