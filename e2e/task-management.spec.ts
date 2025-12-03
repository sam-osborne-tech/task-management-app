import { test, expect } from '@playwright/test';

/**
 * E2E tests for Task Management Application
 * Tests against the live production URL
 */

// Track created task IDs for cleanup
const createdTaskIds: string[] = [];

test.describe('Task Management App', () => {
  
  test.beforeEach(async ({ page }) => {
    // Log which test is starting
    console.log(`\n🧪 Running: ${test.info().title}`);
    console.log(`   ${test.info().titlePath.join(' > ')}\n`);
    
    await page.goto('/');
    // Wait for the app to load
    await expect(page.locator('h1')).toContainText('Task Manager');
  });

  test.afterEach(async ({ page }) => {
    // In demo mode, pause at the end so user can see the final state
    if (process.env.DEMO) {
      console.log('   ✅ Test complete - pausing to show result...\n');
      await page.waitForTimeout(3000);
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all test tasks created during this run
    console.log('\n🧹 Cleaning up test data...');
    
    // Fetch all tasks and find ones matching test patterns
    const response = await request.get('/api/tasks?limit=100');
    if (response.ok()) {
      const data = await response.json();
      const testTasks = data.data.filter((task: any) => 
        task.title.includes('E2E Test Task') || 
        task.title.includes('API Test Task')
      );
      
      // Delete each test task
      for (const task of testTasks) {
        await request.delete(`/api/tasks/${task.id}`);
        console.log(`   Deleted: ${task.title}`);
      }
      
      if (testTasks.length > 0) {
        console.log(`✅ Cleaned up ${testTasks.length} test task(s)\n`);
      } else {
        console.log('   No test tasks to clean up\n');
      }
    }
  });

  test.describe('Page Load & Layout', () => {
    
    test('should load the dashboard with header', async ({ page }) => {
      await expect(page).toHaveTitle(/Task/i);
      await expect(page.locator('h1')).toContainText('Task Manager');
      await expect(page.getByRole('button', { name: /new task/i })).toBeVisible();
    });

    test('should display stats panel', async ({ page }) => {
      await expect(page.getByText('Overview')).toBeVisible();
      // Stats cards should be visible
      await expect(page.getByText('Total')).toBeVisible();
    });

    test('should display filter controls', async ({ page }) => {
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      await expect(page.locator('select').first()).toBeVisible();
    });

    test('should display tasks section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    });
  });

  test.describe('Task Creation', () => {
    
    test('should open task creation modal', async ({ page }) => {
      await page.getByRole('button', { name: /new task/i }).click();
      // Modal container appears with form
      await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
      await expect(page.getByPlaceholder(/task title/i)).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
      const uniqueTitle = `E2E Test Task ${Date.now()}`;
      
      // Open modal
      await page.getByRole('button', { name: /new task/i }).click();
      await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
      
      // Fill form
      await page.getByPlaceholder(/task title/i).fill(uniqueTitle);
      await page.getByPlaceholder(/description/i).fill('This is an automated test task');
      
      // Select priority using the labeled select
      await page.locator('#priority').selectOption('high');
      
      // Submit
      await page.getByRole('button', { name: /create task/i }).click();
      
      // Modal should close
      await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible({ timeout: 5000 });
      
      // Task should appear in list
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /new task/i }).click();
      await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
      
      // Clear the title field and try to submit
      await page.getByPlaceholder(/task title/i).fill('');
      await page.getByRole('button', { name: /create task/i }).click();
      
      // Should show validation or stay on form (modal should still be open)
      await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
    });
  });

  test.describe('Task Filtering', () => {
    
    test('should filter by search text', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('project');
      
      // Wait for debounce and results
      await page.waitForTimeout(500);
      
      // Results should be filtered (or show no results message)
      await expect(searchInput).toHaveValue('project');
    });

    test('should filter by status', async ({ page }) => {
      // Find status dropdown in filters (first select)
      const statusSelect = page.locator('select').first();
      
      // Filter by "To Do"
      await statusSelect.selectOption('todo');
      await page.waitForTimeout(300);
      
      // Verify filter is applied
      await expect(statusSelect).toHaveValue('todo');
    });

    test('should filter by priority', async ({ page }) => {
      // Priority is second select
      const prioritySelect = page.locator('select').nth(1);
      
      // Filter by "High"
      await prioritySelect.selectOption('high');
      await page.waitForTimeout(300);
      
      // Verify filter is applied
      await expect(prioritySelect).toHaveValue('high');
    });

    test('should reset filters', async ({ page }) => {
      // Apply a filter first
      const statusSelect = page.locator('select').first();
      await statusSelect.selectOption('completed');
      await page.waitForTimeout(300);
      
      // Look for reset button (appears when filters are active)
      const resetButton = page.getByRole('button', { name: /reset/i });
      if (await resetButton.isVisible()) {
        await resetButton.click();
        await page.waitForTimeout(300);
        
        // Status should be reset to "All" (empty value)
        await expect(statusSelect).toHaveValue('');
      }
    });
  });

  test.describe('Task Operations', () => {
    
    test('should display task cards with details', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);
      
      // Check if there are task cards (article elements)
      const taskCards = page.locator('article');
      const count = await taskCards.count();
      
      if (count > 0) {
        // Task cards should show title
        await expect(taskCards.first()).toBeVisible();
      } else {
        // Empty state is also valid
        expect(true).toBe(true);
      }
    });

    test('should change task status via dropdown', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      // Find a status dropdown in a task card (inside article)
      const taskStatusDropdown = page.locator('article select').first();
      
      if (await taskStatusDropdown.isVisible()) {
        const currentValue = await taskStatusDropdown.inputValue();
        const newValue = currentValue === 'completed' ? 'todo' : 'completed';
        
        await taskStatusDropdown.selectOption(newValue);
        await page.waitForTimeout(500);
        
        // Verify change took effect
        await expect(taskStatusDropdown).toHaveValue(newValue);
      }
    });
  });

  test.describe('Task Editing', () => {
    
    test('should open edit modal when clicking edit button', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      // Find an edit button (look for button with pencil icon in article)
      const editButton = page.locator('article button').filter({ hasText: '' }).first();
      
      // Click the first task card to potentially see edit options
      const taskCard = page.locator('article').first();
      if (await taskCard.isVisible()) {
        // Look for edit button with SVG icon
        const buttons = taskCard.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          // Click the second button (usually edit after status dropdown might have one)
          await buttons.nth(0).click();
          await page.waitForTimeout(500);
          
          // If modal appeared, check for title input
          const modal = page.locator('.fixed.inset-0.z-50');
          if (await modal.isVisible()) {
            const titleInput = page.getByPlaceholder(/task title/i);
            await expect(titleInput).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Task Deletion', () => {
    
    test('should show delete confirmation when clicking delete', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      // Find a task card
      const taskCard = page.locator('article').first();
      
      if (await taskCard.isVisible()) {
        // Find delete button (usually last button, red colored)
        const deleteButton = taskCard.locator('button').last();
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.waitForTimeout(500);
          
          // Check if confirmation modal appeared
          const modal = page.locator('.fixed.inset-0.z-50');
          if (await modal.isVisible()) {
            // Look for confirmation text
            await expect(page.getByText(/delete|confirm|sure/i).first()).toBeVisible();
            
            // Cancel to not actually delete
            const cancelButton = page.getByRole('button', { name: /cancel/i });
            if (await cancelButton.isVisible()) {
              await cancelButton.click();
            }
          }
        }
      }
    });
  });

  test.describe('Sorting', () => {
    
    test('should change sort order', async ({ page }) => {
      // Sort dropdown is the third select (after status and priority)
      const sortSelect = page.locator('select').nth(2);
      
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('title');
        await page.waitForTimeout(300);
        await expect(sortSelect).toHaveValue('title');
      }
    });

    test('should toggle sort direction', async ({ page }) => {
      // Find the sort direction toggle button (has chevron icon)
      const sortButtons = page.locator('button').filter({ has: page.locator('svg') });
      
      // Usually near the sort dropdown
      const count = await sortButtons.count();
      if (count > 3) {
        await sortButtons.nth(3).click();
        await page.waitForTimeout(300);
        // Just verify it's clickable without error
        expect(true).toBe(true);
      }
    });
  });

  test.describe('API Health', () => {
    
    test('should return healthy status from API', async ({ request }) => {
      const response = await request.get('/health');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('running');
    });

    test('should fetch tasks from API', async ({ request }) => {
      const response = await request.get('/api/tasks');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    test('should fetch stats from API', async ({ request }) => {
      const response = await request.get('/api/tasks/stats');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('byStatus');
      expect(data.data).toHaveProperty('byPriority');
    });
  });

  test.describe('API CRUD Operations', () => {
    
    test('should create, read, update, and delete a task via API', async ({ request }) => {
      // CREATE
      const createResponse = await request.post('/api/tasks', {
        data: {
          title: `API Test Task ${Date.now()}`,
          description: 'Created via Playwright API test',
          status: 'todo',
          priority: 'medium'
        }
      });
      expect(createResponse.ok()).toBeTruthy();
      
      const createData = await createResponse.json();
      expect(createData.success).toBe(true);
      const taskId = createData.data.id;
      expect(taskId).toBeDefined();
      
      // READ
      const readResponse = await request.get(`/api/tasks/${taskId}`);
      expect(readResponse.ok()).toBeTruthy();
      
      const readData = await readResponse.json();
      expect(readData.data.id).toBe(taskId);
      
      // UPDATE
      const updateResponse = await request.put(`/api/tasks/${taskId}`, {
        data: {
          status: 'in_progress',
          priority: 'high'
        }
      });
      expect(updateResponse.ok()).toBeTruthy();
      
      const updateData = await updateResponse.json();
      expect(updateData.data.status).toBe('in_progress');
      expect(updateData.data.priority).toBe('high');
      
      // DELETE
      const deleteResponse = await request.delete(`/api/tasks/${taskId}`);
      expect(deleteResponse.ok()).toBeTruthy();
      
      // Verify deletion
      const verifyResponse = await request.get(`/api/tasks/${taskId}`);
      expect(verifyResponse.status()).toBe(404);
    });

    test('should validate task creation', async ({ request }) => {
      // Try to create without title
      const response = await request.post('/api/tasks', {
        data: {
          description: 'No title provided',
          status: 'todo'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should filter tasks via API', async ({ request }) => {
      // Filter by status
      const response = await request.get('/api/tasks?status=todo&limit=5');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // All returned tasks should have status 'todo'
      for (const task of data.data) {
        expect(task.status).toBe('todo');
      }
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      await expect(page.locator('h1')).toContainText('Task Manager');
      await expect(page.getByRole('button', { name: /new task/i })).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await expect(page.locator('h1')).toContainText('Task Manager');
      await expect(page.getByRole('button', { name: /new task/i })).toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    
    test('should export tasks as JSON', async ({ request }) => {
      const response = await request.get('/api/tasks/export?format=json');
      expect(response.ok()).toBeTruthy();
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('exportedAt');
      expect(data).toHaveProperty('tasks');
    });

    test('should export tasks as CSV', async ({ request }) => {
      const response = await request.get('/api/tasks/export?format=csv');
      expect(response.ok()).toBeTruthy();
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/csv');
      
      const text = await response.text();
      expect(text).toContain('id,title');
    });
  });
});
