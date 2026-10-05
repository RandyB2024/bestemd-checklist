const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string): string {
  let normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  while (normalized.length % 4) {
    normalized += '='
  }

  return atob(normalized)
}

async function sign(
  value: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  )

  return toBase64Url(
    new Uint8Array(signature)
  )
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

export interface SessionData {
  actor: 'Randy' | 'Ed'
  expires: number
}

export async function createSession(
  actor: 'Randy' | 'Ed',
  secret: string
): Promise<string> {
  const payload: SessionData = {
    actor,
    expires: Date.now() + 12 * 60 * 60 * 1000,
  }

  const encoded = toBase64Url(
    encoder.encode(JSON.stringify(payload))
  )

  const signature = await sign(
    encoded,
    secret
  )

  return `${encoded}.${signature}`
}

export async function verifySession(
  token: string | undefined,
  secret: string
): Promise<SessionData | null> {
  if (!token) return null

  const [payload, signature] = token.split('.')

  if (!payload || !signature) {
    return null
  }

  const expected = await sign(
    payload,
    secret
  )

  if (!safeEqual(signature, expected)) {
    return null
  }

  try {
    const json = decodeBase64Url(payload)
    const data = JSON.parse(json) as SessionData

    if (
      data.actor !== 'Randy' &&
      data.actor !== 'Ed'
    ) {
      return null
    }

    if (
      !data.expires ||
      data.expires < Date.now()
    ) {
      return null
    }

    return data
  } catch {
    return null
  }
}

export function getCookie(
  request: Request,
  name: string
): string | undefined {
  const header = request.headers.get('Cookie')

  if (!header) return undefined

  for (const cookie of header.split(';')) {
    const [key, ...parts] =
      cookie.trim().split('=')

    if (key === name) {
      return decodeURIComponent(parts.join('='))
    }
  }

  return undefined
}
