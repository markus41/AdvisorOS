import React from 'react'

interface TeamInviteEmailProps {
  inviteeName: string
  inviterName: string
  organizationName: string
  role: string
  inviteUrl: string
  message?: string
  expiresIn: string // e.g., "7 days"
}

export function TeamInviteEmailTemplate({
  inviteeName,
  inviterName,
  organizationName,
  role,
  inviteUrl,
  message,
  expiresIn
}: TeamInviteEmailProps) {
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
        backgroundColor: '#16a34a',
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          You're Invited!
        </h1>
        <p style={{
          color: '#bbf7d0',
          fontSize: '16px',
          margin: '0'
        }}>
          Join {organizationName} on CPA Platform
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
          Hello {inviteeName}!
        </h2>

        <p style={{
          fontSize: '16px',
          marginBottom: '20px',
          color: '#4b5563'
        }}>
          <strong>{inviterName}</strong> has invited you to join{' '}
          <strong>{organizationName}</strong> on the CPA Platform as a{' '}
          <span style={{
            textTransform: 'capitalize' as const,
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {role}
          </span>.
        </p>

        {/* Personal Message */}
        {message && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            margin: '30px 0'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e40af',
              margin: '0 0 10px 0'
            }}>
              💌 Personal Message from {inviterName}:
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#1e40af',
              margin: '0',
              fontStyle: 'italic'
            }}>
              "{message}"
            </p>
          </div>
        )}

        {/* Organization Details */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
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
            Invitation Details
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Organization:</strong> {organizationName}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Your Role:</strong> <span style={{
              textTransform: 'capitalize' as const,
              backgroundColor: '#d1fae5',
              color: '#065f46',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>{role}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Invited by:</strong> {inviterName}
          </div>
          <div>
            <strong>Expires:</strong> In {expiresIn}
          </div>
        </div>

        {/* Accept Button */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={inviteUrl}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Accept Invitation
          </a>
        </div>

        {/* What You'll Get */}
        <div style={{ margin: '40px 0' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '20px'
          }}>
            What you'll get access to:
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: '0',
            margin: '0'
          }}>
            {[
              'Secure client portal and document management',
              'Collaborative tax return preparation tools',
              'Real-time communication with team members',
              'Advanced reporting and analytics',
              'Automated workflow management',
              'Integrated billing and time tracking'
            ].map((feature, index) => (
              <li key={index} style={{
                padding: '8px 0',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  color: '#16a34a',
                  marginRight: '12px',
                  fontSize: '18px'
                }}>✓</span>
                {feature}
              </li>
            ))}
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
            {inviteUrl}
          </p>
        </div>

        {/* Important Notes */}
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
            ⚠️ Important Notes
          </h3>
          <ul style={{
            color: '#92400e',
            fontSize: '14px',
            margin: '0',
            paddingLeft: '20px'
          }}>
            <li>This invitation expires in <strong>{expiresIn}</strong></li>
            <li>You'll need to create a password during the signup process</li>
            <li>If you already have an account, you'll be added to this organization</li>
            <li>Contact {inviterName} if you have questions about your role</li>
          </ul>
        </div>

        {/* Support */}
        <div style={{
          textAlign: 'center' as const,
          color: '#6b7280',
          fontSize: '14px',
          margin: '40px 0 20px 0'
        }}>
          <p>Questions about this invitation?</p>
          <p>
            <a href="mailto:support@cpaplatform.com" style={{ color: '#2563eb' }}>
              Contact our support team
            </a>
            {' or reach out to '}
            <strong>{inviterName}</strong>
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
          This invitation was sent by {inviterName} from {organizationName}
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
export function renderTeamInviteEmail(props: TeamInviteEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${props.organizationName}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #16a34a; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">
              You're Invited!
            </h1>
            <p style="color: #bbf7d0; font-size: 16px; margin: 0;">
              Join ${props.organizationName} on CPA Platform
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0;">
              Hello ${props.inviteeName}!
            </h2>

            <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
              <strong>${props.inviterName}</strong> has invited you to join
              <strong>${props.organizationName}</strong> on the CPA Platform as a
              <strong>${props.role}</strong>.
            </p>

            ${props.message ? `
            <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0;">
                💌 Personal Message from ${props.inviterName}:
              </h3>
              <p style="font-size: 16px; color: #1e40af; margin: 0; font-style: italic;">
                "${props.message}"
              </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 40px 0;">
              <a href="${props.inviteUrl}" style="background-color: #16a34a; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin: 40px 0 20px 0;">
              <p>Questions about this invitation?</p>
              <p>
                <a href="mailto:support@cpaplatform.com" style="color: #2563eb;">Contact our support team</a>
                or reach out to <strong>${props.inviterName}</strong>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              This invitation was sent by ${props.inviterName} from ${props.organizationName}
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