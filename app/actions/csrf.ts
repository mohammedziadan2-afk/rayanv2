"use server"

import { generateCSRFTokenForSession } from "@/lib/csrf-server"

export async function getCSRFToken(): Promise<string> {
  const { token } = await generateCSRFTokenForSession()
  return token
}
