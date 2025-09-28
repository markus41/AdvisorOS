import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Go to the login page
  await page.goto('/auth/signin')

  // Wait for the page to load
  await expect(page.getByText('Sign In')).toBeVisible()

  // Fill in the login form
  await page.getByTestId('subdomain-input').fill('test-firm')
  await page.getByTestId('email-input').fill('admin@test-firm.com')
  await page.getByTestId('password-input').fill('password')

  // Click the sign in button
  await page.getByTestId('signin-button').click()

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard')
  await expect(page.getByText('Dashboard')).toBeVisible()

  // Save authentication state
  await page.context().storageState({ path: authFile })
})