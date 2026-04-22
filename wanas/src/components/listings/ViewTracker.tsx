'use client'
// src/components/listings/ViewTracker.tsx
import { useEffect } from 'react'

export default function ViewTracker({ listingId }: { listingId: string }) {
    useEffect(() => {
        const key = `viewed_${listingId}`
        if (sessionStorage.getItem(key)) return
        sessionStorage.setItem(key, '1')
        fetch(`/api/listings/${listingId}/view`, { method: 'POST' })
    }, [])
    return null
}
