import { test, expect } from '@playwright/test'

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('should display registration form', async ({ page }) => {
    await expect(page.getByText('Create Your Account')).toBeVisible()
    await expect(page.getByTestId('organization-name-input')).toBeVisible()
    await expect(page.getByTestId('subdomain-input')).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('register-button')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByTestId('register-button').click()

    await expect(page.getByText('Organization name is required')).toBeVisible()
    await expect(page.getByText('Subdomain is required')).toBeVisible()
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('register-button').click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.getByTestId('password-input').fill('weak')
    await page.getByTestId('register-button').click()

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('should validate subdomain format', async ({ page }) => {
    // Test invalid characters
    await page.getByTestId('subdomain-input').fill('Invalid_Subdomain!')
    await page.getByTestId('register-button').click()

    await expect(page.getByText('Subdomain can only contain lowercase letters, numbers, and hyphens')).toBeVisible()

    // Test too short
    await page.getByTestId('subdomain-input').fill('ab')
    await page.getByTestId('register-button').click()

    await expect(page.getByText('Subdomain must be at least 3 characters')).toBeVisible()
  })

  test('should register new organization successfully', async ({ page }) => {
    const timestamp = Date.now()
    const uniqueSubdomain = `test-firm-${timestamp}`
    const uniqueEmail = `admin-${timestamp}@example.com`

    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill(uniqueSubdomain)
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill(uniqueEmail)
    await page.getByTestId('password-input').fill('SecurePassword123!')

    await page.getByTestId('register-button').click()

    // Should show success message
    await expect(page.getByText('Registration successful')).toBeVisible()
    await expect(page.getByText('Please check your email to verify your account')).toBeVisible()

    // Should redirect to verification page or show verification prompt
    await expect(page.url()).toContain('verify')
  })

  test('should handle duplicate subdomain', async ({ page }) => {
    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill('test-firm') // Existing subdomain
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill('newadmin@example.com')
    await page.getByTestId('password-input').fill('SecurePassword123!')

    await page.getByTestId('register-button').click()

    await expect(page.getByText('Subdomain is already taken')).toBeVisible()
  })

  test('should handle duplicate email', async ({ page }) => {
    const timestamp = Date.now()
    const uniqueSubdomain = `test-firm-${timestamp}`

    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill(uniqueSubdomain)
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill('admin@test-firm.com') // Existing email
    await page.getByTestId('password-input').fill('SecurePassword123!')

    await page.getByTestId('register-button').click()

    await expect(page.getByText('User with this email already exists')).toBeVisible()
  })

  test('should show loading state during registration', async ({ page }) => {
    const timestamp = Date.now()
    const uniqueSubdomain = `test-firm-${timestamp}`
    const uniqueEmail = `admin-${timestamp}@example.com`

    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill(uniqueSubdomain)
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill(uniqueEmail)
    await page.getByTestId('password-input').fill('SecurePassword123!')

    // Intercept the registration request to delay it
    await page.route('/api/auth/register', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })

    await page.getByTestId('register-button').click()

    // Should show loading state
    await expect(page.getByText('Creating account...')).toBeVisible()
    await expect(page.getByTestId('register-button')).toBeDisabled()
  })

  test('should handle invitation-based registration', async ({ page }) => {
    // Navigate to registration with invitation token
    await page.goto('/auth/register?token=valid_invitation_token&email=invited@example.com')

    // Form should be pre-filled with invitation data
    await expect(page.getByTestId('email-input')).toHaveValue('invited@example.com')
    await expect(page.getByTestId('email-input')).toBeDisabled()

    // Organization fields should be hidden or pre-filled
    await expect(page.getByTestId('organization-name-input')).not.toBeVisible()
    await expect(page.getByTestId('subdomain-input')).not.toBeVisible()

    await page.getByTestId('name-input').fill('Invited User')
    await page.getByTestId('password-input').fill('SecurePassword123!')

    await page.getByTestId('register-button').click()

    await expect(page.getByText('Registration successful')).toBeVisible()
    // Should redirect directly to dashboard for invited users
    await page.waitForURL('**/dashboard')
  })

  test('should handle invalid invitation token', async ({ page }) => {
    await page.goto('/auth/register?token=invalid_token&email=test@example.com')

    await expect(page.getByText('Invalid or expired invitation')).toBeVisible()
    // Should redirect to regular registration
    await expect(page.getByTestId('organization-name-input')).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.getByTestId('password-input')

    // Weak password
    await passwordInput.fill('weak')
    await expect(page.getByText('Weak')).toBeVisible()
    await expect(page.getByTestId('password-strength-bar')).toHaveClass(/bg-red/)

    // Medium password
    await passwordInput.fill('Better123')
    await expect(page.getByText('Good')).toBeVisible()
    await expect(page.getByTestId('password-strength-bar')).toHaveClass(/bg-yellow/)

    // Strong password
    await passwordInput.fill('VeryStrong123!')
    await expect(page.getByText('Strong')).toBeVisible()
    await expect(page.getByTestId('password-strength-bar')).toHaveClass(/bg-green/)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/auth/register', route => {
      route.abort('failed')
    })

    const timestamp = Date.now()
    const uniqueSubdomain = `test-firm-${timestamp}`
    const uniqueEmail = `admin-${timestamp}@example.com`

    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill(uniqueSubdomain)
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill(uniqueEmail)
    await page.getByTestId('password-input').fill('SecurePassword123!')

    await page.getByTestId('register-button').click()

    await expect(page.getByText('Network error. Please try again.')).toBeVisible()
  })

  test('should validate subdomain availability in real-time', async ({ page }) => {
    const subdomainInput = page.getByTestId('subdomain-input')

    // Type existing subdomain
    await subdomainInput.fill('test-firm')
    await subdomainInput.blur()

    // Should show availability check
    await expect(page.getByText('Checking availability...')).toBeVisible()
    await expect(page.getByText('Subdomain is not available')).toBeVisible()

    // Type available subdomain
    const uniqueSubdomain = `available-${Date.now()}`
    await subdomainInput.fill(uniqueSubdomain)
    await subdomainInput.blur()

    await expect(page.getByText('Subdomain is available')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByTestId('password-input')
    const toggleButton = page.getByTestId('password-toggle')

    await passwordInput.fill('password123')

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.getByText('Already have an account? Sign in').click()
    await page.waitForURL('**/auth/signin')
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should preserve form data during validation', async ({ page }) => {
    await page.getByTestId('organization-name-input').fill('Test CPA Firm')
    await page.getByTestId('subdomain-input').fill('test')
    await page.getByTestId('name-input').fill('Test Admin')
    await page.getByTestId('email-input').fill('admin@example.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('register-button').click()

    // Form should show validation errors but preserve data
    await expect(page.getByTestId('organization-name-input')).toHaveValue('Test CPA Firm')
    await expect(page.getByTestId('subdomain-input')).toHaveValue('test')
    await expect(page.getByTestId('name-input')).toHaveValue('Test Admin')
    await expect(page.getByTestId('email-input')).toHaveValue('admin@example.com')
    await expect(page.getByTestId('password-input')).toHaveValue('password')
  })
})