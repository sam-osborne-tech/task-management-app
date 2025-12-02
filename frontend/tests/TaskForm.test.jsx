import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../src/components/TaskForm';

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form when no task provided', () => {
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  it('renders edit form when task provided', () => {
    const task = {
      id: '123',
      title: 'Existing Task',
      description: 'Description',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2025-12-31T00:00:00.000Z',
      tags: ['tag1', 'tag2']
    };

    render(
      <TaskForm
        task={task}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('Update Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
  });

  it('shows validation error for empty title', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.click(screen.getByText('Create Task'));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.type(screen.getByLabelText(/description/i), 'Task description');
    await user.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'Task description',
          status: 'todo',
          priority: 'medium'
        })
      );
    });
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables inputs when loading', () => {
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows character count for title', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'Test');
    expect(screen.getByText('4/100')).toBeInTheDocument();
  });

  it('shows character count for description', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/description/i), 'Test desc');
    expect(screen.getByText('9/500')).toBeInTheDocument();
  });

  it('parses tags correctly', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.type(screen.getByLabelText(/tags/i), 'tag1, tag2, tag3');
    await user.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3']
        })
      );
    });
  });

  it('handles empty tags correctly', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: []
        })
      );
    });
  });

  it('populates form with existing task data', () => {
    const task = {
      id: '123',
      title: 'Edit Me',
      description: 'Edit description',
      status: 'completed',
      priority: 'low',
      dueDate: '2025-06-15T00:00:00.000Z',
      tags: ['existing', 'tags']
    };

    render(
      <TaskForm
        task={task}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edit description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('completed')).toBeInTheDocument();
    expect(screen.getByDisplayValue('low')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing, tags')).toBeInTheDocument();
  });

  it('allows changing status', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.selectOptions(screen.getByLabelText(/status/i), 'in_progress');
    await user.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress'
        })
      );
    });
  });

  it('allows changing priority', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Task');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
    await user.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high'
        })
      );
    });
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm
        task={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={false}
      />
    );

    // Trigger validation error
    await user.click(screen.getByText('Create Task'));
    expect(screen.getByText('Title is required')).toBeInTheDocument();

    // Start typing
    await user.type(screen.getByLabelText(/title/i), 'N');
    
    // Error should be cleared
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });
});

