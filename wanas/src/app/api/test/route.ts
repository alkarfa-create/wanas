import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, string> = {}

  const tables = [
    'service_categories', 'districts', 'providers',
    'listings', 'listing_media', 'visitors',
    'sessions', 'events', 'requests', 'reviews',
  ] as const

  for (const table of tables) {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
    checks[table] = error ? `❌ ${error.message}` : `✅ (${count} rows)`
  }

  // Check approved listings specifically
  const { count: approvedCount } = await supabaseAdmin
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const allOk = Object.values(checks).every(v => v.startsWith('✅'))

  return NextResponse.json({
    status: allOk ? '✅ T-1.3 Complete — Seed data ready' : '⚠️ Issue found',
    tables: checks,
    approved_listings: approvedCount ?? 0,
    timestamp: new Date().toISOString(),
  })
}
