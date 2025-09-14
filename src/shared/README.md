# Shared Components & Services

This folder contains shared utilities, services, and components used across the StreetPaws application.

## 📁 Folder Structure

```
src/shared/
├── components/          # Reusable UI components
├── constants/          # Application constants
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Utility services and helpers
```

## 🔐 Security Services

### Authentication & Security
- **`securityService.ts`** - Comprehensive security management
  - Rate limiting (10 requests/minute)
  - Account lockout (5 failed attempts = 15min lockout)
  - IP-based tracking
  - Security audit logging
  - Login attempt monitoring

### Two-Factor Authentication
- **`twoFactorAuthService.ts`** - TOTP-based 2FA implementation
  - QR code generation
  - Time-based code validation
  - Backup codes for recovery
  - Clock skew tolerance

### Session Management
- **`sessionService.ts`** - Advanced session handling
  - 30-minute session timeout
  - 15-minute inactivity timeout
  - Activity monitoring (mouse, keyboard, scroll, touch)
  - Session warning system

### Privacy & Compliance
- **`privacyService.ts`** - GDPR/RA 10173 compliance
  - Granular consent management
  - Data export functionality
  - Right to erasure
  - Data retention policies
  - Privacy settings management

### Email Verification
- **`emailVerificationHelper.ts`** - Email validation and verification
  - Disposable email blocking
  - Real-time validation
  - Email format verification
  - Provider suggestions

## 🛡️ Security Configuration

### Rate Limiting
```typescript
const securityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  rateLimitWindow: 60 * 1000, // 1 minute
  maxRequestsPerWindow: 10
}
```

### Session Management
```typescript
const sessionConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minutes before timeout
  refreshInterval: 60 * 1000, // Check every minute
  maxInactivityTime: 15 * 60 * 1000 // 15 minutes of inactivity
}
```

### Data Retention Policy
```typescript
const dataRetentionPolicy = {
  userData: 2555, // 7 years
  activityLogs: 90, // 3 months
  securityLogs: 365, // 1 year
  analyticsData: 26 // 26 months
}
```

## 🔒 Security Features

### Password Security
- Strong password requirements (8+ chars, mixed case, numbers, special chars)
- Real-time password strength validation
- Visual password strength indicators
- Secure password change with re-authentication

### Account Protection
- Email verification enforcement
- Two-factor authentication (2FA)
- Account lockout protection
- Rate limiting and brute force prevention
- Session management with automatic timeouts

### Data Privacy (RA 10173 Compliance)
- Granular consent management (essential, functional, analytics, marketing)
- Data export functionality (GDPR Article 20)
- Right to erasure (GDPR Article 17)
- Consent withdrawal capability
- Data retention policy enforcement
- Privacy policy integration

### Security Monitoring
- Comprehensive audit logging
- Security event tracking
- Failed attempt monitoring
- Real-time security statistics
- IP address and user agent logging

## 🚀 Usage Examples

### Security Service
```typescript
import { securityService } from './shared/utils/securityService'

// Record login attempt
securityService.recordLoginAttempt(email, success, ipAddress)

// Check account lockout
const isLocked = securityService.isAccountLocked(email)

// Generate audit log
securityService.generateAuditLog('LOGIN_SUCCESS', email, true)
```

### Two-Factor Authentication
```typescript
import { twoFactorAuthService } from './shared/utils/twoFactorAuthService'

// Generate 2FA secret
const secret = twoFactorAuthService.generateSecret(userEmail)

// Verify TOTP code
const isValid = twoFactorAuthService.verifyCode(secret.secret, userCode)
```

### Privacy Management
```typescript
import { privacyService } from './shared/utils/privacyService'

// Update privacy settings
privacyService.updatePrivacySettings({
  analytics: true,
  marketing: false
})

// Export user data
const dataExport = privacyService.generateDataExport(userId)
```

### Session Management
```typescript
import { sessionService } from './shared/utils/sessionService'

// Start session monitoring
sessionService.startSessionMonitoring()

// Check session status
const isActive = sessionService.isSessionActive()
```

## 📋 Security Checklist

- [x] Rate limiting and account lockout
- [x] Two-factor authentication (2FA)
- [x] Session management with timeouts
- [x] Comprehensive audit logging
- [x] Data privacy compliance (RA 10173)
- [x] Email verification system
- [x] Password security enforcement
- [x] Security monitoring and tracking
- [x] Privacy consent management
- [x] Data export and deletion rights

## 🔧 Configuration

All security services are configured with sensible defaults but can be customized through their respective configuration objects. See individual service files for detailed configuration options.

## 📞 Support

For security-related questions or to report vulnerabilities:
- Email: security@streetpaws.gov.ph
- Phone: +63-XXX-XXX-XXXX

---

**Note**: This shared security implementation provides a solid foundation for secure authentication and account management across the entire StreetPaws application.
