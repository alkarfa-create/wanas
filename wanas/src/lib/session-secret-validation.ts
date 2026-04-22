const SESSION_SECRET_PLACEHOLDERS = new Set([
  'wanas-dev-secret-CHANGE-IN-PROD',
  '__REQUIRED__',
  'REPLACE_ME_SECURELY',
  'PLEASE_CHANGE_ME',
  'changeme',
  'change-me',
  'change_me',
  'replace-me',
  'replace_me',
  'your-session-secret',
  'your_secret_here',
])

export function validateSessionSecret(rawValue: string | undefined): string {
  if (typeof rawValue !== 'string') {
    throw new Error('[env] Missing required environment variable: SESSION_SECRET')
  }

  if (rawValue.length === 0) {
    throw new Error('[env] SESSION_SECRET must not be empty')
  }

  const trimmedValue = rawValue.trim()

  if (trimmedValue.length === 0) {
    throw new Error('[env] SESSION_SECRET must not be blank')
  }

  if (trimmedValue !== rawValue) {
    throw new Error('[env] SESSION_SECRET must not contain leading or trailing whitespace')
  }

  if (SESSION_SECRET_PLACEHOLDERS.has(trimmedValue)) {
    throw new Error('[env] SESSION_SECRET uses a forbidden placeholder value')
  }

  if (trimmedValue.length < 32) {
    throw new Error('[env] SESSION_SECRET must be at least 32 characters long')
  }

  return trimmedValue
}
