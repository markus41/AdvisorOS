import React from 'react'

interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
  organizationName: string
  expiresIn: string // e.g., "1 hour"
}

export function ResetPasswordEmailTemplate({
  name,
  resetUrl,
  organizationName,
  expiresIn
}: ResetPasswordEmailProps) {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#333333',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#dc2626',
        padding: '40px 20px',
        textAlign: 'center' as const
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Reset Your Password
        </h1>
        <p style={{
          color: '#fecaca',
          fontSize: '16px',
          margin: '0'
        }}>
          Secure your {organizationName} account
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 20px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 20px 0'
        }}>
          Hello {name},
        </h2>

        <p style={{
          fontSize: '16px',
          marginBottom: '20px',
          color: '#4b5563'
        }}>
          We received a request to reset your password for your <strong>{organizationName}</strong> account.
          If you made this request, click the button below to create a new password.
        </p>

        <p style={{
          fontSize: '16px',
          marginBottom: '30px',
          color: '#4b5563'
        }}>
          If you didn't request a password reset, you can safely ignore this email.
          Your password will remain unchanged.
        </p>

        {/* Reset Button */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={resetUrl}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Reset My Password
          </a>
        </div>

        {/* Alternative Link */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          margin: '30px 0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 10px 0'
          }}>
            Button not working?
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 10px 0'
          }}>
            Copy and paste this link into your browser:
          </p>
          <p style={{
            fontSize: '14px',
            color: '#2563eb',
            wordBreak: 'break-all' as const,
            backgroundColor: '#f3f4f6',
            padding: '8px',
            borderRadius: '4px',
            margin: '0'
          }}>
            {resetUrl}
          </p>
        </div>

        {/* Security Information */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '20px',
          margin: '30px 0'
        }}>
          <h3 style={{
            color: '#92400e',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 10px 0'
          }}>
            🔐 Security Information
          </h3>
          <ul style={{
            color: '#92400e',
            fontSize: '14px',
            margin: '0',
            paddingLeft: '20px'
          }}>
            <li>This reset link will expire in <strong>{expiresIn}</strong></li>
            <li>This link can only be used once</li>
            <li>If you didn't request this, please contact support</li>
            <li>Never share this link with anyone</li>
          </ul>
        </div>

        {/* Tips */}
        <div style={{ margin: '30px 0' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            Password Security Tips:
          </h3>
          <ul style={{
            color: '#4b5563',
            fontSize: '14px',
            paddingLeft: '20px',
            margin: '0'
          }}>
            <li>Use at least 8 characters</li>
            <li>Include uppercase and lowercase letters</li>
            <li>Add numbers and special characters</li>
            <li>Avoid common words or personal information</li>
            <li>Consider enabling two-factor authentication</li>
          </ul>
        </div>

        {/* Support */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '40px 0 20px 0'
        }}>
          <p>Having trouble? We're here to help!</p>
          <p>
            <a href="mailto:support@cpaplatform.com" style={{ color: '#2563eb' }}>
              Contact Support
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '30px 20px',
        textAlign: 'center' as const,
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          margin: '0 0 10px 0'
        }}>
          This password reset email was sent to {name} from {organizationName}
        </p>
        <p style={{
          color: '#9ca3af',
          fontSize: '12px',
          margin: '0'
        }}>
          © 2024 CPA Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}

// Function to render the template to HTML string
export function renderResetPasswordEmail(props: ResetPasswordEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ${props.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
              Reset Your Password
            </h1>
            <p style="color: #fecaca; font-size: 16px; margin: 0;">
              Secure your ${props.organizationName} account
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
              Hello ${props.name},
            </h2>

            <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
              We received a request to reset your password for your <strong>${props.organizationName}</strong> account.
              If you made this request, click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${props.resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Reset My Password
              </a>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                🔐 Security Information
              </h3>
              <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>This reset link will expire in <strong>${props.expiresIn}</strong></li>
                <li>This link can only be used once</li>
                <li>If you didn't request this, please contact support</li>
              </ul>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin: 40px 0 20px 0;">
              <p>Having trouble? We're here to help!</p>
              <p>
                <a href="mailto:support@cpaplatform.com" style="color: #2563eb;">Contact Support</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              This password reset email was sent to ${props.name} from ${props.organizationName}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 CPA Platform. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}