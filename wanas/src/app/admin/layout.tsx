// src/app/admin/layout.tsx
// Minimal shell — authentication is handled by (dashboard)/layout.tsx.
// This outer layout intentionally has NO auth check so that /admin/login
// is reachable without a valid cookie.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
