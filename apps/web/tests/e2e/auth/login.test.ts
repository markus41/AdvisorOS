import { test, expect } from '@playwright/test'

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByText('Sign In')).toBeVisible()
    await expect(page.getByTestId('subdomain-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('signin-button')).toBeVisible()
    await expect(page.getByTestId('remember-me-checkbox')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Organization is required')).toBeVisible()
    await expect(page.getByText('Invalid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('should handle invalid credentials', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('wrong@test-firm.com')
    await page.getByTestId('password-input').fill('wrongpassword')

    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should handle invalid organization', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('nonexistent-org')
    await page.getByTestId('email-input').fill('user@example.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Organization not found')).toBeVisible()
  })

  test('should handle user not in organization', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('outsider@other-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    await expect(page.getByText('You are not a member of this organization')).toBeVisible()
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

  test('should handle remember me functionality', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    // Check remember me
    await page.getByTestId('remember-me-checkbox').check()
    await expect(page.getByTestId('remember-me-checkbox')).toBeChecked()

    await page.getByTestId('signin-button').click()

    await page.waitForURL('**/dashboard')

    // Should preserve login session (tested by checking cookies or local storage)
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(cookie => cookie.name.includes('session'))
    expect(sessionCookie).toBeDefined()
  })

  test('should handle 2FA flow', async ({ page }) => {
    // First, attempt login with user who has 2FA enabled
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('user-with-2fa@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    // Should show 2FA input
    await expect(page.getByTestId('2fa-input')).toBeVisible()
    await expect(page.getByText('Enter your 6-digit authentication code')).toBeVisible()
    await expect(page.getByTestId('verify-button')).toBeVisible()

    // Enter valid 2FA code
    await page.getByTestId('2fa-input').fill('123456')
    await page.getByTestId('verify-button').click()

    // Should complete login
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should handle invalid 2FA code', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('user-with-2fa@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    await expect(page.getByTestId('2fa-input')).toBeVisible()

    // Enter invalid 2FA code
    await page.getByTestId('2fa-input').fill('000000')
    await page.getByTestId('verify-button').click()

    await expect(page.getByText('Invalid authentication code')).toBeVisible()
  })

  test('should allow going back from 2FA to password', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('user-with-2fa@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    await expect(page.getByTestId('2fa-input')).toBeVisible()

    // Click back to password
    await page.getByTestId('back-to-password-button').click()

    // Should return to password screen
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('2fa-input')).not.toBeVisible()

    // Form data should be preserved
    await expect(page.getByTestId('subdomain-input')).toHaveValue('test-firm')
    await expect(page.getByTestId('email-input')).toHaveValue('user-with-2fa@test-firm.com')
    await expect(page.getByTestId('password-input')).toHaveValue('password')
  })

  test('should show loading state during login', async ({ page }) => {
    // Intercept login request to delay it
    await page.route('/api/auth/signin', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })

    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    // Should show loading state
    await expect(page.getByText('Signing in...')).toBeVisible()
    await expect(page.getByTestId('signin-button')).toBeDisabled()
    await expect(page.getByTestId('subdomain-input')).toBeDisabled()
    await expect(page.getByTestId('email-input')).toBeDisabled()
    await expect(page.getByTestId('password-input')).toBeDisabled()
  })

  test('should redirect to callback URL after login', async ({ page }) => {
    await page.goto('/auth/signin?callbackUrl=/clients')

    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    // Should redirect to specified callback URL
    await page.waitForURL('**/clients')
    await expect(page.getByText('Clients')).toBeVisible()
  })

  test('should handle account lockout', async ({ page }) => {
    // Simulate multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('wrongpassword')
      await page.getByTestId('signin-button').click()

      await expect(page.getByText('Invalid email or password')).toBeVisible()

      // Clear the form for next attempt
      await page.getByTestId('email-input').clear()
      await page.getByTestId('password-input').clear()
    }

    // Next attempt should show lockout message
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Account temporarily locked due to too many failed attempts')).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.getByText('Don\'t have an account? Register').click()
    await page.waitForURL('**/auth/register')
    await expect(page.getByText('Create Your Account')).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByText('Forgot your password?').click()
    await page.waitForURL('**/auth/forgot-password')
    await expect(page.getByText('Reset Password')).toBeVisible()
  })

  test('should handle expired session error', async ({ page }) => {
    await page.goto('/auth/signin?error=SessionExpired')

    await expect(page.getByText('Your session has expired. Please sign in again.')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/auth/signin', route => {
      route.abort('failed')
    })

    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    await page.getByTestId('signin-button').click()

    await expect(page.getByText('Network error. Please try again.')).toBeVisible()
  })

  test('should auto-focus on first empty field', async ({ page }) => {
    // Organization field should be focused by default
    await expect(page.getByTestId('subdomain-input')).toBeFocused()

    // Fill organization and tab to next field
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('email-input')).toBeFocused()

    // Fill email and tab to password
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('password-input')).toBeFocused()
  })

  test('should handle form submission with Enter key', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('password')

    // Press Enter to submit form
    await page.getByTestId('password-input').press('Enter')

    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should preserve form state during page reload', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('password-input').fill('partial-password')

    // Reload the page
    await page.reload()

    // Form should be empty after reload (for security)
    await expect(page.getByTestId('subdomain-input')).toHaveValue('')
    await expect(page.getByTestId('email-input')).toHaveValue('')
    await expect(page.getByTestId('password-input')).toHaveValue('')
  })

  test('should handle special characters in credentials', async ({ page }) => {
    await page.getByTestId('subdomain-input').fill('test-firm')
    await page.getByTestId('email-input').fill('user+test@test-firm.com')
    await page.getByTestId('password-input').fill('P@ssw0rd!#$')

    await page.getByTestId('signin-button').click()

    // Should handle special characters correctly
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
})