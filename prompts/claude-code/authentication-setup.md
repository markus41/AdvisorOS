# Authentication System Setup with Azure AD B2C

## Complete Authentication Implementation

### Core Authentication Prompt
```
Implement a complete authentication system for the CPA platform using Azure AD B2C with the following specifications:

**Technology Stack:**
- Next.js 14 App Router
- NextAuth.js v5
- Azure AD B2C as identity provider
- Prisma for session storage
- TypeScript with strict mode

**Authentication Features:**

1. **Registration Flow**
   - Organization setup (first user becomes owner)
   - Email verification required
   - Strong password requirements
   - Terms of service acceptance
   - Automatic organization subdomain creation

2. **Login System**
   - Email/password authentication
   - Remember me functionality
   - Failed attempt tracking
   - Account lockout after 5 attempts
   - Password reset via email

3. **Multi-Tenant Architecture**
   - Organization-based isolation
   - Subdomain routing (org.cpaplatform.com)
   - Cross-tenant access prevention
   - Organization switching for users with multiple orgs

4. **Role-Based Access Control**
   Roles:
   - Owner: Full access, billing, can delete organization
   - Admin: User management, settings, all features
   - CPA: Client management, documents, reports
   - Staff: Limited access, view-only for most features

5. **Session Management**
   - JWT tokens with refresh tokens
   - 30-minute access token expiry
   - 7-day refresh token expiry
   - Sliding session extension
   - Device tracking

6. **Security Features**
   - CSRF protection
   - XSS prevention
   - SQL injection prevention
   - Rate limiting on auth endpoints
   - Audit logging for all auth events

**File Structure Required:**

/app/api/auth/[...nextauth]/route.ts - NextAuth configuration
/lib/auth.ts - Authentication utilities
/lib/auth/azure-ad-b2c.ts - Azure AD B2C provider setup
/lib/auth/session.ts - Session management
/middleware.ts - Route protection middleware
/app/(auth)/login/page.tsx - Login page
/app/(auth)/register/page.tsx - Registration page
/app/(auth)/forgot-password/page.tsx - Password reset
/app/(auth)/verify-email/page.tsx - Email verification
/components/auth/LoginForm.tsx - Login form component
/components/auth/RegisterForm.tsx - Registration form component
/components/auth/ProtectedRoute.tsx - Route protection wrapper

**Database Schema Updates:**
- User model with role enum
- Session model for NextAuth
- Account model for OAuth
- VerificationToken model
- AuditLog model for auth events

Implement all files with complete error handling, loading states, and TypeScript types.
```

### Azure AD B2C Integration Prompt
```
Configure Azure AD B2C integration with custom user flows:

**B2C Configuration:**

1. **User Flows to Create:**
   - Sign up and sign in (combined)
   - Password reset
   - Profile editing
   - MFA enrollment

2. **Custom Attributes:**
   - organizationId (string)
   - role (string)
   - department (string)
   - phoneNumber (string)

3. **Branding Configuration:**
   - Custom logo upload
   - Brand colors
   - Custom CSS
   - Email templates

4. **API Connectors:**
   - Pre-registration validation
   - Post-registration webhook
   - Claims enrichment

5. **Token Configuration:**
   - Include custom claims
   - Set token lifetimes
   - Refresh token settings

**Implementation Code:**

/lib/auth/azure-ad-b2c-config.ts:
- Tenant configuration
- User flow endpoints
- Scope definitions
- Metadata endpoints

/lib/auth/token-validator.ts:
- JWT validation
- Claims extraction
- Token refresh logic
- Signature verification

/app/api/auth/b2c-webhook/route.ts:
- User creation webhook
- Claims transformation
- Organization assignment
- Welcome email trigger

Provide complete implementation with error handling and retry logic.
```

### Client Portal Authentication Prompt
```
Implement separate authentication for client portal access:

**Client Portal Requirements:**

1. **Separate Auth Context:**
   - Different login page (/portal/login)
   - Client-specific session
   - No access to admin features
   - Simplified UI

2. **Client Registration:**
   - Invitation-only via email
   - Token-based invitation links
   - 72-hour expiry on invitations
   - One-time use tokens

3. **Limited Permissions:**
   - View own documents only
   - Submit requested documents
   - View messages from CPA
   - No user management

4. **Portal Features:**
   /portal/dashboard - Client dashboard
   /portal/documents - Document viewer
   /portal/messages - Secure messaging
   /portal/profile - Client profile

**Security Measures:**
- Separate session cookies
- Different JWT signing keys
- IP restrictions optional
- Activity logging

Implement complete client portal authentication flow.
```

### Enterprise SSO Integration Prompt
```
Add enterprise SSO support via Azure AD/Entra ID:

**SSO Features:**

1. **SAML 2.0 Support:**
   - SP-initiated SSO
   - IdP metadata consumption
   - Attribute mapping
   - Single logout

2. **Auto-provisioning:**
   - JIT user creation
   - Attribute synchronization
   - Group mapping to roles
   - Deprovisioning support

3. **Multi-organization SSO:**
   - Per-organization SSO config
   - Multiple IdP support
   - Fallback to password auth
   - SSO bypass for admins

**Configuration UI:**
/app/settings/sso/page.tsx - SSO configuration
/app/settings/sso/test/page.tsx - SSO testing tool
/app/settings/sso/mappings/page.tsx - Attribute mappings

Implement SSO with complete error handling and testing capabilities.
```

### Session Security Prompt
```
Implement advanced session security features:

**Security Features:**

1. **Device Management:**
   - Device fingerprinting
   - Trusted device registration
   - Device-specific tokens
   - Remote session termination

2. **Anomaly Detection:**
   - Unusual location detection
   - Impossible travel analysis
   - New device notifications
   - Concurrent session limits

3. **MFA Implementation:**
   - TOTP support
   - SMS backup codes
   - Biometric on mobile
   - Remember device option

4. **Session Monitoring:**
   /app/settings/security/sessions/page.tsx
   - Active sessions list
   - Session details (IP, device, location)
   - Revoke session capability
   - Session activity log

Implement complete session security system with UI.
```

### Audit Logging Prompt
```
Create comprehensive authentication audit logging:

**Audit Events to Track:**

1. **Authentication Events:**
   - Successful login
   - Failed login attempts
   - Password changes
   - MFA enablement/disablement
   - Session creation/termination

2. **User Management:**
   - User creation/deletion
   - Role changes
   - Permission updates
   - Invitation sent/accepted

3. **Security Events:**
   - Account lockouts
   - Password reset requests
   - Suspicious activity detected
   - SSO configuration changes

**Implementation:**
/lib/audit/logger.ts - Audit logging service
/app/api/audit/route.ts - Audit API endpoints
/app/admin/audit/page.tsx - Audit log viewer

Features:
- Immutable log storage
- Search and filtering
- Export capabilities
- Retention policies
- Real-time alerts

Provide complete audit system implementation.
```