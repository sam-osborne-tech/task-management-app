export function DeleteConfirmModal({ task, onConfirm, onCancel, isLoading }) {
  if (!task) return null;

  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Task</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-2">
        Are you sure you want to delete this task?
      </p>
      <p className="text-slate-800 dark:text-white font-semibold mb-6 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
        "{task.title}"
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        This action cannot be undone.
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Deleting...' : 'Delete Task'}
        </button>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
