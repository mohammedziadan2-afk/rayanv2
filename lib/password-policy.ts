export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true, // Enabled for stronger security
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`كلمة المرور يجب أن تكون على الأقل ${PASSWORD_REQUIREMENTS.minLength} أحرف`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل")
  }

  // Check for common weak passwords (expanded list)
  const commonPasswords = [
    "password123", "admin123456", "12345678910", "qwerty123456", "password1234",
    "123456789", "qwertyuiop", "letmein123", "welcome123", "monkey1234",
    "dragon1234", "master1234", "login12345", "princess12", "admin12345"
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("كلمة المرور ضعيفة جداً. الرجاء اختيار كلمة مرور أقوى")
  }
  
  // Check for sequential or repeated characters
  if (/(.)\1{3,}/.test(password)) {
    errors.push("كلمة المرور لا يجب أن تحتوي على نفس الحرف أكثر من 3 مرات متتالية")
  }
  
  // Check for keyboard patterns
  const keyboardPatterns = ["qwerty", "asdfgh", "zxcvbn", "123456", "abcdef"]
  if (keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push("كلمة المرور لا يجب أن تحتوي على أنماط لوحة المفاتيح")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Check password against HaveIBeenPwned API (k-anonymity model - secure)
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count?: number }> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    
    // Send only first 5 characters (k-anonymity)
    const prefix = hashHex.slice(0, 5)
    const suffix = hashHex.slice(5)
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    })
    
    if (!response.ok) {
      // If API fails, don't block the user
      return { breached: false }
    }
    
    const text = await response.text()
    const lines = text.split('\n')
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':')
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count.trim(), 10) }
      }
    }
    
    return { breached: false }
  } catch {
    // If check fails, don't block user but log it
    console.warn('[Security] Password breach check failed')
    return { breached: false }
  }
}
