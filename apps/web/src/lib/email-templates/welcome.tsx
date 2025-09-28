import React from 'react'

interface WelcomeEmailProps {
  name: string
  organizationName: string
  subdomain: string
  role: string
  dashboardUrl: string
}

export function WelcomeEmailTemplate({
  name,
  organizationName,
  subdomain,
  role,
  dashboardUrl
}: WelcomeEmailProps) {
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Welcome to {organizationName}!
        </h1>
        <p style={{
          color: '#e5e7eb',
          fontSize: '16px',
          margin: '0'
        }}>
          Your CPA platform account is ready
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
          Congratulations! Your account has been successfully created for{' '}
          <strong>{organizationName}</strong>. You now have access to our comprehensive
          CPA platform with your role as <strong>{role}</strong>.
        </p>

        {/* Account Details */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          margin: '30px 0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Account Information
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Organization:</strong> {organizationName}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Your Role:</strong> <span style={{
              textTransform: 'capitalize' as const,
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>{role}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Organization URL:</strong> {subdomain}.cpa.com
          </div>
          <div>
            <strong>Email:</strong> {/* This would be passed as a prop */}
          </div>
        </div>

        {/* Get Started Button */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={dashboardUrl}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Access Your Dashboard
          </a>
        </div>

        {/* Features List */}
        <div style={{ margin: '40px 0' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '20px'
          }}>
            What you can do now:
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: '0',
            margin: '0'
          }}>
            {[
              'Access your personalized dashboard',
              'Manage client information and documents',
              'Track tax return progress',
              'Collaborate with your team',
              'Generate reports and analytics',
              'Set up secure document sharing'
            ].map((feature, index) => (
              <li key={index} style={{
                padding: '8px 0',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  color: '#10b981',
                  marginRight: '12px',
                  fontSize: '18px'
                }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Security Notice */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          margin: '30px 0'
        }}>
          <h4 style={{
            color: '#92400e',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 8px 0'
          }}>
            🔐 Security Tip
          </h4>
          <p style={{
            color: '#92400e',
            fontSize: '14px',
            margin: '0'
          }}>
            For enhanced security, we recommend enabling two-factor authentication (2FA)
            in your account settings once you log in.
          </p>
        </div>

        {/* Support */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '40px 0 20px 0'
        }}>
          <p>Need help getting started?</p>
          <p>
            <a href="mailto:support@cpaplatform.com" style={{ color: '#2563eb' }}>
              Contact our support team
            </a>
            {' | '}
            <a href={`${dashboardUrl}/help`} style={{ color: '#2563eb' }}>
              View documentation
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
          This email was sent by CPA Platform to {name}
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
export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  // In a real application, you'd use a proper React SSR solution
  // For now, we'll return the static HTML structure
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${props.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        ${/* The actual rendered component would go here */}
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
              Welcome to ${props.organizationName}!
            </h1>
            <p style="color: #e5e7eb; font-size: 16px; margin: 0;">
              Your CPA platform account is ready
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
              Hello ${props.name}!
            </h2>

            <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
              Congratulations! Your account has been successfully created for
              <strong>${props.organizationName}</strong>. You now have access to our comprehensive
              CPA platform with your role as <strong>${props.role}</strong>.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${props.dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin: 40px 0 20px 0;">
              <p>Need help getting started?</p>
              <p>
                <a href="mailto:support@cpaplatform.com" style="color: #2563eb;">Contact our support team</a>
                |
                <a href="${props.dashboardUrl}/help" style="color: #2563eb;">View documentation</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              This email was sent by CPA Platform to ${props.name}
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