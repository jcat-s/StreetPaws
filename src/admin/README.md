# StreetPaws Admin System

## Overview
The StreetPaws Admin System is a comprehensive management platform designed for City Vet Office personnel to manage stray animal cases, adoption applications, and system operations.

## Features

### 🔐 Admin Authentication
- **Role-based access control** with different permission levels
- **Secure login system** with admin-specific credentials
- **Session management** with automatic logout

### 📊 Dashboard
- **Real-time metrics** and key performance indicators
- **Recent activity overview** with quick access to urgent items
- **Summary statistics** for reports, adoptions, and animals

### 📋 Reports Management
- **Comprehensive report review** system for lost, found, and abuse cases
- **Advanced filtering** by status, type, priority, and location
- **Detailed report viewing** with all submitted information
- **Status management** and assignment to personnel
- **Priority handling** for urgent cases

### ❤️ Adoption Management
- **Application review system** with detailed applicant information
- **Approval/rejection workflow** with reason tracking
- **Comprehensive evaluation** of home environment and experience
- **Reference verification** and background checks
- **Status tracking** throughout the adoption process

### 🐾 Animals Management
- **Complete animal records** with health and behavioral information
- **Medical history tracking** and vaccination status
- **Adoption fee management** and microchip tracking
- **Intake and status management** for all animals
- **Foster family assignment** and tracking

### 📈 Analytics Dashboard
- **Comprehensive reporting** with visual charts and metrics
- **Geographic analysis** by barangay and location
- **Trend analysis** for reports, adoptions, and donations
- **Performance indicators** and success rates
- **Monthly and yearly comparisons**

### ⚙️ System Settings
- **Admin user management** with role assignments
- **Security settings** and password management
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

