import React from 'react'

interface MagicLinkEmailProps {
  name: string
  magicLinkUrl: string
  organizationName: string
  ipAddress: string
  userAgent: string
  expiresIn: string // e.g., "15 minutes"
}

export function MagicLinkEmailTemplate({
  name,
  magicLinkUrl,
  organizationName,
  ipAddress,
  userAgent,
  expiresIn
}: MagicLinkEmailProps) {
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
        backgroundColor: '#7c3aed',
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Your Magic Link
        </h1>
        <p style={{
          color: '#c4b5fd',
          fontSize: '16px',
          margin: '0'
        }}>
          Sign in to {organizationName} instantly
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
          Hello {name}!
        </h2>

        <p style={{
          fontSize: '16px',
          marginBottom: '20px',
          color: '#4b5563'
        }}>
          You requested a magic link to sign in to your <strong>{organizationName}</strong> account.
          Click the button below to sign in instantly without entering your password.
        </p>

        {/* Sign In Button */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={magicLinkUrl}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Sign In Instantly
          </a>
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
            🔐 Security Details
          </h3>
          <div style={{
            color: '#92400e',
            fontSize: '14px',
            margin: '0'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Request from:</strong> {ipAddress}
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Browser:</strong> {userAgent.substring(0, 50)}...
            </p>
            <p style={{ margin: '0' }}>
              <strong>Expires:</strong> In {expiresIn}
            </p>
          </div>
        </div>

        {/* How It Works */}
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
            How Magic Links Work:
          </h3>
          <div style={{
            color: '#1e40af',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>🔗</span>
              <span>One-time use link for secure authentication</span>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>⏰</span>
              <span>Automatically expires for your security</span>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>🛡️</span>
              <span>No password required - just click and you're in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>📱</span>
              <span>Works on any device where you can access email</span>
            </div>
          </div>
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
            color: '#7c3aed',
            wordBreak: 'break-all' as const,
            backgroundColor: '#f3f4f6',
            padding: '8px',
            borderRadius: '4px',
            margin: '0'
          }}>
            {magicLinkUrl}
          </p>
        </div>

        {/* Didn't Request This? */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '20px',
          margin: '30px 0'
        }}>
          <h3 style={{
            color: '#dc2626',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 10px 0'
          }}>
            Didn't request this?
          </h3>
          <p style={{
            color: '#dc2626',
            fontSize: '14px',
            margin: '0 0 10px 0'
          }}>
            If you didn't request this magic link, you can safely ignore this email.
            Your account remains secure.
          </p>
          <p style={{
            color: '#dc2626',
            fontSize: '14px',
            margin: '0'
          }}>
            Consider changing your password if you're concerned about unauthorized access attempts.
          </p>
        </div>

        {/* Alternative Sign In */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '40px 0 20px 0'
        }}>
          <p>Prefer to use your password?</p>
          <p>
            <a href="/auth/signin" style={{ color: '#7c3aed' }}>
              Sign in with password instead
            </a>
          </p>
        </div>

        {/* Support */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '20px 0'
        }}>
          <p>Having trouble signing in?</p>
          <p>
            <a href="mailto:support@cpaplatform.com" style={{ color: '#7c3aed' }}>
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
          This magic link was requested for {name} from {organizationName}
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
export function renderMagicLinkEmail(props: MagicLinkEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Magic Link - ${props.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #7c3aed; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
              Your Magic Link
            </h1>
            <p style="color: #c4b5fd; font-size: 16px; margin: 0;">
              Sign in to ${props.organizationName} instantly
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
              Hello ${props.name}!
            </h2>

            <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
              You requested a magic link to sign in to your <strong>${props.organizationName}</strong> account.
              Click the button below to sign in instantly without entering your password.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${props.magicLinkUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; display: inline-block;">
                Sign In Instantly
              </a>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                🔐 Security Details
              </h3>
              <div style="color: #92400e; font-size: 14px;">
                <p style="margin: 0 0 8px 0;"><strong>Expires:</strong> In ${props.expiresIn}</p>
                <p style="margin: 0;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin: 40px 0 20px 0;">
              <p>Having trouble signing in?</p>
              <p>
                <a href="mailto:support@cpaplatform.com" style="color: #7c3aed;">Contact our support team</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              This magic link was requested for ${props.name} from ${props.organizationName}
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