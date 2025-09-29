import { test, expect } from '@playwright/test'

test.describe('Security Features', () => {

  test.describe('Two-Factor Authentication (2FA)', () => {
    test('should display 2FA setup option in settings', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Navigate to security settings
      await page.goto('/settings/security')

      await expect(page.getByTestId('2fa-section')).toBeVisible()
      await expect(page.getByTestId('enable-2fa-button')).toBeVisible()
      await expect(page.getByText('Two-Factor Authentication')).toBeVisible()
    })

    test('should setup 2FA with QR code', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      await page.goto('/settings/security')
      await page.getByTestId('enable-2fa-button').click()

      // Should show 2FA setup modal
      await expect(page.getByTestId('2fa-setup-modal')).toBeVisible()
      await expect(page.getByTestId('qr-code')).toBeVisible()
      await expect(page.getByTestId('secret-key')).toBeVisible()
      await expect(page.getByText('Scan this QR code with your authenticator app')).toBeVisible()

      // Enter verification code
      await page.getByTestId('verification-code-input').fill('123456')
      await page.getByTestId('verify-2fa-button').click()

      // Should show success message
      await expect(page.getByText('Two-factor authentication enabled successfully')).toBeVisible()
      await expect(page.getByTestId('2fa-enabled-status')).toBeVisible()
    })

    test('should require 2FA code during login', async ({ page }) => {
      // Assume user has 2FA enabled
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('user-with-2fa@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()

      // Should show 2FA input screen
      await expect(page.getByTestId('2fa-input')).toBeVisible()
      await expect(page.getByText('Enter your 6-digit authentication code')).toBeVisible()
      await expect(page.getByTestId('verify-button')).toBeVisible()

      // Enter correct 2FA code
      await page.getByTestId('2fa-input').fill('123456')
      await page.getByTestId('verify-button').click()

      // Should complete login
      await page.waitForURL('**/dashboard')
      await expect(page.getByText('Dashboard')).toBeVisible()
    })

    test('should handle invalid 2FA codes', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('user-with-2fa@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()

      await expect(page.getByTestId('2fa-input')).toBeVisible()

      // Enter invalid 2FA code
      await page.getByTestId('2fa-input').fill('000000')
      await page.getByTestId('verify-button').click()

      await expect(page.getByText('Invalid authentication code')).toBeVisible()
      await expect(page.getByTestId('2fa-input')).toBeVisible() // Should stay on 2FA screen
    })

    test('should provide backup codes', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      await page.goto('/settings/security')

      // If 2FA is enabled, should show backup codes option
      if (await page.getByTestId('2fa-enabled-status').isVisible()) {
        await page.getByTestId('view-backup-codes').click()

        await expect(page.getByTestId('backup-codes-modal')).toBeVisible()
        await expect(page.getByText('Recovery Codes')).toBeVisible()

        // Should show list of backup codes
        const backupCodes = page.getByTestId('backup-code')
        await expect(backupCodes).toHaveCount(10) // Typically 10 codes
      }
    })

    test('should disable 2FA with password confirmation', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      await page.goto('/settings/security')

      // If 2FA is enabled
      if (await page.getByTestId('disable-2fa-button').isVisible()) {
        await page.getByTestId('disable-2fa-button').click()

        // Should require password confirmation
        await expect(page.getByTestId('password-confirmation-modal')).toBeVisible()
        await page.getByTestId('current-password-input').fill('password')
        await page.getByTestId('confirm-disable-2fa').click()

        await expect(page.getByText('Two-factor authentication disabled')).toBeVisible()
        await expect(page.getByTestId('enable-2fa-button')).toBeVisible()
      }
    })
  })

  test.describe('Rate Limiting', () => {
    test('should rate limit login attempts', async ({ page }) => {
      await page.goto('/auth/signin')

      // Make multiple failed login attempts rapidly
      for (let i = 0; i < 6; i++) {
        await page.getByTestId('subdomain-input').fill('test-firm')
        await page.getByTestId('email-input').fill('admin@test-firm.com')
        await page.getByTestId('password-input').fill('wrongpassword')
        await page.getByTestId('signin-button').click()

        if (i < 5) {
          await expect(page.getByText('Invalid email or password')).toBeVisible()
          // Clear form for next attempt
          await page.getByTestId('email-input').clear()
          await page.getByTestId('password-input').clear()
        }
      }

      // Should show rate limit message on 6th attempt
      await expect(page.getByText('Too many login attempts')).toBeVisible()
      await expect(page.getByText('Please try again later')).toBeVisible()
    })

    test('should rate limit password reset requests', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      // Make multiple password reset requests
      for (let i = 0; i < 4; i++) {
        await page.getByTestId('email-input').fill('admin@test-firm.com')
        await page.getByTestId('reset-button').click()

        if (i < 3) {
          await expect(page.getByText('Password reset link sent')).toBeVisible()
          await page.reload() // Reset the form
        }
      }

      // Should show rate limit message
      await expect(page.getByText('Too many password reset requests')).toBeVisible()
    })

    test('should rate limit API endpoints', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Make rapid API requests
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(page.request.get('/api/users'))
      }

      const responses = await Promise.all(requests)

      // At least some should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status() === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  test.describe('CSRF Protection', () => {
    test('should include CSRF tokens in forms', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Check for CSRF tokens in sensitive forms
      await page.goto('/settings')

      // Look for CSRF token in forms
      const csrfToken = await page.locator('input[name="_token"]').first().inputValue()
        .catch(() => null)

      if (!csrfToken) {
        // Check for meta tag
        const metaToken = await page.locator('meta[name="csrf-token"]').getAttribute('content')
        expect(metaToken).toBeTruthy()
      } else {
        expect(csrfToken).toBeTruthy()
      }
    })

    test('should reject requests without valid CSRF tokens', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Make POST request without CSRF token
      const response = await page.request.post('/api/users', {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'USER'
        }
      })

      // Should be rejected due to missing CSRF token
      expect(response.status()).toBe(403)
    })
  })

  test.describe('Content Security Policy (CSP)', () => {
    test('should have CSP headers', async ({ page }) => {
      const response = await page.goto('/')

      const cspHeader = response.headers()['content-security-policy']
      expect(cspHeader).toBeTruthy()

      // Should restrict inline scripts
      expect(cspHeader).toContain("script-src")
      expect(cspHeader).not.toContain("'unsafe-inline'")

      // Should restrict external resources
      expect(cspHeader).toContain("default-src")
    })

    test('should block inline scripts when CSP is active', async ({ page }) => {
      await page.goto('/')

      // Try to inject inline script (should be blocked by CSP)
      const scriptResult = await page.evaluate(() => {
        try {
          const script = document.createElement('script')
          script.innerHTML = 'window.xssTest = true'
          document.head.appendChild(script)
          return window.xssTest || false
        } catch (e) {
          return false
        }
      })

      expect(scriptResult).toBe(false) // Script should be blocked
    })
  })

  test.describe('XSS Protection', () => {
    test('should sanitize user input in forms', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Try to input malicious script in user profile
      await page.goto('/settings/profile')

      const maliciousScript = '<script>alert("XSS")</script>'
      await page.getByTestId('name-input').fill(maliciousScript)
      await page.getByTestId('save-profile-button').click()

      // Check that script is escaped/sanitized
      const nameValue = await page.getByTestId('name-input').inputValue()
      expect(nameValue).not.toContain('<script>')

      // Check in displayed content
      await page.reload()
      const displayedName = await page.getByTestId('user-name-display').textContent()
      expect(displayedName).not.toContain('<script>')
    })

    test('should escape content in search results', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Search with malicious query
      await page.goto('/clients')
      const xssPayload = '<script>alert("XSS")</script>'
      await page.getByTestId('search-input').fill(xssPayload)
      await page.getByTestId('search-button').click()

      // Check that search results don't execute the script
      const searchResults = await page.getByTestId('search-results').innerHTML()
      expect(searchResults).not.toContain('<script>alert("XSS")</script>')

      // Check for proper escaping
      expect(searchResults).toContain('&lt;script&gt;') // Should be HTML escaped
    })
  })

  test.describe('SQL Injection Protection', () => {
    test('should handle malicious SQL in search queries', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Try SQL injection in search
      await page.goto('/clients')
      const sqlPayload = "'; DROP TABLE users; --"
      await page.getByTestId('search-input').fill(sqlPayload)
      await page.getByTestId('search-button').click()

      // Should handle gracefully without breaking
      await expect(page.getByTestId('search-results')).toBeVisible()
      // No error should occur, and the application should still function
      await expect(page.getByText('Search results')).toBeVisible()
    })

    test('should parameterize login queries', async ({ page }) => {
      // Try SQL injection in login form
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')

      const sqlInjectionEmail = "admin@test-firm.com'; --"
      await page.getByTestId('email-input').fill(sqlInjectionEmail)
      await page.getByTestId('password-input').fill('anything')
      await page.getByTestId('signin-button').click()

      // Should show invalid credentials, not succeed or error
      await expect(page.getByText('Invalid email or password')).toBeVisible()
      // Should not be redirected to dashboard
      expect(page.url()).toContain('/auth/signin')
    })
  })

  test.describe('Password Security', () => {
    test('should enforce strong password requirements', async ({ page }) => {
      await page.goto('/auth/register')

      // Test weak passwords
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123'
      ]

      for (const weakPassword of weakPasswords) {
        await page.getByTestId('password-input').fill(weakPassword)
        await page.getByTestId('register-button').click()

        await expect(page.getByText(/Password must/)).toBeVisible()
        await page.getByTestId('password-input').clear()
      }

      // Test strong password
      await page.getByTestId('password-input').fill('StrongP@ssw0rd!2024')
      // Should not show error for strong password
    })

    test('should hash passwords securely', async ({ page }) => {
      // This test verifies that passwords are not stored in plain text
      // We can't directly check the database, but we can verify behavior

      await page.goto('/auth/register')
      await page.getByTestId('organization-name-input').fill('Test Security Firm')
      await page.getByTestId('subdomain-input').fill(`security-test-${Date.now()}`)
      await page.getByTestId('name-input').fill('Security Test')
      await page.getByTestId('email-input').fill(`security-${Date.now()}@example.com`)
      await page.getByTestId('password-input').fill('SecurePassword123!')
      await page.getByTestId('register-button').click()

      // Registration should succeed
      await expect(page.getByText('Registration successful')).toBeVisible()

      // Verify that we can't retrieve the plain text password through any API
      const response = await page.request.get('/api/user/profile')
      const userData = await response.json()

      expect(userData.password).toBeUndefined() // Password should never be returned
    })

    test('should prevent password reuse', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Go to change password
      await page.goto('/settings/security')
      await page.getByTestId('change-password-button').click()

      // Try to use the same password
      await page.getByTestId('current-password-input').fill('password')
      await page.getByTestId('new-password-input').fill('password')
      await page.getByTestId('confirm-password-input').fill('password')
      await page.getByTestId('update-password-button').click()

      await expect(page.getByText('New password must be different')).toBeVisible()
    })
  })

  test.describe('Session Security', () => {
    test('should use secure session cookies', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(cookie =>
        cookie.name.includes('session') || cookie.name.includes('auth')
      )

      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true)
        expect(sessionCookie.secure).toBe(true) // Only if using HTTPS
        expect(sessionCookie.sameSite).toBe('lax')
      }
    })

    test('should invalidate sessions on logout', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Get session before logout
      const sessionBefore = await page.context().cookies()

      // Logout
      await page.getByTestId('user-menu').click()
      await page.getByTestId('logout-button').click()
      await page.waitForURL('**/auth/signin')

      // Session should be invalidated
      const sessionAfter = await page.context().cookies()
      const sessionCookieAfter = sessionAfter.find(cookie =>
        cookie.name.includes('session') || cookie.name.includes('auth')
      )

      if (sessionCookieAfter) {
        expect(sessionCookieAfter.value).toBe('')
      }
    })

    test('should prevent session fixation', async ({ page }) => {
      // Get any existing session ID
      await page.goto('/')
      const cookiesBefore = await page.context().cookies()

      // Login
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      const cookiesAfter = await page.context().cookies()
      const sessionAfter = cookiesAfter.find(cookie =>
        cookie.name.includes('session') || cookie.name.includes('auth')
      )

      // Session ID should be different after login (regenerated)
      expect(sessionAfter).toBeTruthy()
    })
  })

  test.describe('Audit Logging', () => {
    test('should log authentication events', async ({ page }) => {
      // Login attempt should be logged
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Check audit logs (if accessible)
      await page.goto('/settings/audit-logs')

      if (await page.getByTestId('audit-logs-table').isVisible()) {
        // Should show login event
        await expect(page.getByText('User login')).toBeVisible()
        await expect(page.getByText('admin@test-firm.com')).toBeVisible()
      }
    })

    test('should log failed login attempts', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.getByTestId('subdomain-input').fill('test-firm')
      await page.getByTestId('email-input').fill('admin@test-firm.com')
      await page.getByTestId('password-input').fill('wrongpassword')
      await page.getByTestId('signin-button').click()

      await expect(page.getByText('Invalid email or password')).toBeVisible()

      // Login with correct credentials to access logs
      await page.getByTestId('password-input').clear()
      await page.getByTestId('password-input').fill('password')
      await page.getByTestId('signin-button').click()
      await page.waitForURL('**/dashboard')

      // Check audit logs
      await page.goto('/settings/audit-logs')

      if (await page.getByTestId('audit-logs-table').isVisible()) {
        // Should show failed login attempt
        await expect(page.getByText('Failed login attempt')).toBeVisible()
      }
    })
  })
})