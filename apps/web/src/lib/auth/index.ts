// Authentication system exports
// Main entry point for all authentication utilities

// Auth configuration
export { authOptions } from '../auth'

// Password utilities
export {
  validatePassword,
  getPasswordStrengthLabel,
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  generatePasswordSuggestions,
  estimateCrackTime,
  DEFAULT_PASSWORD_POLICY,
  type PasswordValidationResult,
  type PasswordPolicy,
} from './password-utils'

// Session utilities
export {
  getCurrentSession,
  validateSession,
  updateLastActivity,
  logSecurityEvent,
  getUserDevices,
  revokeOtherSessions,
  checkSuspiciousActivity,
  getSessionTimeout,
  shouldExtendSession,
  type SessionInfo,
  type DeviceInfo,
} from './session-utils'

// Token utilities
export {
  generateSecureToken,
  generateUrlSafeToken,
  generateNumericToken,
  createJWTToken,
  verifyJWTToken,
  createMagicLinkToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  createInvitationToken,
  createAPIToken,
  hashToken,
  verifyTokenHash,
  createTimedToken,
  validateTokenTiming,
  generateBackupCodes,
  isValidBackupCode,
  formatBackupCode,
  generateCSRFToken,
  validateCSRFToken,
  createSessionToken,
  isTokenExpired,
  getTokenTimeRemaining,
  TOKEN_EXPIRY,
  type TokenPayload,
  type TokenValidationResult,
} from './token-utils'

// Auth service
export { authService } from '../auth-service'

// Email templates
export {
  WelcomeEmailTemplate,
  renderWelcomeEmail,
} from '../email-templates/welcome'

export {
  ResetPasswordEmailTemplate,
  renderResetPasswordEmail,
} from '../email-templates/reset-password'

export {
  TeamInviteEmailTemplate,
  renderTeamInviteEmail,
} from '../email-templates/team-invite'

export {
  VerifyEmailTemplate,
  renderVerifyEmailTemplate,
} from '../email-templates/verify-email'

export {
  MagicLinkEmailTemplate,
  renderMagicLinkEmail,
} from '../email-templates/magic-link'