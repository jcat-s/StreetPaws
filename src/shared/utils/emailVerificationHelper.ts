/**
 * Email Verification Helper
 * Provides utilities for email verification testing and validation
 */

interface EmailValidationResult {
  isValid: boolean
  isDisposable: boolean
  domain: string
  suggestions?: string[]
}

class EmailVerificationHelper {
  // List of common disposable email domains
  private disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'temp-mail.org',
    'throwaway.email',
    'getnada.com',
    'maildrop.cc',
    'sharklasers.com',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chacuo.net',
    'dispostable.com',
    'mailnesia.com',
    'mailcatch.com',
    'inboxalias.com',
    'mailmetrash.com',
    'trashmail.net',
    'trashmail.com',
    'mytrashmail.com',
    'spamgourmet.com',
    'spam.la',
    'binkmail.com',
    'bobmail.info',
    'chammy.info',
    'devnullmail.com',
    'letthemeatspam.com',
    'mailin8r.com',
    'mailinator2.com',
    'notmailinator.com',
    'reallymymail.com',
    'reconmail.com',
    'safetymail.info',
    'sogetthis.com',
    'spamhereplease.com',
    'superrito.com',
    'thisisnotmyrealemail.com',
    'tradermail.info',
    'veryrealemail.com',
    'wegwerfmail.de',
    'wegwerfmail.net',
    'wegwerfmail.org'
  ]

  /**
   * Validate email format and check for disposable domains
   */
  validateEmail(email: string): EmailValidationResult {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    const isValidFormat = emailRegex.test(email)
    
    if (!isValidFormat) {
      return {
        isValid: false,
        isDisposable: false,
        domain: '',
        suggestions: ['Please enter a valid email address']
      }
    }

    const domain = email.split('@')[1].toLowerCase()
    const isDisposable = this.disposableDomains.includes(domain)

    return {
      isValid: true,
      isDisposable,
      domain,
      suggestions: isDisposable ? ['Please use a permanent email address'] : undefined
    }
  }

  /**
   * Check if email domain is disposable
   */
  isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    return domain ? this.disposableDomains.includes(domain) : false
  }

  /**
   * Get email domain
   */
  getEmailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || ''
  }

  /**
   * Suggest alternative email providers
   */
  getEmailSuggestions(): string[] {
    return [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'protonmail.com'
    ]
  }

  /**
   * Generate a test email for development
   */
  generateTestEmail(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `test-${timestamp}-${random}@example.com`
  }

  /**
   * Check if email is from a major provider
   */
  isMajorEmailProvider(email: string): boolean {
    const majorProviders = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'protonmail.com',
      'aol.com',
      'live.com',
      'msn.com'
    ]
    
    const domain = this.getEmailDomain(email)
    return majorProviders.includes(domain)
  }

  /**
   * Get email provider name
   */
  getEmailProvider(email: string): string {
    const domain = this.getEmailDomain(email)
    const providerMap: Record<string, string> = {
      'gmail.com': 'Google',
      'yahoo.com': 'Yahoo',
      'outlook.com': 'Microsoft',
      'hotmail.com': 'Microsoft',
      'icloud.com': 'Apple',
      'protonmail.com': 'ProtonMail',
      'aol.com': 'AOL',
      'live.com': 'Microsoft',
      'msn.com': 'Microsoft'
    }
    
    return providerMap[domain] || domain
  }

  /**
   * Validate email for signup (stricter validation)
   */
  validateEmailForSignup(email: string): {
    isValid: boolean
    message: string
    warnings: string[]
  } {
    const validation = this.validateEmail(email)
    const warnings: string[] = []

    if (!validation.isValid) {
      return {
        isValid: false,
        message: 'Please enter a valid email address',
        warnings: []
      }
    }

    if (validation.isDisposable) {
      return {
        isValid: false,
        message: 'Disposable email addresses are not allowed. Please use a permanent email address.',
        warnings: []
      }
    }

    if (!this.isMajorEmailProvider(email)) {
      warnings.push('We recommend using a well-known email provider for better deliverability')
    }

    return {
      isValid: true,
      message: 'Email address is valid',
      warnings
    }
  }

  /**
   * Get email verification tips
   */
  getEmailVerificationTips(): string[] {
    return [
      'Check your spam/junk folder if you don\'t see the email',
      'Make sure you entered the correct email address',
      'Wait a few minutes for the email to arrive',
      'Add our email address to your contacts to prevent spam filtering',
      'If using Gmail, check your Promotions tab',
      'Try refreshing your email client'
    ]
  }
}

// Export singleton instance
export const emailVerificationHelper = new EmailVerificationHelper()

// Export types
export type { EmailValidationResult }
