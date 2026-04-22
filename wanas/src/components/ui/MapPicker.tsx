'use client'
// src/components/ui/MapPicker.tsx

import { useEffect, useRef, useState } from 'react'

interface LocationResult {
    districtName: string
    latitude: number
    longitude: number
}

interface Props {
    onSelect: (result: LocationResult) => void
    initialLat?: number
    initialLng?: number
    initialDistrict?: string
}

const JEDDAH_CENTER = { lat: 21.4858, lng: 39.1925 }
const JEDDAH_BOUNDS = {
    minLat: 21.2, maxLat: 21.8,
    minLng: 38.9, maxLng: 39.4,
}

// ── جميع أحياء جدة ─────────────────────────────────────────────
const KNOWN_DISTRICTS: { keywords: string[]; name: string }[] = [
    // شمال جدة
    { keywords: ['الاصالة', 'asalah'], name: 'الاصالة' },
    { keywords: ['ابحر الشمالية', 'abhur', 'abhur al-shamaliyah'], name: 'ابحر الشمالية' },
    { keywords: ['الفردوس', 'fardous', 'firdous'], name: 'الفردوس' },
    { keywords: ['الشراع', 'shira'], name: 'الشراع' },
    { keywords: ['الامواج', 'amwaj'], name: 'الأمواج' },
    { keywords: ['الصواري', 'sawari'], name: 'الصواري' },
    { keywords: ['الياقوت', 'yaqut'], name: 'الياقوت' },
    { keywords: ['اللؤلؤ', 'lulu'], name: 'اللؤلؤ' },
    { keywords: ['الزمرد', 'zumurrud', 'zumrud'], name: 'الزمرد' },
    { keywords: ['المنارات', 'manarat'], name: 'المنارات' },
    { keywords: ['الفنار', 'fanar'], name: 'الفنار' },
    { keywords: ['البحيرات', 'buhayrat'], name: 'البحيرات' },
    { keywords: ['النور', 'nour', 'nur'], name: 'النور' },
    { keywords: ['المروج', 'muruj'], name: 'المروج' },
    { keywords: ['الخليج', 'khalij'], name: 'الخليج' },
    { keywords: ['النجمة', 'najma'], name: 'النجمة' },
    { keywords: ['الزهور', 'zuhur'], name: 'الزهور' },
    { keywords: ['الغربية', 'gharbiyah'], name: 'الغربية' },
    { keywords: ['الشويضي', 'shuwaydi'], name: 'الشويضي' },
    { keywords: ['الغدير', 'ghadir'], name: 'الغدير' },
    { keywords: ['الربيع', 'rabi'], name: 'الربيع' },
    { keywords: ['العقيق', 'aqiq'], name: 'العقيق' },
    { keywords: ['العبير', 'abir'], name: 'العبير' },
    { keywords: ['الدرة', 'durra'], name: 'الدرة' },
    { keywords: ['طابة', 'tabah'], name: 'طابة' },
    { keywords: ['المجامع', 'majami'], name: 'المجامع' },
    { keywords: ['المزيرعة', 'muzayri'], name: 'المزيرعة' },
    { keywords: ['الفرقان', 'furqan'], name: 'الفرقان' },
    { keywords: ['اليسر', 'yusr'], name: 'اليسر' },
    { keywords: ['الكورنيش', 'corniche', 'kurnaish'], name: 'الكورنيش' },
    { keywords: ['المعرفة', 'ma\'rifa', 'marifa'], name: 'المعرفة' },
    { keywords: ['الودية', 'wadiyah'], name: 'الودية' },
    // شرق جدة
    { keywords: ['التوفيق', 'tawfiq'], name: 'التوفيق' },
    { keywords: ['المودة', 'mawaddah'], name: 'المودة' },
    { keywords: ['البيان', 'bayan'], name: 'البيان' },
    { keywords: ['الندى', 'nada'], name: 'الندى' },
    { keywords: ['الوداد', 'widad'], name: 'الوداد' },
    { keywords: ['الصفوة', 'safwah'], name: 'الصفوة' },
    { keywords: ['شعناء', 'sha\'na'], name: 'شعناء' },
    { keywords: ['الصفحة', 'safha'], name: 'الصفحة' },
    { keywords: ['البدور', 'budur'], name: 'البدور' },
    { keywords: ['الوفاء', 'wafa'], name: 'الوفاء' },
    { keywords: ['الرياض', 'riyadh', 'riyad'], name: 'الرياض' },
    { keywords: ['الفروسية', 'furusiyah'], name: 'الفروسية' },
    { keywords: ['الحجاز', 'hijaz'], name: 'الحجاز' },
    { keywords: ['الرحمانية', 'rahmaniyah'], name: 'الرحمانية' },
    { keywords: ['البشائر', 'basha\'ir'], name: 'البشائر' },
    { keywords: ['الفلاح', 'falah'], name: 'الفلاح' },
    { keywords: ['الصالحية', 'salihiyah'], name: 'الصالحية' },
    { keywords: ['الحمدانية', 'hamdaniyah'], name: 'الحمدانية' },
    { keywords: ['الكوثر', 'kawthar'], name: 'الكوثر' },
    { keywords: ['الريان', 'rayyan'], name: 'الريان' },
    { keywords: ['الرواسي', 'rawasi'], name: 'الرواسي' },
    { keywords: ['التلال', 'tilal'], name: 'التلال' },
    { keywords: ['بريمان', 'brayman', 'briman'], name: 'بريمان' },
    { keywords: ['العسلاء', 'asla'], name: 'العسلاء' },
    { keywords: ['المنتزة', 'muntazah'], name: 'المنتزة' },
    { keywords: ['الاجواد', 'ajwad'], name: 'الاجواد' },
    { keywords: ['المنار', 'manar'], name: 'المنار' },
    { keywords: ['السامر', 'samir'], name: 'السامر' },
    { keywords: ['الحفنة', 'hafna'], name: 'الحفنة' },
    { keywords: ['الشروق', 'shruq', 'shurooq'], name: 'الشروق' },
    { keywords: ['الواحة', 'wahah'], name: 'الواحة' },
    { keywords: ['النخيل', 'nakhil'], name: 'النخيل' },
    { keywords: ['القوس', 'qaws'], name: 'القوس' },
    { keywords: ['الرغامة', 'rghamah'], name: 'الرغامة' },
    { keywords: ['الحرزات', 'harzat'], name: 'الحرزات' },
    { keywords: ['المنتزهات', 'muntazahat'], name: 'المنتزهات' },
    { keywords: ['كنانة', 'kinana'], name: 'كنانة' },
    { keywords: ['طيبة', 'taybah'], name: 'طيبة' },
    { keywords: ['قبا', 'quba'], name: 'قبا' },
    { keywords: ['الهزاعية', 'haza\'iyah'], name: 'الهزاعية' },
    { keywords: ['المجد', 'majd'], name: 'المجد' },
    { keywords: ['رضوى', 'radwa'], name: 'رضوى' },
    { keywords: ['البوادر', 'bawader'], name: 'البوادر' },
    { keywords: ['الهجرة', 'hijrah'], name: 'الهجرة' },
    { keywords: ['الشمائل', 'shama\'il'], name: 'الشمائل' },
    { keywords: ['البهجة', 'bahja'], name: 'البهجة' },
    // غرب جدة
    { keywords: ['الحمراء', 'hamra'], name: 'الحمراء' },
    { keywords: ['الاندلس', 'andalus'], name: 'الأندلس' },
    { keywords: ['الروضة', 'rawdah', 'rawda'], name: 'الروضة' },
    { keywords: ['الخالدية', 'khalidiyah'], name: 'الخالدية' },
    { keywords: ['الزهراء', 'zahrah', 'zahra'], name: 'الزهراء' },
    { keywords: ['السلامة', 'salamah', 'salama'], name: 'السلامة' },
    { keywords: ['الشاطئ', 'shati'], name: 'الشاطئ' },
    { keywords: ['النهضة', 'nahdah'], name: 'النهضة' },
    { keywords: ['النعيم', 'naeem', 'naim'], name: 'النعيم' },
    { keywords: ['المحمدية', 'muhammadiyah'], name: 'المحمدية' },
    { keywords: ['البساتين', 'basatin'], name: 'البساتين' },
    { keywords: ['المرجان', 'murjan'], name: 'المرجان' },
    { keywords: ['ابحر الجنوبي', 'abhur al-janubi'], name: 'ابحر الجنوبي' },
    // وسط جدة
    { keywords: ['الرحاب', 'rehab', 'rahab'], name: 'الرحاب' },
    { keywords: ['العزيزية', 'aziziyah'], name: 'العزيزية' },
    { keywords: ['مشرفة', 'mushrifa'], name: 'مشرفة' },
    { keywords: ['بني مالك', 'bani malik'], name: 'بني مالك' },
    { keywords: ['النسيم', 'nasim'], name: 'النسيم' },
    { keywords: ['الورود', 'wurud'], name: 'الورود' },
    { keywords: ['الشرفية', 'sharafiyah'], name: 'الشرفية' },
    { keywords: ['الرويس', 'ruways'], name: 'الرويس' },
    { keywords: ['السليمانية', 'sulaymaniyah'], name: 'السليمانية' },
    { keywords: ['الفيحاء', 'fayha'], name: 'الفيحاء' },
    { keywords: ['الكندرة', 'kandara'], name: 'الكندرة' },
    { keywords: ['البغدادية', 'baghdadiyah'], name: 'البغدادية' },
    { keywords: ['جدة التاريخية', 'al-balad', 'balad'], name: 'جدة التاريخية' },
    { keywords: ['النزهة', 'nuzhah', 'nuzha'], name: 'النزهة' },
    { keywords: ['المروة', 'marwah'], name: 'المروة' },
    { keywords: ['الربوة', 'rabwah'], name: 'الربوة' },
    { keywords: ['البوادي', 'bawadi'], name: 'البوادي' },
    { keywords: ['الصفا', 'safa'], name: 'الصفا' },
    { keywords: ['الفيصلية', 'faisaliyah'], name: 'الفيصلية' },
    // جنوب جدة
    { keywords: ['الروابي', 'rawabi'], name: 'الروابي' },
    { keywords: ['الجامعة', 'jami\'ah', 'jamiah'], name: 'الجامعة' },
    { keywords: ['الثغر', 'thaghr'], name: 'الثغر' },
    { keywords: ['النزلة الشرقية', 'nuzlah sharqiyah'], name: 'النزلة الشرقية' },
    { keywords: ['الثعالبة', 'tha\'alibah'], name: 'الثعالبة' },
    { keywords: ['الفاروق', 'faruq'], name: 'الفاروق' },
    { keywords: ['النزلة اليمانية', 'nuzlah yamaniyah'], name: 'النزلة اليمانية' },
    { keywords: ['القريات', 'qurayat'], name: 'القريات' },
    { keywords: ['غليل', 'ghulail'], name: 'غليل' },
    { keywords: ['الوزيرية', 'waziriyah'], name: 'الوزيرية' },
    { keywords: ['الجوهرة', 'jawharah'], name: 'الجوهرة' },
    { keywords: ['الشفا', 'shifa'], name: 'الشفا' },
    { keywords: ['الهدا', 'hada'], name: 'الهدا' },
    { keywords: ['السنابل', 'sanabil'], name: 'السنابل' },
    { keywords: ['الاثير', 'athir'], name: 'الأثير' },
    { keywords: ['العسلية', 'asiliyah'], name: 'العسلية' },
    { keywords: ['المستقبل', 'mustaqbal'], name: 'المستقبل' },
    { keywords: ['السهل', 'sahl'], name: 'السهل' },
    { keywords: ['التضامن', 'tadamun'], name: 'التضامن' },
    { keywords: ['التعاون', 'ta\'awun'], name: 'التعاون' },
    { keywords: ['الخمرة', 'khumra'], name: 'الخمرة' },
    { keywords: ['المحجر', 'mahjar'], name: 'المحجر' },
    { keywords: ['السرور', 'surur'], name: 'السرور' },
    { keywords: ['السروات', 'sarwat'], name: 'السروات' },
    { keywords: ['الكرامة', 'karamah'], name: 'الكرامة' },
    { keywords: ['الفضيلة', 'fadilah'], name: 'الفضيلة' },
    { keywords: ['القرينية', 'qurayniyah'], name: 'القرينية' },
    { keywords: ['الضاحية', 'dahiyah'], name: 'الضاحية' },
    { keywords: ['الوادي', 'wadi'], name: 'الوادي' },
    { keywords: ['الساحل', 'sahil'], name: 'الساحل' },
    { keywords: ['الرحمة', 'rahmah'], name: 'الرحمة' },
    { keywords: ['البركة', 'barakah'], name: 'البركة' },
    { keywords: ['المسرة', 'masarrah'], name: 'المسرة' },
    { keywords: ['المليساء', 'mulaysa'], name: 'المليساء' },
    { keywords: ['القوزين', 'qawzayn'], name: 'القوزين' },
    { keywords: ['الرابية', 'rabiyah'], name: 'الرابية' },
    { keywords: ['المرسى', 'marsa'], name: 'المرسى' },
    { keywords: ['الرمال', 'rimal'], name: 'الرمال' },
    { keywords: ['الموج', 'mawj'], name: 'الموج' },
]

function matchDistrict(raw: string): string {
    if (!raw) return raw
    const lower = raw.toLowerCase()
    for (const d of KNOWN_DISTRICTS) {
        if (d.keywords.some(k => lower.includes(k.toLowerCase()) || raw.includes(k))) {
            return d.name
        }
    }
    return raw
}

export default function MapPicker({ onSelect, initialLat, initialLng, initialDistrict }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)

    const [districtName, setDistrictName] = useState(initialDistrict ?? '')
    const [loading, setLoading] = useState(false)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    )

    useEffect(() => {
        if (mapInstanceRef.current) return

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => initMap()
        document.head.appendChild(script)

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    function initMap() {
        if (!mapRef.current || mapInstanceRef.current) return
        const L = (window as any).L

        const center = coords ?? JEDDAH_CENTER
        const map = L.map(mapRef.current, {
            center: [center.lat, center.lng],
            zoom: 13,
            zoomControl: false,
        })

        L.control.zoom({ position: 'bottomleft' }).addTo(map)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
        }).addTo(map)

        const icon = makeIcon(L)

        if (coords) {
            markerRef.current = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map)
            markerRef.current.on('dragend', (e: any) => {
                const pos = e.target.getLatLng()
                handleLocationSelect(pos.lat, pos.lng)
            })
        }

        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng
            if (
                lat < JEDDAH_BOUNDS.minLat || lat > JEDDAH_BOUNDS.maxLat ||
                lng < JEDDAH_BOUNDS.minLng || lng > JEDDAH_BOUNDS.maxLng
            ) return

            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng])
            } else {
                markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
                markerRef.current.on('dragend', (ev: any) => {
                    const pos = ev.target.getLatLng()
                    handleLocationSelect(pos.lat, pos.lng)
                })
            }
            handleLocationSelect(lat, lng)
        })

        mapInstanceRef.current = map
    }

    function makeIcon(L: any) {
        return L.divIcon({
            html: `<div style="width:36px;height:36px;background:#f63659;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(246,54,89,0.5);display:flex;align-items:center;justify-content:center;"><div style="transform:rotate(45deg);font-size:14px;">📍</div></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            className: '',
        })
    }

    async function handleLocationSelect(lat: number, lng: number) {
        setCoords({ lat, lng })
        setLoading(true)

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar&zoom=16`,
                { headers: { 'User-Agent': 'WanasApp/1.0' } }
            )
            const data = await res.json()

            const raw =
                data.address?.neighbourhood ||
                data.address?.suburb ||
                data.address?.quarter ||
                data.address?.residential ||
                data.address?.county ||
                ''

            const matched = matchDistrict(raw)
            setDistrictName(matched)
            onSelect({ districtName: matched, latitude: lat, longitude: lng })

        } catch {
            onSelect({ districtName: districtName, latitude: lat, longitude: lng })
        } finally {
            setLoading(false)
        }
    }

    function handleLocateMe() {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude: lat, longitude: lng } = pos.coords
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([lat, lng], 15)
            }

            const L = (window as any).L
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng])
            } else if (mapInstanceRef.current) {
                markerRef.current = L.marker([lat, lng], { icon: makeIcon(L), draggable: true }).addTo(mapInstanceRef.current)
                markerRef.current.on('dragend', (e: any) => {
                    const pos = e.target.getLatLng()
                    handleLocationSelect(pos.lat, pos.lng)
                })
            }

            handleLocationSelect(lat, lng)
        })
    }

    return (
        <div className="flex flex-col gap-3" dir="rtl">
            <div className={`flex items-center justify-between bg-gray-50 border rounded-2xl px-4 py-3 transition-all ${coords ? 'border-[#f63659]/30 bg-rose-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{coords ? '📍' : '🗺️'}</span>
                    <div>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-300 border-t-[#f63659] rounded-full animate-spin" />
                                <span className="text-xs text-gray-400 font-bold">جارٍ تحديد الحي...</span>
                            </div>
                        ) : coords ? (
                            <>
                                <p className="text-sm font-black text-gray-900">{districtName || 'موقع محدد'}</p>
                                <p className="text-[10px] text-gray-400 font-mono">
                                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 font-bold">اضغط على الخريطة لتحديد الموقع</p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleLocateMe}
                    className="flex items-center gap-1 text-xs font-black text-[#f63659] bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
                        <circle cx="12" cy="12" r="3" />
                        <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    </svg>
                    موقعي
                </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
                <div ref={mapRef} className="w-full h-full" />
                {!coords && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs font-black text-gray-600">اضغط على الخريطة لتحديد موقعك</p>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400 font-medium text-center">
                يمكنك سحب الدبوس لتعديل الموقع بدقة أكبر
            </p>
        </div>
    )
}