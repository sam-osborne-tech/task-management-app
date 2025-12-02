export function StatsPanel({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const completionRate = stats.total > 0 
    ? Math.round((stats.byStatus.completed / stats.total) * 100) 
    : 0;

  const statCards = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
      ),
      value: stats.total,
      label: 'Total Tasks',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      value: stats.byStatus.todo,
      label: 'To Do',
      color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
      ),
      value: stats.byStatus.in_progress,
      label: 'In Progress',
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      value: stats.byStatus.completed,
      label: 'Completed',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      value: stats.overdue,
      label: 'Overdue',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
            <div className="w-5 h-5">{stat.icon}</div>
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
        </div>
      ))}

      {/* Completion Rate Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Completion</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{completionRate}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
