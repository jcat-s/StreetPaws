/**
 * Security Service for Authentication and Account Management
 * Provides rate limiting, account lockout, and security monitoring
 */

interface LoginAttempt {
  email: string
  timestamp: number
  success: boolean
  ipAddress?: string
}

interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number // in milliseconds
  rateLimitWindow: number // in milliseconds
  maxRequestsPerWindow: number
}

class SecurityService {
  private loginAttempts: Map<string, LoginAttempt[]> = new Map()
  private lockedAccounts: Map<string, number> = new Map()
  private rateLimitTracker: Map<string, number[]> = new Map()
  
  private config: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    rateLimitWindow: 60 * 1000, // 1 minute
    maxRequestsPerWindow: 10
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(email: string, success: boolean, ipAddress?: string): void {
    const attempts = this.loginAttempts.get(email) || []
    attempts.push({
      email,
      timestamp: Date.now(),
      success,
      ipAddress
    })
    
    // Keep only recent attempts (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo)
    
    this.loginAttempts.set(email, recentAttempts)
    
    // Check if account should be locked
    if (!success) {
      this.checkAccountLockout(email)
    } else {
      // Clear lockout on successful login
      this.lockedAccounts.delete(email)
    }
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(email: string): boolean {
    const lockoutTime = this.lockedAccounts.get(email)
    if (!lockoutTime) return false
    
    // Check if lockout period has expired
    if (Date.now() - lockoutTime > this.config.lockoutDuration) {
      this.lockedAccounts.delete(email)
      return false
    }
    
    return true
  }

  /**
   * Get remaining lockout time in seconds
   */
  getRemainingLockoutTime(email: string): number {
    const lockoutTime = this.lockedAccounts.get(email)
    if (!lockoutTime) return 0
    
    const remaining = this.config.lockoutDuration - (Date.now() - lockoutTime)
    return Math.max(0, Math.ceil(remaining / 1000))
  }

  /**
   * Check if account should be locked based on failed attempts
   */
  private checkAccountLockout(email: string): void {
    const attempts = this.loginAttempts.get(email) || []
    const recentFailedAttempts = attempts.filter(
      attempt => !attempt.success && 
      attempt.timestamp > Date.now() - this.config.lockoutDuration
    )
    
    if (recentFailedAttempts.length >= this.config.maxLoginAttempts) {
      this.lockedAccounts.set(email, Date.now())
      console.warn(`Account locked for ${email} due to ${recentFailedAttempts.length} failed attempts`)
    }
  }

  /**
   * Check rate limiting for IP address
   */
  checkRateLimit(ipAddress: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now()
    const requests = this.rateLimitTracker.get(ipAddress) || []
    
    // Remove old requests outside the window
    const windowStart = now - this.config.rateLimitWindow
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (recentRequests.length >= this.config.maxRequestsPerWindow) {
      const oldestRequest = Math.min(...recentRequests)
      const remainingTime = Math.ceil((oldestRequest + this.config.rateLimitWindow - now) / 1000)
      return { allowed: false, remainingTime }
    }
    
    // Add current request
    recentRequests.push(now)
    this.rateLimitTracker.set(ipAddress, recentRequests)
    
    return { allowed: true }
  }

  /**
   * Get login attempt statistics for an email
   */
  getLoginStats(email: string): {
    totalAttempts: number
    failedAttempts: number
    lastAttempt?: Date
    isLocked: boolean
    remainingLockoutTime: number
  } {
    const attempts = this.loginAttempts.get(email) || []
    const failedAttempts = attempts.filter(attempt => !attempt.success)
    const lastAttempt = attempts.length > 0 ? new Date(attempts[attempts.length - 1].timestamp) : undefined
    
    return {
      totalAttempts: attempts.length,
      failedAttempts: failedAttempts.length,
      lastAttempt,
      isLocked: this.isAccountLocked(email),
      remainingLockoutTime: this.getRemainingLockoutTime(email)
    }
  }

  /**
   * Clear all security data (for testing or admin purposes)
   */
  clearSecurityData(): void {
    this.loginAttempts.clear()
    this.lockedAccounts.clear()
    this.rateLimitTracker.clear()
  }

  /**
   * Get client IP address (simplified version)
   */
  getClientIP(): string {
    // In a real application, this would get the actual IP from headers
    // For now, we'll use a placeholder
    return 'client-ip-placeholder'
  }

  /**
   * Generate security audit log entry
   */
  generateAuditLog(action: string, email: string, success: boolean, details?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      email,
      success,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details
    }
    
    console.log('Security Audit:', logEntry)
    
    // In a real application, this would be sent to a logging service
    // or stored in a secure database
  }
}

// Export singleton instance
export const securityService = new SecurityService()

// Export types for use in other components
export type { LoginAttempt, SecurityConfig }
