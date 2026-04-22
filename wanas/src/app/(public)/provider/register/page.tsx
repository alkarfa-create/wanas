'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const BRAND = '#f63659'

const CATEGORIES = [
    { value: '1', label: 'شاليهات' },
    { value: '2', label: 'بوفيهات وضيافة' },
    { value: '3', label: 'تنسيق حفلات' },
    { value: '4', label: 'ألعاب ترفيهية' },
    { value: '5', label: 'تأجير آلات' },
    { value: '6', label: 'أخرى' },
]

const STEPS = ['المعلومات الأساسية', 'التواصل والموقع', 'الحساب']

interface FormData {
    // Step 1
    fullName: string
    brandName: string
    categoryId: string
    bio: string
    // Step 2
    phone: string
    email: string
    city: string
    username: string
    // Step 3
    password: string
    confirm: string
    agree: boolean
}

const INITIAL: FormData = {
    fullName: '', brandName: '', categoryId: '', bio: '',
    phone: '966', email: '', city: 'جدة', username: '',
    password: '', confirm: '', agree: false,
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-700">
                {label} {required && <span className="text-[#f63659]">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
        </div>
    )
}

const inputCls = (err?: string) =>
    `w-full bg-gray-50 border rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-colors ${err ? 'border-red-400' : 'border-gray-200 focus:border-[#f63659]'}`

export default function ProviderRegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<FormData>(INITIAL)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }))

    function validate() {
        const e: Record<string, string> = {}
        if (step === 0) {
            if (!form.fullName.trim()) e.fullName = 'الاسم مطلوب'
            if (!form.brandName.trim()) e.brandName = 'اسم المتجر مطلوب'
            if (!form.categoryId) e.categoryId = 'اختر التصنيف'
        }
        if (step === 1) {
            if (!/^966\d{9}$/.test(form.phone)) e.phone = 'رقم غير صحيح'
            if (!form.email.includes('@')) e.email = 'بريد إلكتروني غير صحيح'
            if (form.username && !/^[a-z0-9_]+$/.test(form.username)) e.username = 'حروف إنجليزية صغيرة وأرقام فقط'
        }
        if (step === 2) {
            if (form.password.length < 6) e.password = 'كلمة المرور 6 أحرف على الأقل'
            if (form.password !== form.confirm) e.confirm = 'كلمتا المرور غير متطابقتين'
            if (!form.agree) e.agree = 'يجب الموافقة على الشروط'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    function next() { if (validate()) setStep(s => s + 1) }
    function back() { setStep(s => s - 1) }

    async function handleSubmit() {
        if (!validate()) return
        setLoading(true)
        try {
            const res = await fetch('/api/providers/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: form.fullName,
                    brand_name: form.brandName,
                    category_id: form.categoryId,
                    bio: form.bio,
                    phone: form.phone,
                    email: form.email,
                    city: form.city,
                    username: form.username,
                    password: form.password,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setErrors({ submit: data.error || 'حدث خطأ' }); return }
            router.push('/login?redirect=/add-listing')
        } catch {
            setErrors({ submit: 'تعذر الاتصال بالسيرفر' })
        } finally {
            setLoading(false)
        }
    }

    // Success Screen
    if (done) return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-6" dir="rtl">
            <div className="max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-green-500 stroke-2 fill-none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">تم التسجيل! 🎉</h1>
                <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">
                    مرحباً بك في ونَس. سيقوم فريقنا بمراجعة حسابك والتواصل معك خلال 24 ساعة.
                </p>
                <button
                    onClick={() => router.push('/login?redirect=/add-listing')}
                    className="w-full py-4 rounded-2xl font-black text-white mb-3"
                    style={{ backgroundColor: BRAND }}
                >
                    أضف إعلانك الأول
                </button>
                <button onClick={() => router.push('/')} className="w-full py-3 rounded-2xl font-black text-gray-600 border border-gray-200">
                    العودة للرئيسية
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => step > 0 ? back() : router.back()} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gray-600 stroke-2 fill-none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-base font-black text-gray-900">تسجيل كمزود خدمة</h1>
                        <p className="text-xs text-gray-400 font-bold">{STEPS[step]}</p>
                    </div>
                    <span className="text-xs font-black text-gray-400">{step + 1} / {STEPS.length}</span>
                </div>
                <div className="h-1 bg-gray-100">
                    <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: BRAND }} />
                </div>
            </div>

            {/* Step Indicators */}
            <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${i < step ? 'bg-[#f63659] border-[#f63659] text-white' : i === step ? 'border-[#f63659] text-[#f63659] bg-white' : 'border-gray-200 text-gray-400 bg-white'}`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`text-[9px] font-black text-center hidden sm:block ${i === step ? 'text-[#f63659]' : 'text-gray-400'}`}>{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            <div className="max-w-lg mx-auto px-4 pb-32">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

                    {/* Step 1: Basic Info */}
                    {step === 0 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 mb-1">المعلومات الأساسية</h2>
                                <p className="text-xs text-gray-400 font-medium">كيف ستظهر لعملائك في ونَس</p>
                            </div>

                            <Field label="الاسم الكامل" required error={errors.fullName}>
                                <input type="text" placeholder="اسمك الكريم" className={inputCls(errors.fullName)}
                                    value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                            </Field>

                            <Field label="اسم المتجر / العلامة التجارية" required error={errors.brandName}>
                                <input type="text" placeholder="مثال: شاليهات الواحة، أطايب للضيافة" className={inputCls(errors.brandName)}
                                    value={form.brandName} onChange={e => set('brandName', e.target.value)} />
                            </Field>

                            <Field label="التصنيف الرئيسي" required error={errors.categoryId}>
                                <select className={inputCls(errors.categoryId)} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                                    <option value="" disabled>اختر تصنيفك</option>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </Field>

                            <Field label="نبذة عنك" error={errors.bio}>
                                <textarea rows={3} placeholder="عرّف بنفسك وخدماتك بشكل مختصر وجذاب..." className={`${inputCls()} resize-none`}
                                    value={form.bio} onChange={e => set('bio', e.target.value)} />
                                <p className="text-xs text-gray-400 font-medium text-left">{form.bio.length} / 200</p>
                            </Field>
                        </div>
                    )}

                    {/* Step 2: Contact */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 mb-1">التواصل والموقع</h2>
                                <p className="text-xs text-gray-400 font-medium">سيصلك على هذه البيانات إشعارات الحجوزات</p>
                            </div>

                            <Field label="رقم الجوال / الواتساب" required error={errors.phone}>
                                <input type="tel" dir="ltr" placeholder="966XXXXXXXXX" className={`${inputCls(errors.phone)} text-left`}
                                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                            </Field>

                            <Field label="البريد الإلكتروني" required error={errors.email}>
                                <input type="email" dir="ltr" placeholder="example@email.com" className={`${inputCls(errors.email)} text-left`}
                                    value={form.email} onChange={e => set('email', e.target.value)} />
                            </Field>

                            <Field label="المدينة" required>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-black text-gray-500">
                                    جدة
                                </div>
                            </Field>

                            <Field label="اسم المستخدم" error={errors.username}>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">@</span>
                                    <input type="text" dir="ltr" placeholder="your_username" className={`${inputCls(errors.username)} text-left pr-9`}
                                        value={form.username} onChange={e => set('username', e.target.value)} />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">حروف إنجليزية صغيرة وأرقام وـ فقط</p>
                            </Field>
                        </div>
                    )}

                    {/* Step 3: Account */}
                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 mb-1">بيانات الحساب</h2>
                                <p className="text-xs text-gray-400 font-medium">ستستخدمها لتسجيل الدخول لاحقاً</p>
                            </div>

                            <Field label="كلمة المرور" required error={errors.password}>
                                <input type="password" placeholder="6 أحرف على الأقل" className={inputCls(errors.password)}
                                    value={form.password} onChange={e => set('password', e.target.value)} />
                            </Field>

                            <Field label="تأكيد كلمة المرور" required error={errors.confirm}>
                                <input type="password" placeholder="أعد كتابة كلمة المرور" className={inputCls(errors.confirm)}
                                    value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                            </Field>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-xs font-black text-gray-500 mb-3">مراجعة سريعة</p>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { label: 'الاسم', value: form.fullName },
                                        { label: 'المتجر', value: form.brandName },
                                        { label: 'الجوال', value: form.phone },
                                        { label: 'البريد', value: form.email },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between text-xs">
                                            <span className="text-gray-400 font-bold">{label}</span>
                                            <span className="text-gray-700 font-black">{value || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Terms */}
                            <button
                                type="button"
                                onClick={() => set('agree', !form.agree)}
                                className="flex items-start gap-3 text-right"
                            >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${form.agree ? 'bg-[#f63659] border-[#f63659]' : 'border-gray-300'}`}>
                                    {form.agree && <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-white stroke-3 fill-none"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="text-xs font-bold text-gray-600 leading-relaxed">
                                    أوافق على <span className="text-[#f63659] underline cursor-pointer">شروط الاستخدام</span> و<span className="text-[#f63659] underline cursor-pointer">سياسة الخصوصية</span> لمنصة ونَس
                                </span>
                            </button>
                            {errors.agree && <p className="text-xs text-red-500 font-bold -mt-3">{errors.agree}</p>}
                            {errors.submit && <p className="text-sm text-red-500 text-center font-bold">{errors.submit}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50">
                <div className="max-w-lg mx-auto flex gap-3">
                    {step > 0 && (
                        <button onClick={back} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-black text-gray-700 hover:border-gray-300 transition-all">
                            رجوع
                        </button>
                    )}
                    <button
                        onClick={step < STEPS.length - 1 ? next : handleSubmit}
                        disabled={loading}
                        className="flex-[2] py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{ backgroundColor: BRAND }}
                    >
                        {loading
                            ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : step < STEPS.length - 1 ? 'التالي' : 'إنشاء الحساب'}
                    </button>
                </div>
            </div>
        </div>
    )
}
