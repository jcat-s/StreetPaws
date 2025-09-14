# StreetPaws Admin System

## Overview
The StreetPaws Admin System is a comprehensive management platform designed for City Vet Office personnel to manage stray animal cases, adoption applications, and system operations.

## 📁 Folder Structure

```
src/admin/
├── authentication/     # Admin login and authentication
├── components/         # Admin-specific UI components
├── hooks/             # Admin authentication hooks
├── pages/             # Admin dashboard and management pages
└── utils/             # Admin utility functions
```

## 🔐 Admin Authentication & Security

### Authentication System
- **Location**: `src/admin/hooks/useAdminAuth.tsx`
- **Features**:
  - Role-based access control (admin, super_admin)
  - Authorized email whitelist system
  - Enhanced security logging for admin actions
  - Automatic logout for unauthorized users
  - Rate limiting and account lockout protection

### Admin Users Configuration
```typescript
const ADMIN_USERS = {
  'admin@streetpaws.gov.ph': {
    uid: 'admin-001',
    email: 'admin@streetpaws.gov.ph',
    role: 'admin',
    name: 'Dr. Maria Santos',
    department: 'Veterinary Services'
  },
  'superadmin@streetpaws.gov.ph': {
    uid: 'super-admin-001',
    email: 'superadmin@streetpaws.gov.ph',
    role: 'super_admin',
    name: 'Dr. Juan Dela Cruz',
    department: 'Administration'
  },
  'vet@streetpaws.gov.ph': {
    uid: 'vet-001',
    email: 'vet@streetpaws.gov.ph',
    role: 'admin',
    name: 'Dr. Ana Rodriguez',
    department: 'Animal Care'
  }
}
```

### Security Features
- **Email Whitelist**: Only authorized emails can access admin functions
- **Role-Based Access**: Different permission levels for admin vs super_admin
- **Audit Logging**: All admin actions are logged with timestamps and IP addresses
- **Session Management**: Automatic logout on inactivity or unauthorized access
- **Rate Limiting**: Protection against brute force attacks

## 📊 Admin Features

### Dashboard
- **Real-time metrics** and key performance indicators
- **Recent activity overview** with quick access to urgent items
- **Summary statistics** for reports, adoptions, and animals

### Reports Management
- **Comprehensive report review** system for lost, found, and abuse cases
- **Advanced filtering** by status, type, priority, and location
- **Detailed report viewing** with all submitted information
- **Status management** and assignment to personnel
- **Priority handling** for urgent cases

### Adoption Management
- **Application review system** with detailed applicant information
- **Approval/rejection workflow** with reason tracking
- **Comprehensive evaluation** of home environment and experience
- **Reference verification** and background checks
- **Status tracking** throughout the adoption process

### Animals Management
- **Complete animal records** with health and behavioral information
- **Medical history tracking** and vaccination status
- **Adoption fee management** and microchip tracking
- **Intake and status management** for all animals
- **Foster family assignment** and tracking

### Analytics Dashboard
- **Comprehensive reporting** with visual charts and metrics
- **Geographic analysis** by barangay and location
- **Trend analysis** for reports, adoptions, and donations
- **Performance indicators** and success rates
- **Monthly and yearly comparisons**

### System Settings
- **Admin user management** with role assignments
- **Security settings** and password management

## 🛡️ Security Implementation

### Admin Login Process
1. **Email Validation**: Check if email is in authorized whitelist
2. **Rate Limiting**: Verify IP address hasn't exceeded request limits
3. **Account Lockout**: Check if account is temporarily locked
4. **Firebase Authentication**: Authenticate with Firebase
5. **Role Assignment**: Assign appropriate admin role and permissions
6. **Audit Logging**: Log successful/failed login attempts

### Security Monitoring
- **Login Attempts**: Track all admin login attempts with success/failure status
- **IP Address Logging**: Monitor access from different IP addresses
- **Session Tracking**: Monitor admin session duration and activity
- **Action Logging**: Log all administrative actions for audit purposes

### Access Control
- **Admin Role**: Can manage reports, adoptions, and animals
- **Super Admin Role**: Full system access including user management
- **Department-Based Access**: Different access levels based on department

## 🚀 Usage Examples

### Admin Authentication
```typescript
import { useAdminAuth } from './hooks/useAdminAuth'

const { adminUser, login, logout, isAdmin } = useAdminAuth()

// Login as admin
await login('admin@streetpaws.gov.ph', 'password')

// Check if user is admin
if (isAdmin) {
  // Show admin features
}
```

### Security Monitoring
```typescript
import { securityService } from '../shared/utils/securityService'

// Generate audit log for admin action
securityService.generateAuditLog('ADMIN_REPORT_APPROVED', adminEmail, true, {
  reportId: 'report-123',
  action: 'approve'
})
```

## 📋 Admin Security Checklist

- [x] Role-based access control
- [x] Authorized email whitelist
- [x] Enhanced audit logging
- [x] Secure authentication flow
- [x] Rate limiting and account lockout
- [x] Session management
- [x] IP address monitoring
- [x] Action logging and tracking
- [x] Unauthorized access prevention
- [x] Security event monitoring

## 🔧 Configuration

Admin security settings can be configured in the `useAdminAuth.tsx` hook and related security services. See the shared security documentation for detailed configuration options.

## 📞 Support

For admin system questions or security concerns:
- Email: admin@streetpaws.gov.ph
- Phone: +63-XXX-XXX-XXXX

---

**Note**: The admin system implements comprehensive security measures to ensure only authorized personnel can access administrative functions and that all actions are properly logged and monitored.
- **Notification preferences** for different types of alerts
- **System maintenance** and backup management
- **Database monitoring** and health checks

## Admin Credentials

### Demo Accounts
For testing purposes, use these credentials:

1. **Super Admin**
   - Email: `superadmin@streetpaws.gov.ph`
   - Password: `superadmin123`
   - Role: Super Administrator
   - Access: Full system access

2. **Admin**
   - Email: `admin@streetpaws.gov.ph`
   - Password: `admin123`
   - Role: Administrator
   - Access: Full management access

3. **Veterinarian**
   - Email: `vet@streetpaws.gov.ph`
   - Password: `vet123`
   - Role: Admin
   - Access: Animal and report management

## Navigation

### Main Navigation
- **Dashboard**: Overview and quick actions
- **Reports**: Manage all animal reports
- **Adoptions**: Review adoption applications
- **Animals**: Manage animal records
- **Analytics**: View reports and statistics
- **Settings**: System configuration

### Quick Actions
- **Urgent Reports**: Handle high-priority cases
- **Pending Reviews**: Process adoption applications
- **New Animals**: Manage recently added animals

## Key Workflows

### Report Processing
1. **Review** incoming reports from the public
2. **Assign** cases to appropriate personnel
3. **Update status** as investigation progresses
4. **Resolve** cases and update outcomes

### Adoption Process
1. **Review** adoption applications thoroughly
2. **Evaluate** applicant suitability and home environment
3. **Check references** and verify information
4. **Make decision** with detailed reasoning
5. **Notify** applicant of outcome

### Animal Management
1. **Add** new animals to the system
2. **Update** health and behavioral information
3. **Track** medical treatments and vaccinations
4. **Manage** adoption status and fees

## Security Features

- **Role-based permissions** for different admin levels
- **Secure authentication** with session management
- **Audit trails** for all admin actions
- **Data encryption** for sensitive information
- **Access logging** for security monitoring

## Technical Details

### Architecture
- **Frontend**: React with TypeScript
- **State Management**: Zustand for admin-specific state
- **Authentication**: Firebase Auth with custom admin roles
- **Styling**: Tailwind CSS with consistent design system
- **Routing**: React Router with protected routes

### Data Management
- **Mock Data**: Currently uses mock data for demonstration
- **Database Integration**: Ready for Firebase/Firestore integration
- **Real-time Updates**: Prepared for live data synchronization
- **Backup Systems**: Automated backup and recovery

## Getting Started

1. **Access the Admin Panel**: Navigate to `/admin` in your browser
2. **Login**: Use one of the demo admin credentials
3. **Explore**: Start with the Dashboard to understand the system
4. **Manage**: Use the various management sections as needed

## Support

For technical support or questions about the admin system:
- **Email**: admin@streetpaws.gov.ph
- **Documentation**: This README and inline help text
- **Training**: Contact system administrator for training sessions

---

**StreetPaws Admin System** - Empowering City Vet personnel to manage animal welfare efficiently and effectively.

