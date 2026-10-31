type LogLevel = "info" | "warn" | "error" | "debug"

const SENSITIVE_FIELDS = ["password", "token", "apiKey", "api_key", "secret", "authorization", "credit_card", "ssn"]

function redactSensitiveData(data: any): any {
  if (typeof data === "string") {
    // Redact potential passwords or tokens
    if (data.length > 20 && /^[A-Za-z0-9+/=]+$/.test(data)) {
      return "[REDACTED]"
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData)
  }

  if (typeof data === "object" && data !== null) {
    const redacted: any = {}

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        redacted[key] = "[REDACTED]"
      } else {
        redacted[key] = redactSensitiveData(value)
      }
    }

    return redacted
  }

  return data
}

export class SecureLogger {
  private static shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === "production") {
      return level !== "debug"
    }
    return true
  }

  static info(message: string, data?: any): void {
    if (this.shouldLog("info")) {
      const redacted = data ? redactSensitiveData(data) : undefined
      console.log(`[INFO] ${message}`, redacted || "")
    }
  }

  static warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      const redacted = data ? redactSensitiveData(data) : undefined
      console.warn(`[WARN] ${message}`, redacted || "")
    }
  }

  static error(message: string, error?: any): void {
    if (this.shouldLog("error")) {
      const redacted = error ? redactSensitiveData(error) : undefined
      console.error(`[ERROR] ${message}`, redacted || "")
    }
  }

  static debug(message: string, data?: any): void {
    if (this.shouldLog("debug")) {
      const redacted = data ? redactSensitiveData(data) : undefined
      console.log(`[DEBUG] ${message}`, redacted || "")
    }
  }
}
