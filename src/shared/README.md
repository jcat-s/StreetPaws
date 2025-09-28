# Shared Components & Services

This folder contains shared utilities, services, and components used across the StreetPaws application.

## 📁 Folder Structure

```
src/shared/
├── constants/          # Application constants
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

## 🔒 Security Features

### Password Security
- Strong password requirements (8+ chars, mixed case, numbers, special chars)
- Real-time password strength validation
- Visual password strength indicators
- Secure password change with re-authentication

### Account Protection
- Email verification enforcement
- Account lockout protection
- Rate limiting and brute force prevention

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

## 📋 Security Checklist

- [x] Rate limiting and account lockout
- [x] Comprehensive audit logging
- [x] Email verification system
- [x] Password security enforcement
- [x] Security monitoring and tracking

## 🔧 Configuration

The security service is configured with sensible defaults but can be customized through its configuration object. See the securityService.ts file for detailed configuration options.

---

**Note**: This shared security implementation provides a solid foundation for secure authentication and account management across the entire StreetPaws application.
