import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../src/components/TaskCard';

const mockTask = {
  id: '123',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'todo',
  priority: 'medium',
  dueDate: '2025-12-31T23:59:59.000Z',
  tags: ['test', 'example'],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

describe('TaskCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders task description', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
  });

  it('renders status badge with correct text', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('renders due date', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Dec 31, 2025')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
  });

  it('calls onStatusChange when status badge is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('To Do'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('123', 'in_progress');
  });

  it('cycles through status correctly', () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' };
    render(
      <TaskCard
        task={inProgressTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('In Progress'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('123', 'completed');
  });

  it('shows overdue indicator for past due tasks', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: '2020-01-01T00:00:00.000Z',
      status: 'todo'
    };

    render(
      <TaskCard
        task={overdueTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not show overdue for completed tasks', () => {
    const completedPastTask = {
      ...mockTask,
      dueDate: '2020-01-01T00:00:00.000Z',
      status: 'completed'
    };

    render(
      <TaskCard
        task={completedPastTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('renders without tags when none provided', () => {
    const taskWithoutTags = { ...mockTask, tags: [] };
    render(
      <TaskCard
        task={taskWithoutTags}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('renders without due date when none provided', () => {
    const taskWithoutDueDate = { ...mockTask, dueDate: null };
    render(
      <TaskCard
        task={taskWithoutDueDate}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.queryByText('Dec 31, 2025')).not.toBeInTheDocument();
  });
});


