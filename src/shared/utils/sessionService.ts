/**
 * Session Management Service
 * Handles session timeouts, token refresh, and automatic logout
 */

interface SessionConfig {
  sessionTimeout: number // in milliseconds
  warningTime: number // in milliseconds before timeout
  refreshInterval: number // in milliseconds
  maxInactivityTime: number // in milliseconds
}

interface SessionData {
  lastActivity: number
  sessionStart: number
  isActive: boolean
  warningShown: boolean
}

class SessionService {
  private config: SessionConfig = {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes before timeout
    refreshInterval: 60 * 1000, // Check every minute
    maxInactivityTime: 15 * 60 * 1000 // 15 minutes of inactivity
  }

  private sessionData: SessionData = {
    lastActivity: Date.now(),
    sessionStart: Date.now(),
    isActive: true,
    warningShown: false
  }

  private warningCallback?: () => void
  private logoutCallback?: () => void
  private intervalId?: NodeJS.Timeout

  constructor() {
    this.setupActivityListeners()
    this.startSessionMonitoring()
  }

  /**
   * Set callbacks for session events
   */
  setCallbacks(warningCallback: () => void, logoutCallback: () => void): void {
    this.warningCallback = warningCallback
    this.logoutCallback = logoutCallback
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.sessionData.lastActivity = Date.now()
    this.sessionData.warningShown = false
  }

  /**
   * Get session information
   */
  getSessionInfo(): {
    isActive: boolean
    timeRemaining: number
    lastActivity: Date
    sessionDuration: number
  } {
    const now = Date.now()
    const timeRemaining = Math.max(0, this.config.sessionTimeout - (now - this.sessionData.sessionStart))
    const sessionDuration = now - this.sessionData.sessionStart

    return {
      isActive: this.sessionData.isActive,
      timeRemaining,
      lastActivity: new Date(this.sessionData.lastActivity),
      sessionDuration
    }
  }

  /**
   * Extend session (called when user is active)
   */
  extendSession(): void {
    this.sessionData.sessionStart = Date.now()
    this.sessionData.lastActivity = Date.now()
    this.sessionData.warningShown = false
  }

  /**
   * Force logout
   */
  forceLogout(): void {
    this.sessionData.isActive = false
    this.stopSessionMonitoring()
    if (this.logoutCallback) {
      this.logoutCallback()
    }
  }

  /**
   * Reset session (called on login)
   */
  resetSession(): void {
    this.sessionData = {
      lastActivity: Date.now(),
      sessionStart: Date.now(),
      isActive: true,
      warningShown: false
    }
    this.startSessionMonitoring()
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true)
    })

    // Also track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity()
      }
    })
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    this.stopSessionMonitoring()
    
    this.intervalId = setInterval(() => {
      this.checkSessionStatus()
    }, this.config.refreshInterval)
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * Check session status and handle timeouts
   */
  private checkSessionStatus(): void {
    if (!this.sessionData.isActive) return

    const now = Date.now()
    const timeSinceLastActivity = now - this.sessionData.lastActivity
    const sessionDuration = now - this.sessionData.sessionStart

    // Check for inactivity timeout
    if (timeSinceLastActivity > this.config.maxInactivityTime) {
      this.forceLogout()
      return
    }

    // Check for session timeout
    if (sessionDuration > this.config.sessionTimeout) {
      this.forceLogout()
      return
    }

    // Check for warning time
    const timeUntilTimeout = this.config.sessionTimeout - sessionDuration
    if (timeUntilTimeout <= this.config.warningTime && !this.sessionData.warningShown) {
      this.sessionData.warningShown = true
      if (this.warningCallback) {
        this.warningCallback()
      }
    }
  }

  /**
   * Get time until session expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    const now = Date.now()
    const sessionDuration = now - this.sessionData.sessionStart
    const timeRemaining = this.config.sessionTimeout - sessionDuration
    return Math.max(0, Math.ceil(timeRemaining / 1000))
  }

  /**
   * Check if session is about to expire
   */
  isSessionExpiring(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry()
    return timeUntilExpiry <= (this.config.warningTime / 1000)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const sessionService = new SessionService()

// Export types
export type { SessionConfig, SessionData }
