import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { supabaseAdmin } from '@/lib/supabase'
import { PROVIDER_COOKIE, verifyProviderToken } from '@/lib/session'
import { isProviderSessionAllowed } from '@/lib/provider-status'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(PROVIDER_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const providerId = verifyProviderToken(token)

  if (!providerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: provider, error } = await supabaseAdmin
    .from('providers')
    .select('provider_id, display_name, phone_whatsapp, email, username, avatar_url, status')
    .eq('provider_id', providerId)
    .single()

  if (error || !provider || !isProviderSessionAllowed(provider.status)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    provider: {
      provider_id: provider.provider_id,
      display_name: provider.display_name,
      phone_whatsapp: provider.phone_whatsapp,
      email: provider.email,
      username: provider.username,
      avatar_url: provider.avatar_url,
    },
  })
}
