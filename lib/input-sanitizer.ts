export function sanitizeString(input: any): string {
  // Handle null, undefined, or non-string inputs
  if (input === null || input === undefined) return ""

  // Convert to string if not already
  if (typeof input !== "string") {
    input = String(input)
  }

  // Handle empty string
  if (!input) return ""

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "")

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

  // Remove SQL injection patterns
  sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, "")

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"`;()]/g, "")

  return sanitized.trim()
}

export function sanitizeNumber(input: any): number {
  const num = Number(input)
  return isNaN(num) ? 0 : num
}

export function sanitizeEmail(email: string): string {
  if (!email) return ""

  const sanitized = email.toLowerCase().trim()

  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(sanitized)) {
    return ""
  }

  return sanitized
}

export function sanitizePhone(phone: string): string {
  if (!phone) return ""

  // Remove all non-digit characters
  return phone.replace(/\D/g, "")
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = sanitizeString(value) as any
    } else if (typeof value === "number") {
      sanitized[key as keyof T] = value as any
    } else if (typeof value === "object" && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as any
    } else {
      sanitized[key as keyof T] = value as any
    }
  }

  return sanitized
}
