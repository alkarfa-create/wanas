'use client'
// src/app/admin/login/page.tsx

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AdminLoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const from         = searchParams.get('from') ?? '/admin'

  const [password, setPassword] = useState('')
  const [error,    setError   ] = useState('')
  const [loading,  setLoading ] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'كلمة مرور غير صحيحة')
        setLoading(false)
        return
      }

      router.push(from)
      router.refresh()
    } catch {
      setError('خطأ في الاتصال بالسيرفر')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4">
            م
          </div>
          <h1 className="text-2xl font-black text-gray-900">لوحة الإدارة</h1>
          <p className="text-sm text-gray-400 font-bold mt-1">ونَس</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              كلمة مرور الإدارة
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-rose-400 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl transition-colors text-sm"
          >
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
