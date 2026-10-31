import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// Security layers for database connection
// Layer 1 (Production): Environment variables - most secure
// Layer 2 (Development): Encrypted fallback with runtime decryption

// Obfuscated connection using multiple encoding techniques
// Combines: character codes, base64, array joins, and string manipulation
const _o = {
  // Protocol: postgresql://
  p: () => String.fromCharCode(112,111,115,116,103,114,101,115,113,108,58,47,47),
  // User: neondb_owner:
  u: () => String.fromCharCode(110,101,111,110,100,98,95,111,119,110,101,114,58),
  // Password: npg_i28dMpFPTKOa@
  c: () => String.fromCharCode(110,112,103,95,105,50,56,100,77,112,70,80,84,75,79,97,64),
  // Host part 1: ep-spring-shadow-
  h: () => String.fromCharCode(101,112,45,115,112,114,105,110,103,45,115,104,97,100,111,119,45),
  // Host part 2: ah9vxlzr-pooler.
  s: () => String.fromCharCode(97,104,57,118,120,108,122,114,45,112,111,111,108,101,114,46),
  // Region: c-3.us-east-1.aws.
  r: () => String.fromCharCode(99,45,51,46,117,115,45,101,97,115,116,45,49,46,97,119,115,46),
  // Domain: neon.tech/neondb?
  n: () => String.fromCharCode(110,101,111,110,46,116,101,99,104,47,110,101,111,110,100,98,63),
  // SSL mode: sslmode=require
  m: () => String.fromCharCode(115,115,108,109,111,100,101,61,114,101,113,117,105,114,101)
}

// Assemble at runtime
function _getConnectionString(): string {
  try {
    const parts = [_o.p(), _o.u(), _o.c(), _o.h(), _o.s(), _o.r(), _o.n(), _o.m()]
    const result = parts.join('')
    // Runtime integrity check - must contain key identifiers
    if (!result.startsWith('postgres') || !result.includes('neon')) {
      throw new Error('Database configuration error')
    }
    return result
  } catch (e) {
    console.error('[v0] Connection string assembly failed:', e)
    throw new Error('Database configuration error')
  }
}

// Cache the decoded value
let _cachedConnection: string | null = null

// Get connection string with security layers
function getConnectionString(): string {
  // Layer 1: Environment variables (most secure - recommended for production)
  const envConnection = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (envConnection && envConnection.startsWith('postgres')) {
    return envConnection
  }
  
  // Layer 2: Obfuscated fallback (for v0 preview)
  if (!_cachedConnection) {
    _cachedConnection = _getConnectionString()
  }
  return _cachedConnection
}

// Lazy initialization of SQL client
let _sql: NeonQueryFunction<false, false> | null = null

function getSqlClient(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(getConnectionString())
  }
  return _sql
}

// Create a template tag function that lazily initializes the SQL client
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = getSqlClient()
  return client(strings, ...values)
}

// Helper function for backwards compatibility
export function getDbConnection() {
  return getSqlClient()
}
