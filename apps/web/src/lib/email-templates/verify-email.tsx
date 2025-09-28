import React from 'react'

interface VerifyEmailProps {
  name: string
  verificationUrl: string
  organizationName: string
  expiresIn: string // e.g., "24 hours"
}

export function VerifyEmailTemplate({
  name,
  verificationUrl,
  organizationName,
  expiresIn
}: VerifyEmailProps) {
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
        backgroundColor: '#2563eb',
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Verify Your Email
        </h1>
        <p style={{
          color: '#dbeafe',
          fontSize: '16px',
          margin: '0'
        }}>
          Confirm your {organizationName} account
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
          Welcome {name}!
        </h2>

        <p style={{
          fontSize: '16px',
          marginBottom: '20px',
          color: '#4b5563'
        }}>
          Thank you for creating your account with <strong>{organizationName}</strong>.
          To complete your registration and access all features, please verify your email address.
        </p>

        <p style={{
          fontSize: '16px',
          marginBottom: '30px',
          color: '#4b5563'
        }}>
          Click the button below to verify your email and activate your account:
        </p>

        {/* Verify Button */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={verificationUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Verify Email Address
          </a>
        </div>

        {/* What Happens Next */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '24px',
          margin: '30px 0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1e40af',
            margin: '0 0 16px 0'
          }}>
            What happens after verification:
          </h3>
          <ul style={{
            color: '#1e40af',
            fontSize: '14px',
            margin: '0',
            paddingLeft: '20px'
          }}>
            <li>Your account will be fully activated</li>
            <li>You'll gain access to all platform features</li>
            <li>You can start collaborating with your team</li>
            <li>Your data will be securely protected</li>
          </ul>
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
            {verificationUrl}
          </p>
        </div>

        {/* Security Notice */}
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
            <li>This verification link will expire in <strong>{expiresIn}</strong></li>
            <li>This link can only be used once</li>
            <li>If you didn't create this account, please ignore this email</li>
            <li>Never share this verification link with anyone</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div style={{ margin: '30px 0' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            Didn't receive this email?
          </h3>
          <ul style={{
            color: '#4b5563',
            fontSize: '14px',
            paddingLeft: '20px',
            margin: '0'
          }}>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Add support@cpaplatform.com to your contacts</li>
            <li>Contact support if you continue having issues</li>
          </ul>
        </div>

        {/* Support */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '40px 0 20px 0'
        }}>
          <p>Need help with verification?</p>
          <p>
            <a href="mailto:support@cpaplatform.com" style={{ color: '#2563eb' }}>
              Contact our support team
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
          This verification email was sent to {name} from {organizationName}
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
export function renderVerifyEmailTemplate(props: VerifyEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - ${props.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
              Verify Your Email
            </h1>
            <p style="color: #dbeafe; font-size: 16px; margin: 0;">
              Confirm your ${props.organizationName} account
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
              Welcome ${props.name}!
            </h2>

            <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
              Thank you for creating your account with <strong>${props.organizationName}</strong>.
              To complete your registration and access all features, please verify your email address.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${props.verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                🔐 Security Information
              </h3>
              <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>This verification link will expire in <strong>${props.expiresIn}</strong></li>
                <li>This link can only be used once</li>
                <li>If you didn't create this account, please ignore this email</li>
              </ul>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin: 40px 0 20px 0;">
              <p>Need help with verification?</p>
              <p>
                <a href="mailto:support@cpaplatform.com" style="color: #2563eb;">Contact our support team</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              This verification email was sent to ${props.name} from ${props.organizationName}
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