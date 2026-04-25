export function isProviderSessionAllowed(status: string | null | undefined): boolean {
  return status === 'active'
}
