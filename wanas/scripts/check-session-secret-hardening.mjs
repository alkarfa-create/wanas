import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

const excludedPatterns = [
  /^\.env\.local$/,
  /^\.next[\\/]/,
  /^node_modules[\\/]/,
  /^dist[\\/]/,
  /^build[\\/]/,
]

const fallbackPatternDefinitions = [
  {
    name: 'direct logical OR fallback for process.env.SESSION_SECRET',
    pattern: /process\.env\.SESSION_SECRET\s*\|\|\s*(?!process\.env\.SESSION_SECRET\b)[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'direct nullish fallback for process.env.SESSION_SECRET',
    pattern: /process\.env\.SESSION_SECRET\s*\?\?\s*(?!process\.env\.SESSION_SECRET\b)[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'ternary fallback after explicit undefined check',
    pattern: /process\.env\.SESSION_SECRET\s*!==\s*undefined\s*\?\s*process\.env\.SESSION_SECRET\s*:\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'ternary fallback after truthy check',
    pattern: /process\.env\.SESSION_SECRET\s*\?\s*process\.env\.SESSION_SECRET\s*:\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'logical OR fallback after getSessionSecret',
    pattern: /getSessionSecret\(\)\s*\|\|\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'nullish fallback after getSessionSecret',
    pattern: /getSessionSecret\(\)\s*\?\?\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'ternary fallback after getSessionSecret',
    pattern: /getSessionSecret\(\)\s*\?\s*getSessionSecret\(\)\s*:\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'logical OR fallback after requireSessionSecret',
    pattern: /requireSessionSecret\(\)\s*\|\|\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'nullish fallback after requireSessionSecret',
    pattern: /requireSessionSecret\(\)\s*\?\?\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
  {
    name: 'ternary fallback after requireSessionSecret',
    pattern: /requireSessionSecret\(\)\s*\?\s*requireSessionSecret\(\)\s*:\s*[\s\S]{1,160}?(?=[,;\n])/g,
  },
]

const forbiddenTrackedEnvPlaceholders = new Set([
  'wanas-dev-secret-CHANGE-IN-PROD',
  'changeme',
  'change-me',
  'change_me',
  'replace-me',
  'replace_me',
  'your-session-secret',
  'your_secret_here',
])

const allowedTrackedEnvSentinels = new Set([
  '__REQUIRED__',
  'REPLACE_ME_SECURELY',
  'PLEASE_CHANGE_ME',
])

function isExcluded(filePath) {
  return excludedPatterns.some((pattern) => pattern.test(filePath))
}

function isTracked(filePath) {
  return existsSync(path.join(projectRoot, filePath))
}

function isIncluded(filePath) {
  if (isExcluded(filePath)) return false

  if (/^src[\\/].+\.tsx?$/.test(filePath)) return true
  if (/^[^\\/]+\.js$/.test(filePath)) return true
  if (/^[^\\/]+\.mjs$/.test(filePath)) return true
  if (filePath === 'next.config.ts') return true
  if (filePath === '.env.example') return true

  return false
}

function walk(relativeDir = '.') {
  const absoluteDir = path.join(projectRoot, relativeDir)
  const entries = readdirSync(absoluteDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    const normalizedPath = relativePath === '.' ? entry.name : relativePath

    if (isExcluded(normalizedPath)) continue

    if (entry.isDirectory()) {
      files.push(...walk(normalizedPath))
      continue
    }

    if (entry.isFile()) {
      files.push(normalizedPath)
    }
  }

  return files
}

function getCandidateFiles() {
  return walk()
    .filter(isTracked)
    .filter(isIncluded)
}

function fail(message, details) {
  console.error(message)

  for (const detail of details) {
    console.error(`- ${detail}`)
  }

  process.exit(1)
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length
}

const trackedFiles = getCandidateFiles()
const violations = []

for (const filePath of trackedFiles) {
  const absolutePath = path.join(projectRoot, filePath)
  const content = readFileSync(absolutePath, 'utf8')
  const lines = content.split(/\r?\n/)

  for (const { name, pattern } of fallbackPatternDefinitions) {
    const matches = content.matchAll(pattern)

    for (const match of matches) {
      const lineNumber = getLineNumber(content, match.index ?? 0)
      violations.push(`${filePath}:${lineNumber} ${name}`)
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineNumber = index + 1

    if (filePath === '.env.example' && line.startsWith('SESSION_SECRET=')) {
      const value = line.slice('SESSION_SECRET='.length).trim()

      if (forbiddenTrackedEnvPlaceholders.has(value) && !allowedTrackedEnvSentinels.has(value)) {
        violations.push(`${filePath}:${lineNumber} forbidden tracked placeholder value detected`)
      }
    }
  }
}

if (violations.length > 0) {
  fail('[guard:session-secret] SESSION_SECRET hardening guard failed', violations)
}

console.log('[guard:session-secret] PASS')
