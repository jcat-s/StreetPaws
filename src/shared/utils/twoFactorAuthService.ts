/**
 * Two-Factor Authentication (2FA) Service
 * Provides TOTP-based 2FA functionality for enhanced security
 */

interface TwoFactorSecret {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

interface TwoFactorVerification {
  code: string
  backupCode?: boolean
}

class TwoFactorAuthService {
  private readonly issuer = 'StreetPaws'
  private readonly algorithm = 'SHA1'
  private readonly digits = 6
  private readonly period = 30

  /**
   * Generate a new 2FA secret for a user
   */
  generateSecret(userEmail: string): TwoFactorSecret {
    // In a real implementation, you would use a proper TOTP library
    // For demo purposes, we'll generate a mock secret
    const secret = this.generateRandomSecret()
    const qrCodeUrl = this.generateQRCodeUrl(userEmail, secret)
    const backupCodes = this.generateBackupCodes()

    return {
      secret,
      qrCodeUrl,
      backupCodes
    }
  }

  /**
   * Verify a TOTP code
   */
  verifyCode(secret: string, code: string, window: number = 1): boolean {
    // In a real implementation, you would use a proper TOTP verification
    // For demo purposes, we'll simulate verification
    const currentTime = Math.floor(Date.now() / 1000)
    const timeStep = Math.floor(currentTime / this.period)
    
    // Simulate TOTP verification (in real app, use proper TOTP library)
    const expectedCode = this.generateTOTPCode(secret, timeStep)
    
    // Check current window and adjacent windows for clock skew
    for (let i = -window; i <= window; i++) {
      const testCode = this.generateTOTPCode(secret, timeStep + i)
      if (testCode === code) {
        return true
      }
    }
    
    return false
  }

  /**
   * Verify a backup code
   */
  verifyBackupCode(backupCodes: string[], code: string): { valid: boolean; remainingCodes: string[] } {
    const index = backupCodes.indexOf(code)
    if (index === -1) {
      return { valid: false, remainingCodes: backupCodes }
    }
    
    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, i) => i !== index)
    return { valid: true, remainingCodes }
  }

  /**
   * Generate QR code URL for authenticator app setup
   */
  private generateQRCodeUrl(userEmail: string, secret: string): string {
    const encodedSecret = encodeURIComponent(secret)
    const encodedIssuer = encodeURIComponent(this.issuer)
    const encodedAccount = encodeURIComponent(userEmail)
    
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=${this.algorithm}&digits=${this.digits}&period=${this.period}`
  }

  /**
   * Generate a random secret key
   */
  private generateRandomSecret(): string {
    // In a real implementation, use crypto.getRandomValues() or similar
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString()
      codes.push(code)
    }
    return codes
  }

  /**
   * Generate TOTP code (simplified implementation)
   */
  private generateTOTPCode(secret: string, timeStep: number): string {
    // This is a simplified implementation
    // In a real app, use a proper TOTP library like 'otplib'
    const hash = this.simpleHash(secret + timeStep.toString())
    const code = (parseInt(hash, 16) % 1000000).toString().padStart(6, '0')
    return code
  }

  /**
   * Simple hash function for demo purposes
   */
  private simpleHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Validate TOTP code format
   */
  validateCodeFormat(code: string): boolean {
    return /^\d{6}$/.test(code)
  }

  /**
   * Validate backup code format
   */
  validateBackupCodeFormat(code: string): boolean {
    return /^\d{8}$/.test(code)
  }

  /**
   * Get time remaining until next code
   */
  getTimeRemaining(): number {
    const currentTime = Math.floor(Date.now() / 1000)
    return this.period - (currentTime % this.period)
  }

  /**
   * Check if 2FA is enabled for user
   */
  isTwoFactorEnabled(userId: string): boolean {
    const stored = localStorage.getItem(`2fa_enabled_${userId}`)
    return stored === 'true'
  }

  /**
   * Enable 2FA for user
   */
  enableTwoFactor(userId: string, secret: string, backupCodes: string[]): void {
    localStorage.setItem(`2fa_enabled_${userId}`, 'true')
    localStorage.setItem(`2fa_secret_${userId}`, secret)
    localStorage.setItem(`2fa_backup_codes_${userId}`, JSON.stringify(backupCodes))
  }

  /**
   * Disable 2FA for user
   */
  disableTwoFactor(userId: string): void {
    localStorage.removeItem(`2fa_enabled_${userId}`)
    localStorage.removeItem(`2fa_secret_${userId}`)
    localStorage.removeItem(`2fa_backup_codes_${userId}`)
  }

  /**
   * Get user's 2FA secret
   */
  getUserSecret(userId: string): string | null {
    return localStorage.getItem(`2fa_secret_${userId}`)
  }

  /**
   * Get user's backup codes
   */
  getUserBackupCodes(userId: string): string[] {
    const stored = localStorage.getItem(`2fa_backup_codes_${userId}`)
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Update user's backup codes
   */
  updateUserBackupCodes(userId: string, backupCodes: string[]): void {
    localStorage.setItem(`2fa_backup_codes_${userId}`, JSON.stringify(backupCodes))
  }

  /**
   * Generate new backup codes
   */
  generateNewBackupCodes(userId: string): string[] {
    const newCodes = this.generateBackupCodes()
    this.updateUserBackupCodes(userId, newCodes)
    return newCodes
  }

  /**
   * Check if code is a backup code
   */
  isBackupCode(code: string): boolean {
    return this.validateBackupCodeFormat(code)
  }

  /**
   * Get 2FA setup instructions
   */
  getSetupInstructions(): string[] {
    return [
      'Download an authenticator app like Google Authenticator or Authy',
      'Scan the QR code with your authenticator app',
      'Enter the 6-digit code from your app to verify setup',
      'Save your backup codes in a secure location',
      'You can use backup codes if you lose access to your authenticator app'
    ]
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    return [
      'Use a dedicated authenticator app, not SMS',
      'Keep your backup codes in a secure location',
      'Don\'t share your backup codes with anyone',
      'Regenerate backup codes if you suspect they\'ve been compromised',
      'Use 2FA on all your important accounts'
    ]
  }
}

// Export singleton instance
export const twoFactorAuthService = new TwoFactorAuthService()

// Export types
export type { TwoFactorSecret, TwoFactorVerification }
