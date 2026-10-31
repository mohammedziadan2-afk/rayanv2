// Secure error handler - doesn't expose sensitive information
export interface SafeError {
  message: string
  code?: string
  statusCode: number
}

export class AppError extends Error {
  statusCode: number
  code?: string
  isOperational: boolean

  constructor(message: string, statusCode = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export function handleError(error: unknown): SafeError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    // Log detailed error for debugging but return generic message to user
    console.error("[Security] Internal error:", error.message, error.stack)

    // Check for specific error types
    if (error.message.includes("CSRF")) {
      return {
        message: "خطأ أمني. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى",
        code: "CSRF_ERROR",
        statusCode: 403,
      }
    }

    if (error.message.includes("rate limit") || error.message.includes("too many")) {
      return {
        message: "تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً",
        code: "RATE_LIMIT_ERROR",
        statusCode: 429,
      }
    }

    if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
      return {
        message: "يرجى تسجيل الدخول للمتابعة",
        code: "AUTH_ERROR",
        statusCode: 401,
      }
    }

    // Generic error message for unknown errors
    return {
      message: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    }
  }

  // Fallback for non-Error objects
  return {
    message: "حدث خطأ غير متوقع",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  }
}

export function logSecurityEvent(event: {
  type: string
  message: string
  userId?: string
  ip?: string
  details?: any
}) {
  console.log("[Security Event]", {
    timestamp: new Date().toISOString(),
    ...event,
  })
}
