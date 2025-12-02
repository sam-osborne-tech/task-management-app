import { useState, useCallback, useMemo } from 'react';

export function useFilters(initialFilters = {}) {
  const defaultFilters = {
    status: '',
    priority: '',
    search: '',
    tags: '',
    dueDateFrom: '',
    dueDateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
    ...initialFilters
  };

  const [filters, setFiltersState] = useState(defaultFilters);

  const setFilter = useCallback((key, value) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change
      ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {})
    }));
  }, []);

  const setFilters = useCallback((newFilters) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (unless page is being set)
      ...(!('page' in newFilters) ? { page: 1 } : {})
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setFiltersState(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const setSortBy = useCallback((field) => {
    setFiltersState(prev => ({
      ...prev,
      sortBy: field,
      // Toggle order if same field, otherwise default to desc
      sortOrder: prev.sortBy === field ? (prev.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
    }));
  }, []);

  const setPage = useCallback((page) => {
    setFiltersState(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setFiltersState(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const prevPage = useCallback(() => {
    setFiltersState(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.search) count++;
    if (filters.tags) count++;
    if (filters.dueDateFrom) count++;
    if (filters.dueDateTo) count++;
    return count;
  }, [filters.status, filters.priority, filters.search, filters.tags, filters.dueDateFrom, filters.dueDateTo]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    toggleSortOrder,
    setSortBy,
    setPage,
    nextPage,
    prevPage,
    activeFilterCount
  };
}

export default useFilters;

