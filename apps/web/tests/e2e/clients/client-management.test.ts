import { test, expect } from '@playwright/test'

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page (assumes user is authenticated)
    await page.goto('/clients')
  })

  test('should display clients page', async ({ page }) => {
    await expect(page.getByText('Clients')).toBeVisible()
    await expect(page.getByTestId('add-client-button')).toBeVisible()
    await expect(page.getByTestId('clients-table')).toBeVisible()
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('should create new client', async ({ page }) => {
    await page.getByTestId('add-client-button').click()

    // Should open client form modal
    await expect(page.getByTestId('client-form-modal')).toBeVisible()
    await expect(page.getByText('Add New Client')).toBeVisible()

    // Fill out client form
    await page.getByTestId('business-name-input').fill('Acme Corporation')
    await page.getByTestId('legal-name-input').fill('Acme Corporation Inc.')
    await page.getByTestId('tax-id-input').fill('12-3456789')
    await page.getByTestId('primary-contact-name-input').fill('John Smith')
    await page.getByTestId('primary-contact-email-input').fill('john@acme.com')
    await page.getByTestId('primary-contact-phone-input').fill('555-0123')
    await page.getByTestId('business-address-input').fill('123 Business St, City, ST 12345')

    // Select business type
    await page.getByTestId('business-type-select').click()
    await page.getByText('Corporation').click()

    // Select industry
    await page.getByTestId('industry-select').click()
    await page.getByText('Technology').click()

    // Select status
    await page.getByTestId('status-select').click()
    await page.getByText('Active').click()

    // Submit form
    await page.getByTestId('save-client-button').click()

    // Should show success message and return to clients list
    await expect(page.getByText('Client created successfully')).toBeVisible()
    await expect(page.getByTestId('client-form-modal')).not.toBeVisible()

    // New client should appear in the table
    await expect(page.getByText('Acme Corporation')).toBeVisible()
    await expect(page.getByText('john@acme.com')).toBeVisible()
  })

  test('should validate required fields when creating client', async ({ page }) => {
    await page.getByTestId('add-client-button').click()
    await page.getByTestId('save-client-button').click()

    // Should show validation errors
    await expect(page.getByText('Business name is required')).toBeVisible()
    await expect(page.getByText('Primary contact name is required')).toBeVisible()
    await expect(page.getByText('Primary contact email is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('add-client-button').click()
    await page.getByTestId('primary-contact-email-input').fill('invalid-email')
    await page.getByTestId('save-client-button').click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should search clients', async ({ page }) => {
    // Type in search box
    await page.getByTestId('search-input').fill('Acme')

    // Should filter table to show only matching clients
    await expect(page.getByText('Acme Corporation')).toBeVisible()

    // Non-matching clients should be hidden
    await expect(page.getByText('XYZ Industries')).not.toBeVisible()

    // Clear search
    await page.getByTestId('search-input').clear()

    // All clients should be visible again
    await expect(page.getByText('XYZ Industries')).toBeVisible()
  })

  test('should filter clients by status', async ({ page }) => {
    await page.getByTestId('status-filter').click()
    await page.getByText('Active').click()

    // Should show only active clients
    await expect(page.getByTestId('status-badge-active')).toBeVisible()
    await expect(page.getByTestId('status-badge-inactive')).not.toBeVisible()
  })

  test('should sort clients by name', async ({ page }) => {
    await page.getByTestId('name-column-header').click()

    // Should sort clients alphabetically
    const clientRows = page.getByTestId('client-row')
    const firstClient = clientRows.first()
    await expect(firstClient).toContainText('Acme Corporation')
  })

  test('should edit existing client', async ({ page }) => {
    // Click edit button for first client
    await page.getByTestId('edit-client-button').first().click()

    // Should open edit form with pre-filled data
    await expect(page.getByTestId('client-form-modal')).toBeVisible()
    await expect(page.getByText('Edit Client')).toBeVisible()
    await expect(page.getByTestId('business-name-input')).toHaveValue('Acme Corporation')

    // Update client information
    await page.getByTestId('business-name-input').clear()
    await page.getByTestId('business-name-input').fill('Acme Corp Updated')
    await page.getByTestId('primary-contact-phone-input').clear()
    await page.getByTestId('primary-contact-phone-input').fill('555-9999')

    await page.getByTestId('save-client-button').click()

    // Should show success message
    await expect(page.getByText('Client updated successfully')).toBeVisible()

    // Updated information should be visible in table
    await expect(page.getByText('Acme Corp Updated')).toBeVisible()
    await expect(page.getByText('555-9999')).toBeVisible()
  })

  test('should view client details', async ({ page }) => {
    // Click on client name to view details
    await page.getByText('Acme Corporation').click()

    // Should navigate to client detail page
    await page.waitForURL('**/clients/*')
    await expect(page.getByText('Client Details')).toBeVisible()
    await expect(page.getByText('Acme Corporation')).toBeVisible()

    // Should show client information tabs
    await expect(page.getByTestId('overview-tab')).toBeVisible()
    await expect(page.getByTestId('documents-tab')).toBeVisible()
    await expect(page.getByTestId('engagements-tab')).toBeVisible()
    await expect(page.getByTestId('invoices-tab')).toBeVisible()
  })

  test('should delete client', async ({ page }) => {
    // Click delete button
    await page.getByTestId('delete-client-button').first().click()

    // Should show confirmation dialog
    await expect(page.getByTestId('delete-confirmation-modal')).toBeVisible()
    await expect(page.getByText('Are you sure you want to delete this client?')).toBeVisible()

    // Confirm deletion
    await page.getByTestId('confirm-delete-button').click()

    // Should show success message
    await expect(page.getByText('Client deleted successfully')).toBeVisible()

    // Client should be removed from table
    await expect(page.getByText('Acme Corporation')).not.toBeVisible()
  })

  test('should handle bulk operations', async ({ page }) => {
    // Select multiple clients
    await page.getByTestId('select-client-checkbox').first().check()
    await page.getByTestId('select-client-checkbox').nth(1).check()

    // Bulk actions should be visible
    await expect(page.getByTestId('bulk-actions-bar')).toBeVisible()
    await expect(page.getByText('2 clients selected')).toBeVisible()

    // Click bulk archive
    await page.getByTestId('bulk-archive-button').click()
    await page.getByTestId('confirm-bulk-action-button').click()

    // Should show success message
    await expect(page.getByText('2 clients archived successfully')).toBeVisible()
  })

  test('should export clients to CSV', async ({ page }) => {
    await page.getByTestId('export-button').click()
    await page.getByText('Export to CSV').click()

    // Should trigger download
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('clients')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should import clients from CSV', async ({ page }) => {
    await page.getByTestId('import-button').click()

    // Should show import modal
    await expect(page.getByTestId('import-modal')).toBeVisible()

    // Upload CSV file
    const fileInput = page.getByTestId('csv-file-input')
    await fileInput.setInputFiles('tests/fixtures/clients.csv')

    // Configure import settings
    await page.getByTestId('skip-duplicates-checkbox').check()

    // Start import
    await page.getByTestId('start-import-button').click()

    // Should show import progress
    await expect(page.getByTestId('import-progress')).toBeVisible()

    // Should show import results
    await expect(page.getByText('Import completed')).toBeVisible()
    await expect(page.getByText('5 clients imported')).toBeVisible()
  })

  test('should paginate client list', async ({ page }) => {
    // Should show pagination controls
    await expect(page.getByTestId('pagination')).toBeVisible()
    await expect(page.getByTestId('page-info')).toContainText('1 of')

    // Click next page
    await page.getByTestId('next-page-button').click()

    // Should navigate to page 2
    await expect(page.getByTestId('page-info')).toContainText('2 of')
  })

  test('should handle client with no dependencies', async ({ page }) => {
    // Try to delete client with no documents, engagements, or invoices
    await page.getByTestId('delete-client-button').first().click()
    await page.getByTestId('confirm-delete-button').click()

    await expect(page.getByText('Client deleted successfully')).toBeVisible()
  })

  test('should prevent deletion of client with dependencies', async ({ page }) => {
    // Try to delete client that has active engagements or unpaid invoices
    await page.getByTestId('delete-client-button').first().click()
    await page.getByTestId('confirm-delete-button').click()

    // Should show error message
    await expect(page.getByText('Cannot delete client with active engagements or unpaid invoices')).toBeVisible()
  })

  test('should show client statistics', async ({ page }) => {
    // Should display client stats cards
    await expect(page.getByTestId('total-clients-stat')).toBeVisible()
    await expect(page.getByTestId('active-clients-stat')).toBeVisible()
    await expect(page.getByTestId('prospect-clients-stat')).toBeVisible()
    await expect(page.getByTestId('total-revenue-stat')).toBeVisible()
  })

  test('should handle client risk assessment', async ({ page }) => {
    // Go to client details
    await page.getByText('Acme Corporation').click()

    // Navigate to risk assessment tab
    await page.getByTestId('risk-tab').click()

    // Update risk level
    await page.getByTestId('risk-level-select').click()
    await page.getByText('High').click()

    // Add risk assessment notes
    await page.getByTestId('risk-notes-textarea').fill('Client has complex international operations requiring additional oversight.')

    // Save risk assessment
    await page.getByTestId('save-risk-assessment-button').click()

    await expect(page.getByText('Risk assessment updated')).toBeVisible()
  })

  test('should manage client tags', async ({ page }) => {
    await page.getByText('Acme Corporation').click()

    // Add tags
    await page.getByTestId('add-tag-input').fill('high-value')
    await page.keyboard.press('Enter')

    await page.getByTestId('add-tag-input').fill('tech-startup')
    await page.keyboard.press('Enter')

    // Tags should be visible
    await expect(page.getByTestId('tag-high-value')).toBeVisible()
    await expect(page.getByTestId('tag-tech-startup')).toBeVisible()

    // Remove tag
    await page.getByTestId('remove-tag-high-value').click()
    await expect(page.getByTestId('tag-high-value')).not.toBeVisible()
  })

  test('should handle client notes', async ({ page }) => {
    await page.getByText('Acme Corporation').click()
    await page.getByTestId('notes-tab').click()

    // Add new note
    await page.getByTestId('add-note-button').click()
    await page.getByTestId('note-title-input').fill('Initial Meeting')
    await page.getByTestId('note-content-textarea').fill('Discussed their accounting needs and quarterly reporting requirements.')
    await page.getByTestId('save-note-button').click()

    // Note should be visible
    await expect(page.getByText('Initial Meeting')).toBeVisible()
    await expect(page.getByText('Discussed their accounting needs')).toBeVisible()
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })

    // Mobile-specific elements should be visible
    await expect(page.getByTestId('mobile-menu-button')).toBeVisible()

    // Desktop-only elements should be hidden
    await expect(page.getByTestId('desktop-sidebar')).not.toBeVisible()

    // Table should be responsive
    await expect(page.getByTestId('clients-table')).toBeVisible()
  })

  test('should handle empty state', async ({ page }) => {
    // Mock empty clients response
    await page.route('/api/clients', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clients: [],
          pagination: { total: 0, pages: 0, page: 1, limit: 10 }
        })
      })
    })

    await page.reload()

    // Should show empty state
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByText('No clients found')).toBeVisible()
    await expect(page.getByText('Get started by adding your first client')).toBeVisible()
  })
})