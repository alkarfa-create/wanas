import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            listing_id, provider_id, category_id, district_id,
            customer_name, phone_number, event_date, event_type, guests_count,
        } = body

        if (!listing_id || !customer_name || !phone_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Create visitor
        const { data: visitor } = await supabaseAdmin
            .from('visitors')
            .insert({ utm_first_source: 'direct' })
            .select('visitor_id')
            .single()

        // Create session
        const { data: session } = await supabaseAdmin
            .from('sessions')
            .insert({ visitor_id: visitor?.visitor_id })
            .select('session_id')
            .single()

        // Create request → auto WN-XXXXX (Trigger handles this in DB)
        const { data: req, error } = await supabaseAdmin
            .from('requests')
            .insert({
                listing_id,
                provider_id,
                category_id,
                district_id,
                visitor_id: visitor?.visitor_id,
                session_id: session?.session_id,
                visitor_name: customer_name,
                visitor_phone: phone_number,
                event_date: event_date || null,
                event_type: event_type || null,
                guest_count: guests_count || null,
                channel: 'direct',
                whatsapp_click_at: new Date().toISOString(),
            })
            .select('request_ref')
            .single()

        if (error) {
            console.error('Request error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, request_ref: req.request_ref })

    } catch (err) {
        console.error('API error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
