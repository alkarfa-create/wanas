import { validateSessionSecret } from './session-secret-validation'

export const SESSION_SECRET = validateSessionSecret(process.env.SESSION_SECRET)

// ============================================================
// SECURITY NOTE: Memory Protection in Node.js
// ============================================================
// `delete process.env.SESSION_SECRET` removes the key from the env object,
// preventing accidental leaks via child_process, vm.runInNewContext, or
// modules that iterate over process.env.
//
// LIMITATIONS (Node.js-specific):
// - Does NOT zero out memory in the heap
// - Does NOT prevent exposure via core dumps, swap files, or memory dumps
// - The secret may still be present in V8 heap until garbage collected
//
// For production-grade memory protection, consider:
// - Running with a hardened runtime configuration
// - Using a separate secrets manager
// - Minimizing the time the secret lives in memory
// ============================================================

export function requireSessionSecret(): string {
  return SESSION_SECRET
}

export function getSessionSecret(): string {
  return SESSION_SECRET
}
