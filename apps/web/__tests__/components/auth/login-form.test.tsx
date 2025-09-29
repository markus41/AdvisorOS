import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import { LoginForm } from '@/components/auth/login-form'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
}

const mockSearchParams = {
  get: jest.fn(),
}

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'callbackUrl':
          return '/dashboard'
        case 'error':
          return null
        default:
          return null
      }
    })
  })

  it('should render all form fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/keep me signed in/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/organization is required/i)).toBeInTheDocument()
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        subdomain: 'test-org',
        rememberMe: 'false',
        twoFactorCode: undefined,
        redirect: false,
      })
    })

    expect(mockToast.success).toHaveBeenCalledWith('Signed in successfully!')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should handle remember me checkbox', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ ok: true })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByLabelText(/keep me signed in/i))

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        subdomain: 'test-org',
        rememberMe: 'true',
        twoFactorCode: undefined,
        redirect: false,
      })
    })
  })

  it('should handle 2FA requirement', async () => {
    const user = userEvent.setup()
    const onNeedTwoFactor = jest.fn()
    mockSignIn.mockResolvedValue({ error: '2FA code required' })

    render(<LoginForm onNeedTwoFactor={onNeedTwoFactor} />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
      expect(screen.getByText(/enter the 6-digit code from your authenticator app/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /verify & sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to password/i })).toBeInTheDocument()
    })

    expect(onNeedTwoFactor).toHaveBeenCalledWith(true)
    expect(mockToast.error).toHaveBeenCalledWith('Please enter your 2FA code')
  })

  it('should handle 2FA code submission', async () => {
    const user = userEvent.setup()
    mockSignIn
      .mockResolvedValueOnce({ error: '2FA code required' })
      .mockResolvedValueOnce({ ok: true })

    render(<LoginForm />)

    // First submission triggers 2FA
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    // Submit with 2FA code
    await user.type(screen.getByLabelText(/two-factor authentication code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify & sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenLastCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        subdomain: 'test-org',
        rememberMe: 'false',
        twoFactorCode: '123456',
        redirect: false,
      })
    })
  })

  it('should handle invalid 2FA code', async () => {
    const user = userEvent.setup()
    mockSignIn
      .mockResolvedValueOnce({ error: '2FA code required' })
      .mockResolvedValueOnce({ error: 'Invalid 2FA code' })

    render(<LoginForm />)

    // Trigger 2FA
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    // Submit invalid 2FA code
    await user.type(screen.getByLabelText(/two-factor authentication code/i), '000000')
    await user.click(screen.getByRole('button', { name: /verify & sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid 2fa code/i)).toBeInTheDocument()
      expect(mockToast.error).toHaveBeenCalledWith('Invalid 2FA code')
    })
  })

  it('should reset 2FA state when clicking back', async () => {
    const user = userEvent.setup()
    const onNeedTwoFactor = jest.fn()
    mockSignIn.mockResolvedValue({ error: '2FA code required' })

    render(<LoginForm onNeedTwoFactor={onNeedTwoFactor} />)

    // Trigger 2FA
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    // Type 2FA code
    await user.type(screen.getByLabelText(/two-factor authentication code/i), '123456')

    // Click back
    await user.click(screen.getByRole('button', { name: /back to password/i }))

    expect(screen.queryByLabelText(/two-factor authentication code/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(onNeedTwoFactor).toHaveBeenCalledWith(false)
  })

  it('should handle various sign-in errors', async () => {
    const user = userEvent.setup()

    const errorCases = [
      { error: 'CredentialsSignin', expectedMessage: 'Invalid email or password' },
      { error: 'SessionExpired', expectedMessage: 'Your session has expired. Please sign in again.' },
      { error: 'UserNotInOrganization', expectedMessage: 'You are not a member of this organization' },
      { error: 'UnknownError', expectedMessage: 'UnknownError' },
    ]

    for (const { error, expectedMessage } of errorCases) {
      mockSignIn.mockResolvedValue({ error })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/organization/i), 'test-org')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(expectedMessage)
      })

      mockToast.error.mockClear()
    }
  })

  it('should display error messages from URL params', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'error') return 'CredentialsSignin'
      if (key === 'callbackUrl') return '/dashboard'
      return null
    })

    render(<LoginForm />)

    expect(mockToast.error).toHaveBeenCalledWith('Invalid email or password')
  })

  it('should handle loading state', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(screen.getByText(/signing in.../i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('test-org')).toBeDisabled()
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('should handle unexpected errors', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred')
    })
  })

  it('should use custom callback URL from search params', async () => {
    const user = userEvent.setup()
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'callbackUrl') return '/custom-dashboard'
      return null
    })
    mockSignIn.mockResolvedValue({ ok: true })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-dashboard')
    })
  })

  it('should apply custom className', () => {
    const { container } = render(<LoginForm className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should limit 2FA code input to 6 characters', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: '2FA code required' })

    render(<LoginForm />)

    // Trigger 2FA
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    const twoFactorInput = screen.getByLabelText(/two-factor authentication code/i)
    expect(twoFactorInput).toHaveAttribute('maxLength', '6')
  })

  it('should require 2FA code when 2FA is enabled and not provided', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: '2FA code required' })

    render(<LoginForm />)

    // Trigger 2FA
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    // Try to submit without 2FA code
    await user.click(screen.getByRole('button', { name: /verify & sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/2fa code is required/i)).toBeInTheDocument()
    })
  })

  it('should preserve form data when switching between 2FA states', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: '2FA code required' })

    render(<LoginForm />)

    // Fill form
    await user.type(screen.getByLabelText(/organization/i), 'test-org')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByLabelText(/keep me signed in/i))
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication code/i)).toBeInTheDocument()
    })

    // Go back
    await user.click(screen.getByRole('button', { name: /back to password/i }))

    // Check that form data is preserved
    expect(screen.getByDisplayValue('test-org')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('password123')).toBeInTheDocument()
    expect(screen.getByLabelText(/keep me signed in/i)).toBeChecked()
  })
})