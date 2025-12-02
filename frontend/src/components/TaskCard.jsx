import { useState } from 'react';

const STATUS_CONFIG = {
  todo: { label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-l-emerald-500' },
  medium: { label: 'Medium', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-l-amber-500' },
  high: { label: 'High', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-l-red-500' }
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange, selectable, selected, onToggleSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'completed';

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = { todo: 'in_progress', in_progress: 'completed', completed: 'todo' };
    return statusFlow[currentStatus];
  };

  const status = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <article 
      className={`
        relative bg-white dark:bg-slate-800 rounded-xl p-5 border-l-4 ${priority.border}
        shadow-sm hover:shadow-md transition-all duration-200
        ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
        ${selectable ? 'cursor-pointer' : ''}
        ${isOverdue ? 'bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-red-900/10' : ''}
      `}
      onClick={selectable ? onToggleSelect : undefined}
    >
      {selectable && (
        <div className="absolute top-4 right-4">
          <input 
            type="checkbox" 
            checked={selected} 
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, getNextStatus(task.status)); }}
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${status.bg} ${status.text} hover:opacity-80 transition-opacity`}
        >
          {status.label}
        </button>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 pr-8">{task.title}</h3>

      {/* Description */}
      {task.description && (
        <>
          <p className={`text-slate-600 dark:text-slate-400 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {task.description}
          </p>
          {task.description.length > 100 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 hover:underline"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className={`flex items-center gap-2 mt-3 text-sm ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">Overdue</span>
          )}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {task.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
