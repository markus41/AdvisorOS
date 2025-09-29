import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password')
  })

  test('should display forgot password form', async ({ page }) => {
    await expect(page.getByText('Reset Password')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('reset-button')).toBeVisible()
    await expect(page.getByText('Back to Sign In')).toBeVisible()
  })

  test('should show validation error for empty email', async ({ page }) => {
    await page.getByTestId('reset-button').click()

    await expect(page.getByText('Email is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('reset-button').click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should handle password reset request for existing user', async ({ page }) => {
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('reset-button').click()

    // Should show success message
    await expect(page.getByText('Password reset link sent')).toBeVisible()
    await expect(page.getByText('Check your email for reset instructions')).toBeVisible()
  })

  test('should handle password reset request for non-existing user', async ({ page }) => {
    await page.getByTestId('email-input').fill('nonexistent@example.com')
    await page.getByTestId('reset-button').click()

    // Should show generic success message for security
    await expect(page.getByText('Password reset link sent')).toBeVisible()
    await expect(page.getByText('Check your email for reset instructions')).toBeVisible()
  })

  test('should show loading state during reset request', async ({ page }) => {
    // Intercept reset request to delay it
    await page.route('/api/auth/forgot-password', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })

    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('reset-button').click()

    // Should show loading state
    await expect(page.getByText('Sending reset link...')).toBeVisible()
    await expect(page.getByTestId('reset-button')).toBeDisabled()
    await expect(page.getByTestId('email-input')).toBeDisabled()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/auth/forgot-password', route => {
      route.abort('failed')
    })

    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('reset-button').click()

    await expect(page.getByText('Network error. Please try again.')).toBeVisible()
  })

  test('should navigate back to sign in page', async ({ page }) => {
    await page.getByText('Back to Sign In').click()
    await page.waitForURL('**/auth/signin')
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('/api/auth/forgot-password', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ error: 'Too many requests. Please try again later.' })
      })
    })

    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('reset-button').click()

    await expect(page.getByText('Too many requests. Please try again later.')).toBeVisible()
  })

  test('should preserve email input during validation', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('reset-button').click()

    // Email should be preserved after validation error or success
    await expect(page.getByTestId('email-input')).toHaveValue('test@example.com')
  })

  test('should handle form submission with Enter key', async ({ page }) => {
    await page.getByTestId('email-input').fill('admin@test-firm.com')
    await page.getByTestId('email-input').press('Enter')

    await expect(page.getByText('Password reset link sent')).toBeVisible()
  })
})

test.describe('Password Reset Token Validation', () => {
  test('should display reset password form with valid token', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    await expect(page.getByText('Reset Your Password')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('reset-password-button')).toBeVisible()
  })

  test('should handle invalid reset token', async ({ page }) => {
    await page.goto('/auth/reset-password/invalid_token')

    await expect(page.getByText('Invalid or expired reset link')).toBeVisible()
    await expect(page.getByText('Request a new password reset')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    await page.getByTestId('password-input').fill('weak')
    await page.getByTestId('confirm-password-input').fill('weak')
    await page.getByTestId('reset-password-button').click()

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    await page.getByTestId('password-input').fill('NewPassword123!')
    await page.getByTestId('confirm-password-input').fill('DifferentPassword123!')
    await page.getByTestId('reset-password-button').click()

    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should successfully reset password with valid token and data', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    await page.getByTestId('password-input').fill('NewSecurePassword123!')
    await page.getByTestId('confirm-password-input').fill('NewSecurePassword123!')
    await page.getByTestId('reset-password-button').click()

    // Should show success and redirect to login
    await expect(page.getByText('Password reset successful')).toBeVisible()
    await page.waitForURL('**/auth/signin')
    await expect(page.getByText('Sign in with your new password')).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

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

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

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

  test('should handle expired reset token', async ({ page }) => {
    await page.goto('/auth/reset-password/expired_token')

    await expect(page.getByText('Reset link has expired')).toBeVisible()
    await expect(page.getByText('Request a new password reset')).toBeVisible()
  })

  test('should handle already used reset token', async ({ page }) => {
    await page.goto('/auth/reset-password/used_token')

    await expect(page.getByText('Reset link has already been used')).toBeVisible()
    await expect(page.getByText('Request a new password reset')).toBeVisible()
  })

  test('should show loading state during password reset', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    // Intercept reset request to delay it
    await page.route('/api/auth/reset-password', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })

    await page.getByTestId('password-input').fill('NewSecurePassword123!')
    await page.getByTestId('confirm-password-input').fill('NewSecurePassword123!')
    await page.getByTestId('reset-password-button').click()

    // Should show loading state
    await expect(page.getByText('Resetting password...')).toBeVisible()
    await expect(page.getByTestId('reset-password-button')).toBeDisabled()
    await expect(page.getByTestId('password-input')).toBeDisabled()
    await expect(page.getByTestId('confirm-password-input')).toBeDisabled()
  })

  test('should validate token on page load', async ({ page }) => {
    // Mock token validation endpoint
    await page.route('/api/auth/validate-reset-token', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ valid: true })
      })
    })

    await page.goto('/auth/reset-password/valid_token')

    // Should show form if token is valid
    await expect(page.getByTestId('password-input')).toBeVisible()
  })

  test('should handle server errors during password reset', async ({ page }) => {
    await page.goto('/auth/reset-password/valid_reset_token')

    // Mock server error
    await page.route('/api/auth/reset-password', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.getByTestId('password-input').fill('NewSecurePassword123!')
    await page.getByTestId('confirm-password-input').fill('NewSecurePassword123!')
    await page.getByTestId('reset-password-button').click()

    await expect(page.getByText('An error occurred. Please try again.')).toBeVisible()
  })
})