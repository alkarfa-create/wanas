'use client'
// src/app/(public)/login/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const BRAND = '#f63659'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') ?? '/profile'  // سيتم استبداله بـ /profile/{id} بعد تسجيل الدخول

    const [tab, setTab] = useState<'login' | 'register'>('login')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
    const [registerForm, setRegisterForm] = useState({
        display_name: '', phone: '966', email: '', username: '', password: '', confirm: '',
    })

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (!loginForm.identifier.trim()) errs.identifier = 'أدخل بريدك أو اسم المستخدم أو جوالك'
        if (!loginForm.password) errs.password = 'كلمة المرور مطلوبة'
        if (Object.keys(errs).length) { setErrors(errs); return }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: loginForm.identifier, password: loginForm.password }),
            })
            const data = await res.json()
            if (!res.ok) { setErrors({ submit: data.error }); return }
            const dest = redirect === '/profile'
                ? `/profile/${data.provider.provider_id}`
                : redirect
            window.dispatchEvent(new Event('auth-change'))
            router.push(dest)
            router.refresh()
        } catch {
            setErrors({ submit: 'تعذر الاتصال بالسيرفر' })
        } finally {
            setLoading(false)
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (!registerForm.display_name.trim()) errs.display_name = 'الاسم مطلوب'
        if (!/^966\d{9}$/.test(registerForm.phone)) errs.phone = 'رقم غير صحيح'
        if (registerForm.email && !registerForm.email.includes('@')) errs.email = 'بريد غير صحيح'
        if (registerForm.password.length < 6) errs.password = 'كلمة المرور 6 أحرف على الأقل'
        if (registerForm.password !== registerForm.confirm) errs.confirm = 'كلمتا المرور غير متطابقتين'
        if (Object.keys(errs).length) { setErrors(errs); return }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: registerForm.display_name,
                    phone: registerForm.phone,
                    email: registerForm.email || null,
                    username: registerForm.username || null,
                    password: registerForm.password,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setErrors({ submit: data.error }); return }
            const dest = redirect === '/profile'
                ? `/profile/${data.provider.provider_id}`
                : redirect
            window.dispatchEvent(new Event('auth-change'))
            router.push(dest)
            router.refresh()
        } catch {
            setErrors({ submit: 'تعذر الاتصال بالسيرفر' })
        } finally {
            setLoading(false)
        }
    }

    const inputCls = (err?: string) =>
        `w-full bg-gray-50 border rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-colors ${err ? 'border-red-400' : 'border-gray-200 focus:border-[#f63659]'}`

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

            {/* Header */}
            <div className="w-full bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="text-sm font-black text-gray-400 hover:text-gray-700">
                    ← رجوع
                </button>
                <Link href="/">
                    <div className="relative w-10 h-10">
                        <Image src="/img/logo.png" alt="ونس" fill className="object-contain" />
                    </div>
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 py-10">
                <div className="w-full max-w-md">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">
                            {tab === 'login' ? 'أهلاً بعودتك 👋' : 'انضم لونَس 🌊'}
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {tab === 'login'
                                ? 'سجل دخولك لإدارة إعلاناتك وطلباتك'
                                : 'أنشئ حسابك وابدأ رحلتك مع ونَس'}
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {(['login', 'register'] as const).map(t => (
                                <button key={t} onClick={() => { setTab(t); setErrors({}) }}
                                    className={`flex-1 py-4 text-sm font-black transition-all ${tab === t ? 'text-[#f63659] border-b-2 border-[#f63659]' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {t === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {/* Login */}
                            {tab === 'login' && (
                                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">
                                            البريد الإلكتروني أو اسم المستخدم أو الجوال
                                        </label>
                                        <input type="text" placeholder="أدخل أحدها..."
                                            className={inputCls(errors.identifier)}
                                            value={loginForm.identifier}
                                            onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })} />
                                        {errors.identifier && <p className="text-xs text-red-500 mt-1 font-bold">{errors.identifier}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">كلمة المرور</label>
                                        <input type="password" placeholder="••••••••"
                                            className={inputCls(errors.password)}
                                            value={loginForm.password}
                                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                                        {errors.password && <p className="text-xs text-red-500 mt-1 font-bold">{errors.password}</p>}
                                    </div>
                                    {errors.submit && <p className="text-sm text-red-500 text-center font-bold bg-red-50 py-2 rounded-xl">{errors.submit}</p>}
                                    <button type="submit" disabled={loading}
                                        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                                        style={{ backgroundColor: BRAND }}>
                                        {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'دخول'}
                                    </button>
                                </form>
                            )}

                            {/* Register */}
                            {tab === 'register' && (
                                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">الاسم <span className="text-[#f63659]">*</span></label>
                                        <input type="text" placeholder="اسمك أو اسم متجرك"
                                            className={inputCls(errors.display_name)}
                                            value={registerForm.display_name}
                                            onChange={e => setRegisterForm({ ...registerForm, display_name: e.target.value })} />
                                        {errors.display_name && <p className="text-xs text-red-500 mt-1 font-bold">{errors.display_name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">رقم الجوال <span className="text-[#f63659]">*</span></label>
                                        <input type="tel" dir="ltr" placeholder="966XXXXXXXXX"
                                            className={`${inputCls(errors.phone)} text-left`}
                                            value={registerForm.phone}
                                            onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                                        {errors.phone && <p className="text-xs text-red-500 mt-1 font-bold">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">البريد الإلكتروني</label>
                                        <input type="email" dir="ltr" placeholder="example@email.com"
                                            className={`${inputCls(errors.email)} text-left`}
                                            value={registerForm.email}
                                            onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
                                        {errors.email && <p className="text-xs text-red-500 mt-1 font-bold">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-600 mb-1.5 block">اسم المستخدم</label>
                                        <div className="relative">
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                                            <input type="text" dir="ltr" placeholder="your_username"
                                                className={`${inputCls(errors.username)} text-left pr-9`}
                                                value={registerForm.username}
                                                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-black text-gray-600 mb-1.5 block">كلمة المرور <span className="text-[#f63659]">*</span></label>
                                            <input type="password" placeholder="••••••"
                                                className={inputCls(errors.password)}
                                                value={registerForm.password}
                                                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                                            {errors.password && <p className="text-xs text-red-500 mt-1 font-bold">{errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-600 mb-1.5 block">تأكيد <span className="text-[#f63659]">*</span></label>
                                            <input type="password" placeholder="••••••"
                                                className={inputCls(errors.confirm)}
                                                value={registerForm.confirm}
                                                onChange={e => setRegisterForm({ ...registerForm, confirm: e.target.value })} />
                                            {errors.confirm && <p className="text-xs text-red-500 mt-1 font-bold">{errors.confirm}</p>}
                                        </div>
                                    </div>
                                    {errors.submit && <p className="text-sm text-red-500 text-center font-bold bg-red-50 py-2 rounded-xl">{errors.submit}</p>}
                                    <button type="submit" disabled={loading}
                                        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                                        style={{ backgroundColor: BRAND }}>
                                        {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'إنشاء الحساب'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
