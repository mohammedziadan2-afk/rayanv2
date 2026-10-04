export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: "weak" | "medium" | "strong"
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: "weak" | "medium" | "strong" = "weak"

  // الحد الأدنى 10 أحرف
  if (password.length < 10) {
    errors.push("يجب أن تكون كلمة المرور على الأقل 10 أحرف")
  }

  // يجب أن تحتوي على حرف كبير واحد على الأقل
  if (!/[A-Z]/.test(password)) {
    errors.push("يجب أن تحتوي على حرف كبير واحد على الأقل")
  }

  // يجب أن تحتوي على حرف صغير واحد على الأقل
  if (!/[a-z]/.test(password)) {
    errors.push("يجب أن تحتوي على حرف صغير واحد على الأقل")
  }

  // يجب أن تحتوي على رقم واحد على الأقل
  if (!/[0-9]/.test(password)) {
    errors.push("يجب أن تحتوي على رقم واحد على الأقل")
  }

  // يجب أن تحتوي على رمز خاص واحد على الأقل
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&* إلخ)")
  }

  // تقييم القوة
  const hasLength = password.length >= 10
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  const criteriasMet = [hasLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length

  if (criteriasMet >= 5 && password.length >= 14) {
    strength = "strong"
  } else if (criteriasMet >= 4) {
    strength = "medium"
  } else {
    strength = "weak"
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}
