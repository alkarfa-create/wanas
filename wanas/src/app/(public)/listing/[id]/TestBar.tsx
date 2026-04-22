'use client'

import { useState, useEffect } from 'react'

export default function TestBar() {
    const [show, setShow] = useState(true)

    useEffect(() => {
        setShow(true)
    }, [])

    if (!show) return null

    return (
        <div className="flex justify-between items-center w-full">
            <span className="font-black text-gray-900">1,500 ر.س</span>
            <button className="px-8 py-3 rounded-xl font-black text-white bg-[#f63659]">
                تواصل للحجز الآن
            </button>
        </div>
    )
}
