# User Interface & Authentication

This folder contains all user-facing components, authentication systems, and privacy features for the StreetPaws application.

## 📁 Folder Structure

```
src/user/
├── authentication/     # Login, signup, email verification
├── components/         # User interface components
├── hooks/             # User-specific React hooks
├── pages/             # Main application pages
└── utils/             # User utility functions
```

## 🔐 User Authentication System

### Authentication Features
- **Location**: `src/contexts/AuthContext.tsx`
- **Features**:
  - Email verification enforcement
  - Strong password requirements
  - Two-factor authentication (2FA)
  - Session management with timeouts
  - Rate limiting and account lockout

### Email Verification System
- **Location**: `src/user/authentication/EmailVerificationModal.tsx`
- **Features**:
  - Automatic email verification after signup
  - Resend verification with cooldown timer
  - Email verification status tracking
  - User-friendly error messages
  - Blocks fake/disposable email addresses

### Password Security
- **Location**: `src/user/authentication/SignUpModal.tsx`
- **Features**:
  - Strong password requirements (8+ chars, uppercase, lowercase, number, special character)
  - Real-time password strength validation
  - Visual password strength indicators
  - Secure password change with re-authentication

### Two-Factor Authentication
- **Location**: `src/user/components/TwoFactorSetupModal.tsx`
- **Features**:
  - TOTP-based 2FA using authenticator apps
  - QR code generation for easy setup
  - Backup codes for account recovery
  - Time-based code validation with clock skew tolerance

## 🛡️ Security Components

### Account Security Settings
- **Location**: `src/user/components/AccountSecuritySettings.tsx`
- **Features**:
  - Password change interface
  - Email verification status
  - Login activity monitoring
  - Session information display
  - Security statistics
  - 2FA management

### Session Management
- **Location**: `src/user/components/SessionWarningModal.tsx`
- **Features**:
  - 30-minute session timeout
  - 15-minute inactivity timeout
  - Session warning 5 minutes before expiry
  - Automatic logout on timeout
  - Session extension capability
  - Activity monitoring (mouse, keyboard, scroll, touch)

### Privacy & Consent
- **Location**: `src/user/components/PrivacyConsentModal.tsx`
- **Features**:
  - GDPR/RA 10173 compliance
  - Granular consent management (essential, functional, analytics, marketing)
  - Data export functionality
  - Right to erasure
  - Consent withdrawal capability
  - Privacy policy integration

## 📱 User Interface Pages

### Main Pages
- **Home**: Landing page with key features
- **About Us**: Information about StreetPaws
- **Contact Us**: Contact information and form
- **Our Animals**: Available animals for adoption
- **Lost & Found**: Report and search for lost/found animals
- **Donate**: Donation information and form
- **Join Us**: Volunteer application form
- **Transparency Dashboard**: Public statistics and reports

### Forms
- **Adoption Form**: Comprehensive adoption application
- **Donation Form**: Donation processing
- **Volunteer Form**: Volunteer application
- **Report Forms**: Lost, found, and abuse reporting

## 🔒 Privacy & Data Protection

### Data Privacy Compliance (RA 10173)
- **Granular Consent**: Users can choose what data to share
- **Data Export**: Users can download their data
- **Right to Erasure**: Users can request data deletion
- **Data Retention**: Automatic data cleanup based on policy
- **Privacy Settings**: User-controlled privacy preferences

### Consent Management
```typescript
interface PrivacySettings {
  analytics: boolean      // Analytics data collection
  marketing: boolean      // Marketing communications
  essential: boolean      // Essential app functionality (always true)
  functional: boolean     // Enhanced user experience
}
```

### Data Retention Policy
```typescript
const dataRetentionPolicy = {
  userData: 2555,        // 7 years
  activityLogs: 90,      // 3 months
  securityLogs: 365,     // 1 year
  analyticsData: 26      // 26 months
}
```

## 🚀 Usage Examples

### User Authentication
```typescript
import { useAuth } from '../contexts/AuthContext'

const { currentUser, login, signup, logout } = useAuth()

// Login user
await login(email, password)

// Signup new user
await signup(email, password)

// Logout user
await logout()
```

### Privacy Management
```typescript
import { privacyService } from '../shared/utils/privacyService'

// Get privacy settings
const settings = privacyService.getPrivacySettings()

// Update privacy settings
privacyService.updatePrivacySettings({
  analytics: true,
  marketing: false
})

// Export user data
const dataExport = privacyService.generateDataExport(userId)
```

### Two-Factor Authentication
```typescript
import { twoFactorAuthService } from '../shared/utils/twoFactorAuthService'

// Setup 2FA
const secret = twoFactorAuthService.generateSecret(userEmail)

// Verify 2FA code
const isValid = twoFactorAuthService.verifyCode(secret.secret, userCode)
```

## 📋 User Security Checklist

- [x] Email verification system
- [x] Strong password requirements
- [x] Two-factor authentication (2FA)
- [x] Account lockout protection
- [x] Rate limiting
- [x] Session management
- [x] Security audit logging
- [x] GDPR compliance
- [x] Data privacy controls
- [x] Security monitoring
- [x] User security settings
- [x] Privacy consent management
- [x] Data export and deletion rights

## 🔧 Configuration

User authentication and privacy settings are configured through the shared security services. See the shared documentation for detailed configuration options.

## 📞 Support

For user account questions or privacy concerns:
- Email: support@streetpaws.gov.ph
- Phone: +63-XXX-XXX-XXXX

---

**Note**: The user system implements comprehensive security and privacy measures to protect user data and ensure compliance with Philippine data privacy laws (RA 10173) and international standards.
