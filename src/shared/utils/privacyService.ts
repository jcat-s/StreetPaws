/**
 * Privacy and GDPR Compliance Service
 * Handles data privacy, user consent, and GDPR compliance features
 */

interface PrivacySettings {
  analytics: boolean
  marketing: boolean
  essential: boolean
  functional: boolean
}

interface UserConsent {
  timestamp: Date
  version: string
  settings: PrivacySettings
  ipAddress: string
  userAgent: string
}

interface DataRetentionPolicy {
  userData: number // days
  activityLogs: number // days
  securityLogs: number // days
  analyticsData: number // days
}

class PrivacyService {
  private consentKey = 'streetpaws_user_consent'
  private privacySettingsKey = 'streetpaws_privacy_settings'
  private dataRetentionPolicy: DataRetentionPolicy = {
    userData: 2555, // 7 years (legal requirement for some jurisdictions)
    activityLogs: 90, // 3 months
    securityLogs: 365, // 1 year
    analyticsData: 26 // 26 months (GDPR standard)
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    const stored = localStorage.getItem(this.privacySettingsKey)
    if (stored) {
      return JSON.parse(stored)
    }
    
    // Default settings (all false except essential)
    return {
      analytics: false,
      marketing: false,
      essential: true, // Always true - required for app functionality
      functional: false
    }
  }

  /**
   * Update privacy settings
   */
  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    const currentSettings = this.getPrivacySettings()
    const newSettings = { ...currentSettings, ...settings }
    
    localStorage.setItem(this.privacySettingsKey, JSON.stringify(newSettings))
    
    // Log consent update
    this.recordConsentUpdate(newSettings)
  }

  /**
   * Get user consent record
   */
  getUserConsent(): UserConsent | null {
    const stored = localStorage.getItem(this.consentKey)
    return stored ? JSON.parse(stored) : null
  }

  /**
   * Record user consent
   */
  recordConsent(settings: PrivacySettings): void {
    const consent: UserConsent = {
      timestamp: new Date(),
      version: '1.0',
      settings,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    }
    
    localStorage.setItem(this.consentKey, JSON.stringify(consent))
    
    // Log consent in audit trail
    console.log('User consent recorded:', consent)
  }

  /**
   * Record consent update
   */
  private recordConsentUpdate(settings: PrivacySettings): void {
    const previousConsent = this.getUserConsent()
    const newConsent: UserConsent = {
      timestamp: new Date(),
      version: '1.0',
      settings,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    }
    
    localStorage.setItem(this.consentKey, JSON.stringify(newConsent))
    
    // Log consent change
    console.log('User consent updated:', {
      previous: previousConsent,
      current: newConsent
    })
  }

  /**
   * Check if user has given consent for specific purpose
   */
  hasConsentFor(purpose: keyof PrivacySettings): boolean {
    const settings = this.getPrivacySettings()
    return settings[purpose] === true
  }

  /**
   * Request user consent (returns promise that resolves when consent is given)
   */
  requestConsent(): Promise<PrivacySettings> {
    return new Promise((resolve) => {
      // This would typically show a consent modal
      // For now, we'll return current settings
      resolve(this.getPrivacySettings())
    })
  }

  /**
   * Generate data export for user (GDPR Article 20)
   */
  generateDataExport(userId: string): {
    personalData: any
    activityLogs: any[]
    consentHistory: UserConsent[]
    exportDate: Date
  } {
    const consent = this.getUserConsent()
    const settings = this.getPrivacySettings()
    
    return {
      personalData: {
        userId,
        email: 'user@example.com', // This would come from auth context
        consentSettings: settings,
        lastLogin: new Date().toISOString()
      },
      activityLogs: [], // This would be populated from actual logs
      consentHistory: consent ? [consent] : [],
      exportDate: new Date()
    }
  }

  /**
   * Delete user data (GDPR Article 17 - Right to Erasure)
   */
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Clear local storage
      localStorage.removeItem(this.consentKey)
      localStorage.removeItem(this.privacySettingsKey)
      
      // Clear any other user-specific data
      this.clearUserSpecificData(userId)
      
      // Log deletion
      console.log(`User data deleted for user: ${userId}`)
      
      return true
    } catch (error) {
      console.error('Error deleting user data:', error)
      return false
    }
  }

  /**
   * Clear user-specific data from local storage
   */
  private clearUserSpecificData(userId: string): void {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(userId)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * Get data retention policy
   */
  getDataRetentionPolicy(): DataRetentionPolicy {
    return this.dataRetentionPolicy
  }

  /**
   * Check if data should be retained based on policy
   */
  shouldRetainData(dataType: keyof DataRetentionPolicy, createdAt: Date): boolean {
    const policy = this.dataRetentionPolicy[dataType]
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    
    return daysSinceCreation <= policy
  }

  /**
   * Get client IP address (simplified)
   */
  private getClientIP(): string {
    // In a real application, this would get the actual IP
    return 'client-ip-placeholder'
  }

  /**
   * Generate privacy policy text
   */
  getPrivacyPolicyText(): string {
    return `
# Privacy Policy for StreetPaws

## Data Collection
We collect the following types of data:
- Essential data: Required for app functionality (always collected)
- Functional data: Improves user experience (optional)
- Analytics data: Helps us understand app usage (optional)
- Marketing data: For promotional communications (optional)

## Data Usage
Your data is used to:
- Provide and improve our services
- Ensure security and prevent fraud
- Comply with legal obligations
- Send important service updates

## Your Rights
Under GDPR, you have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your data
- Export your data
- Withdraw consent at any time

## Data Retention
We retain data according to our retention policy:
- User data: 7 years
- Activity logs: 3 months
- Security logs: 1 year
- Analytics data: 26 months

## Contact
For privacy-related questions, contact us at privacy@streetpaws.gov.ph
    `.trim()
  }

  /**
   * Check if consent is required
   */
  isConsentRequired(): boolean {
    const consent = this.getUserConsent()
    return !consent || this.isConsentExpired(consent)
  }

  /**
   * Check if consent has expired (e.g., after policy updates)
   */
  private isConsentExpired(consent: UserConsent): boolean {
    // Consent expires after 1 year
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    return consent.timestamp < oneYearAgo
  }

  /**
   * Get consent status for display
   */
  getConsentStatus(): {
    hasConsent: boolean
    isExpired: boolean
    lastUpdated: Date | null
    settings: PrivacySettings
  } {
    const consent = this.getUserConsent()
    const settings = this.getPrivacySettings()
    
    return {
      hasConsent: !!consent,
      isExpired: consent ? this.isConsentExpired(consent) : true,
      lastUpdated: consent?.timestamp || null,
      settings
    }
  }
}

// Export singleton instance
export const privacyService = new PrivacyService()

// Export types
export type { PrivacySettings, UserConsent, DataRetentionPolicy }
