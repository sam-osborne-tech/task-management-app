import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';
import { taskApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { TaskList } from '../components/TaskList';
import { TaskFilters } from '../components/TaskFilters';
import { TaskForm } from '../components/TaskForm';
import { StatsPanel } from '../components/StatsPanel';
import { Modal } from '../components/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export function Dashboard() {
  const {
    tasks,
    stats,
    pagination,
    loading,
    error,
    filters,
    fetchTasks,
    fetchStats,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    bulkUpdateStatus,
    setFilters
  } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // WebSocket for real-time updates
  const handleWsTaskCreated = useCallback(() => {
    fetchTasks(filters);
    fetchStats();
  }, [fetchTasks, fetchStats, filters]);

  const handleWsTaskUpdated = useCallback(() => {
    fetchTasks(filters);
    fetchStats();
  }, [fetchTasks, fetchStats, filters]);

  const handleWsTaskDeleted = useCallback(() => {
    fetchTasks(filters);
    fetchStats();
  }, [fetchTasks, fetchStats, filters]);

  const { connected } = useWebSocket(
    handleWsTaskCreated,
    handleWsTaskUpdated,
    handleWsTaskDeleted,
    handleWsTaskDeleted,
    handleWsTaskUpdated
  );

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchTasks(filters);
  }, [filters, fetchTasks]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      status: '',
      priority: '',
      search: '',
      tags: '',
      dueDateFrom: '',
      dueDateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1
    });
  }, [setFilters]);

  const handlePageChange = useCallback((page) => {
    setFilters({ page });
  }, [setFilters]);

  const handleCreateClick = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (task) => {
    setDeletingTask(task);
    setIsDeleteOpen(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleFormSubmit = async (taskData) => {
    setFormLoading(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      setIsFormOpen(false);
      setEditingTask(null);
      fetchTasks(filters);
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    setFormLoading(true);
    try {
      await deleteTask(deletingTask.id);
      setIsDeleteOpen(false);
      setDeletingTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteOpen(false);
    setDeletingTask(null);
  };

  const handleBulkDelete = async (ids) => {
    try {
      await bulkDeleteTasks(ids);
      fetchTasks(filters);
    } catch (err) {
      console.error('Failed to bulk delete tasks:', err);
    }
  };

  const handleBulkStatusChange = async (ids, status) => {
    try {
      await bulkUpdateStatus(ids, status);
      fetchTasks(filters);
    } catch (err) {
      console.error('Failed to bulk update status:', err);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await taskApi.exportTasks(format);
      
      if (format === 'csv') {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Failed to export tasks:', err);
    }
  };

  const activeFilterCount = [filters.status, filters.priority, filters.search, filters.tags, filters.dueDateFrom, filters.dueDateTo]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">Task Manager</h1>
              {connected && (
                <span className="flex items-center gap-1 text-xs text-green-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            <p className="text-indigo-200 mt-1">Organize your work, boost your productivity</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => handleExport('json')} className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg">
                  Export as JSON
                </button>
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg">
                  Export as CSV
                </button>
              </div>
            </div>
            {/* Create Button */}
            <button 
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Overview</h2>
          <StatsPanel stats={stats} loading={!stats && loading} />
        </section>

        {/* Tasks Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Tasks</h2>
          
          <TaskFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            activeCount={activeFilterCount}
          />

          <TaskList
            tasks={tasks}
            pagination={pagination}
            loading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onStatusChange={handleStatusChange}
            onPageChange={handlePageChange}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
          />
        </section>
      </main>

      {/* Modals */}
      <Modal isOpen={isFormOpen} onClose={handleFormCancel}>
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={handleDeleteCancel}>
        <DeleteConfirmModal
          task={deletingTask}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;
