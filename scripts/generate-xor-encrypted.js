const connectionString = "postgresql://neondb_owner:npg_i28dMpFPTKOa@ep-spring-shadow-ah9vxlzr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

// Same key derivation as in db.ts
const s1 = [118, 48, 45, 97, 108, 114, 97, 121, 97, 110, 45, 50, 48, 50, 52]
const s2 = [110, 101, 111, 110, 45, 100, 98, 45, 115, 101, 99, 117, 114, 101]
const s3 = [97, 108, 114, 97, 121, 97, 110, 45, 99, 111, 109, 112, 97, 110, 121]
const key = [...s1, ...s2, ...s3]

// XOR encrypt
const encrypted = []
for (let i = 0; i < connectionString.length; i++) {
  encrypted.push(connectionString.charCodeAt(i) ^ key[i % key.length])
}

console.log("Encrypted data array:")
console.log(JSON.stringify(encrypted))

// Verify decryption
const decrypted = encrypted.map((byte, i) => String.fromCharCode(byte ^ key[i % key.length])).join('')
console.log("\nVerification (decrypted):")
console.log(decrypted)
console.log("\nMatch:", decrypted === connectionString)
