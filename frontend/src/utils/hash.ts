// Client-side SHA-256 hashing for evidence integrity

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(hashFile))
}
