'use client'
// src/app/(public)/add-listing/AddListingForm.tsx

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import MapPicker from '@/components/ui/MapPicker'

type CategorySlug =
  | 'chalets'
  | 'hospitality'
  | 'catering'
  | 'events'
  | 'games'
  | 'rentals'

type ContactMethod = 'whatsapp' | 'call' | 'both'
type MetaFieldType = 'text' | 'number' | 'select'
type DepositPolicyType =
  | 'refundable'
  | 'partial_refundable'
  | 'non_refundable'
  | 'reschedule_only'
  | 'custom'

interface MetaField {
  key: string
  label: string
  type: MetaFieldType
  options?: string[]
  placeholder?: string
  hint?: string
}

interface CategoryFeature {
  id: string
  icon: string
}

interface CategoryConfig {
  label: string
  icon: string
  desc: string
  titlePlaceholder: string
  descriptionPlaceholder: string
  defaultPriceUnit: string
  priceUnits: string[]
  priceIncludesPlaceholder: string
  showOccasionType?: boolean
  capacitySectionLabel: string
  capacityMinLabel: string
  capacityMaxLabel: string
  availabilityDaysLabel: string
  availabilityTimeLabel: string
  metaTitle: string
  featuresTitle: string
  otherFeaturesPlaceholder: string
  metaFields: MetaField[]
  features: CategoryFeature[]
}

interface ListingFormState {
  title: string
  category: CategorySlug | ''
  description: string
  districtName: string
  latitude: number | null
  longitude: number | null
  priceMin: string
  priceMax: string
  priceUnit: string
  priceIncludes: string
  occasionType: string

  negotiable: boolean
  depositRequired: boolean
  depositAmount: string
  depositPolicyType: DepositPolicyType
  depositPolicyNote: string
  securityDepositRequired: boolean
  securityDepositAmount: string
  securityDepositPolicyType: DepositPolicyType
  securityDepositPolicyNote: string

  capacityMin: string
  capacityMax: string

  availableDays: string[]
  availableFrom: string
  availableTo: string

  features: string[]
  additionalFeatures: string[]

  cancellationPolicy: string
  cancellationPolicyNote: string
  postponePolicy: string
  terms: string

  contactWhatsapp: string
  contactPhone: string
  contactMethod: ContactMethod

  notes: string
  existingImages: string[]
  images: File[]
  coverIndex: number
  meta: Record<string, string>
}

export interface AddListingFormProps {
  providerId: string
  districtId?: number
  editId?: string
  editData?: ListingEditData
}

export interface ListingEditData {
  title?: string | null
  description?: string | null
  category_id?: number | null
  district_name?: string | null
  latitude?: number | null
  longitude?: number | null
  price_min?: number | string | null
  price_max?: number | string | null
  occasion_type?: string | null
  booking_deposit_required?: boolean | null
  booking_deposit_amount?: number | string | null
  booking_deposit_policy?: string | null
  security_deposit_required?: boolean | null
  security_deposit_amount?: number | string | null
  security_deposit_policy?: string | null
  capacity_min?: number | string | null
  capacity_max?: number | string | null
  features?: string[] | null
  policies?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  media?: { url?: string | null; sort_order?: number | null }[] | null
  cover_url?: string | null
  cancellation_policy?: string | null
  contact_whatsapp?: string | null
  contact_phone?: string | null
}

const BRAND = '#f63659'

const STEPS = [
  { id: 0, title: 'الفئة والعنوان', icon: '🧩', desc: 'اختر نوع الإعلان وصغه بطريقة تناسب الفئة' },
  { id: 1, title: 'الموقع', icon: '📍', desc: 'حدّد موقع تقديم الخدمة أو الأصل المعروض' },
  { id: 2, title: 'التسعير', icon: '💰', desc: 'السعر، الوحدة، وما يشمله العرض' },
  { id: 3, title: 'المواصفات والمميزات', icon: '✨', desc: 'حقول خاصة بالفئة + مميزات قابلة للتخصيص' },
  { id: 4, title: 'السياسات والتشغيل', icon: '📜', desc: 'الإلغاء، العربون، والشروط التشغيلية' },
  { id: 5, title: 'الوسائط والتواصل', icon: '📷', desc: 'الصور ووسائل التواصل النهائية' },
] as const

const CATEGORY_ORDER: CategorySlug[] = [
  'chalets',
  'hospitality',
  'catering',
  'events',
  'games',
  'rentals',
]

const CATEGORY_CONFIG: Record<CategorySlug, CategoryConfig> = {
  chalets: {
    label: 'شاليه / استراحة',
    icon: '🏡',
    desc: 'شاليهات، استراحات، مزارع',
    titlePlaceholder: 'مثال: شاليه الواحة — مسبح خاص وجلسة خارجية',
    descriptionPlaceholder:
      'اكتب وصفًا يوضح الأجواء والمرافق والسعة ونوع الحجز وما يميز المكان عن غيره.',
    defaultPriceUnit: 'ليلة',
    priceUnits: ['ليلة', 'يوم', 'نصف يوم'],
    priceIncludesPlaceholder: 'مثال: يشمل الإيجار + الكهرباء + الماء + تنظيف قبل الدخول',
    showOccasionType: true,
    capacitySectionLabel: 'السعة والمرافق',
    capacityMinLabel: 'الحد الأدنى للسعة',
    capacityMaxLabel: 'الحد الأقصى للسعة',
    availabilityDaysLabel: 'أيام الحجز المتاحة',
    availabilityTimeLabel: 'ساعات الدخول أو الاستخدام',
    metaTitle: 'مواصفات المكان',
    featuresTitle: 'مرافق ومميزات الشاليه',
    otherFeaturesPlaceholder: 'مثال: دخول ذاتي، قسمين مستقلين، منطقة شواء إضافية',
    metaFields: [
      { key: 'booking_type', label: 'نوع الحجز', type: 'select', options: ['مبيت', 'نصف يوم', 'يوم كامل', 'جميع الخيارات'] },
      { key: 'rooms', label: 'عدد الغرف', type: 'number', placeholder: '3' },
      { key: 'bathrooms', label: 'عدد دورات المياه', type: 'number', placeholder: '2' },
    ],
    features: [
      { id: 'مسبح خارجي', icon: '🏊' },
      { id: 'مسبح داخلي', icon: '🏊' },
      { id: 'مسبح أطفال', icon: '👶' },
      { id: 'مطبخ كامل', icon: '🍳' },
      { id: 'شواية خارجية', icon: '🔥' },
      { id: 'جلسة خارجية', icon: '🪑' },
      { id: 'مسطحات خضراء', icon: '🌿' },
      { id: 'ملعب', icon: '⚽' },
      { id: 'موقف سيارات', icon: '🅿️' },
      { id: 'مناسب للأطفال', icon: '👶' },
    ],
  },

  hospitality: {
    label: 'ضيافة',
    icon: '☕',
    desc: 'قهوة، شاي، عصائر، مباشرين',
    titlePlaceholder: 'مثال: ضيافة سعودية فاخرة للمناسبات مع مباشرين محترفين',
    descriptionPlaceholder:
      'اشرح نوع الضيافة وعدد الضيوف المشمولين وطاقم العمل وما الذي تتضمنه الخدمة.',
    defaultPriceUnit: 'ساعة',
    priceUnits: ['ساعة', 'مناسبة', 'باقة'],
    priceIncludesPlaceholder: 'مثال: يشمل القهوة + الشاي + التمر + 2 مباشرين',
    showOccasionType: true,
    capacitySectionLabel: 'نطاق الخدمة',
    capacityMinLabel: 'الحد الأدنى للضيوف',
    capacityMaxLabel: 'الحد الأقصى للضيوف',
    availabilityDaysLabel: 'أيام تقديم الخدمة',
    availabilityTimeLabel: 'ساعات التواجد أو التقديم',
    metaTitle: 'تفاصيل خدمة الضيافة',
    featuresTitle: 'مشتملات ومميزات الضيافة',
    otherFeaturesPlaceholder: 'مثال: فناجين خاصة، ركن استقبال، ضيافة VIP',
    metaFields: [
      {
        key: 'service_type',
        label: 'نوع الضيافة',
        type: 'select',
        options: ['قهوة سعودية', 'شاي وضيافة خفيفة', 'عصائر فريش', 'ضيافة شعبية', 'ضيافة مودرن', 'خدمة متنوعة'],
      },
      { key: 'staff_count', label: 'عدد المباشرين', type: 'number', placeholder: '2' },
      { key: 'staff_gender', label: 'فئة الطاقم', type: 'select', options: ['رجال فقط', 'نساء فقط', 'كلاهما'] },
      { key: 'service_hours', label: 'مدة تقديم الخدمة', type: 'number', placeholder: '4', hint: 'بالساعات' },
    ],
    features: [
      { id: 'قهوة سعودية', icon: '☕' },
      { id: 'شاي', icon: '🍵' },
      { id: 'عصائر فريش', icon: '🧃' },
      { id: 'تمر وحلى', icon: '🍮' },
      { id: 'معجنات', icon: '🥐' },
      { id: 'طاقم رجال', icon: '👨' },
      { id: 'طاقم نساء', icon: '👩' },
      { id: 'زي رسمي', icon: '🤵' },
      { id: 'متوفر التوصيل', icon: '🚚' },
    ],
  },

  catering: {
    label: 'بوفيه وتموين',
    icon: '🍽️',
    desc: 'بوفيهات، تموين، مشويات، بحري',
    titlePlaceholder: 'مثال: بوفيه مشويات فاخر للمناسبات الكبيرة مع طاقم تقديم',
    descriptionPlaceholder:
      'صف نوع المطبخ والأصناف الأساسية وعدد الأشخاص المشمولين وما إذا كانت الخدمة تشمل التقديم.',
    defaultPriceUnit: 'مناسبة',
    priceUnits: ['مناسبة', 'شخص', 'باقة'],
    priceIncludesPlaceholder: 'مثال: يشمل الطعام + طاولات البوفيه + أدوات التقديم',
    showOccasionType: true,
    capacitySectionLabel: 'حجم البوفيه',
    capacityMinLabel: 'الحد الأدنى للأشخاص',
    capacityMaxLabel: 'الحد الأقصى للأشخاص',
    availabilityDaysLabel: 'أيام تقديم الطلبات',
    availabilityTimeLabel: 'ساعات التنفيذ أو التوصيل',
    metaTitle: 'تفاصيل البوفيه والتموين',
    featuresTitle: 'خدمات ومكونات البوفيه',
    otherFeaturesPlaceholder: 'مثال: ركن حلويات، مشروبات باردة، خدمة VIP',
    metaFields: [
      {
        key: 'kitchen_type',
        label: 'نوع المطبخ',
        type: 'select',
        options: ['خليجي', 'مشويات', 'بحري', 'إنترناشونال', 'شعبي', 'متنوع'],
      },
      { key: 'min_persons', label: 'أقل عدد أشخاص', type: 'number', placeholder: '20' },
      { key: 'max_persons', label: 'أعلى عدد أشخاص', type: 'number', placeholder: '200' },
    ],
    features: [
      { id: 'مشويات', icon: '🥩' },
      { id: 'بحري', icon: '🐟' },
      { id: 'مطبخ خليجي', icon: '🍖' },
      { id: 'مطبخ عالمي', icon: '🌍' },
      { id: 'طاولات بوفيه', icon: '🪑' },
      { id: 'صحون وأدوات', icon: '🍽️' },
      { id: 'طاقم خدمة', icon: '🤵' },
      { id: 'حلويات', icon: '🍰' },
      { id: 'متوفر التوصيل', icon: '🚚' },
    ],
  },

  events: {
    label: 'تنسيق حفلات',
    icon: '🎉',
    desc: 'ديكور، كوش، بالونات، إضاءة',
    titlePlaceholder: 'مثال: تنسيق حفلة تخرج بديكور وردي وركن تصوير',
    descriptionPlaceholder:
      'اشرح نوع المناسبة والعناصر التي توفرها مثل الكوشة والديكور والإضاءة وطريقة التنفيذ.',
    defaultPriceUnit: 'مناسبة',
    priceUnits: ['مناسبة', 'باقة', 'ساعة'],
    priceIncludesPlaceholder: 'مثال: يشمل الكوشة + خلفية + بالونات + تركيب قبل المناسبة',
    showOccasionType: true,
    capacitySectionLabel: 'نطاق المناسبة',
    capacityMinLabel: 'الحد الأدنى للحضور',
    capacityMaxLabel: 'الحد الأقصى للحضور',
    availabilityDaysLabel: 'أيام تنفيذ التنسيق',
    availabilityTimeLabel: 'ساعات التجهيز أو التنفيذ',
    metaTitle: 'تفاصيل تنسيق الحفل',
    featuresTitle: 'العناصر المتوفرة في التنسيق',
    otherFeaturesPlaceholder: 'مثال: ثيم مخصص، أسماء مضيئة، ركن توقيع',
    metaFields: [
      { key: 'setup_hours', label: 'ساعات التجهيز', type: 'number', placeholder: '3', hint: 'قبل المناسبة' },
      { key: 'venue_type', label: 'موقع التنسيق', type: 'select', options: ['منزل', 'قاعة', 'حديقة', 'مكتب', 'أي مكان'] },
      {
        key: 'theme',
        label: 'نمط المناسبة',
        type: 'select',
        options: ['تخرج', 'مولود', 'زفاف', 'خطوبة', 'يوم تأسيس', 'عيد ميلاد', 'مناسبات متنوعة'],
      },
    ],
    features: [
      { id: 'كوشة', icon: '💐' },
      { id: 'بالونات', icon: '🎈' },
      { id: 'إضاءة ديكور', icon: '✨' },
      { id: 'ورد طبيعي', icon: '🌹' },
      { id: 'مداخل مزينة', icon: '🎀' },
      { id: 'طاولات استقبال', icon: '🪑' },
      { id: 'طباعة أسماء', icon: '🖨️' },
      { id: 'ركن تصوير', icon: '📸' },
    ],
  },

  games: {
    label: 'ألعاب وترفيه',
    icon: '🎮',
    desc: 'نطيطات، ألعاب، أنشطة ترفيهية',
    titlePlaceholder: 'مثال: نطيطة كبيرة للأطفال مع تركيب آمن داخل جدة',
    descriptionPlaceholder:
      'اشرح نوع اللعبة والفئة العمرية المناسبة ومتطلبات التركيب والمساحة اللازمة للتشغيل.',
    defaultPriceUnit: 'يوم',
    priceUnits: ['ساعة', 'يوم', 'مناسبة'],
    priceIncludesPlaceholder: 'مثال: يشمل التركيب + الفك + النقل داخل جدة',
    showOccasionType: true,
    capacitySectionLabel: 'سعة الاستخدام',
    capacityMinLabel: 'الحد الأدنى للمستخدمين',
    capacityMaxLabel: 'الحد الأقصى للمستخدمين',
    availabilityDaysLabel: 'أيام توفر اللعبة',
    availabilityTimeLabel: 'ساعات التركيب أو الاستخدام',
    metaTitle: 'تفاصيل اللعبة أو النشاط',
    featuresTitle: 'خصائص ومزايا الترفيه',
    otherFeaturesPlaceholder: 'مثال: مشرف تشغيل، نظام أمان إضافي، تركيب سريع',
    metaFields: [
      { key: 'age_group', label: 'الفئة العمرية', type: 'select', options: ['أطفال فقط', 'شباب فقط', 'عام للجميع'] },
      { key: 'space_required', label: 'المساحة المطلوبة', type: 'text', placeholder: 'مثال: 5 × 5 متر' },
      { key: 'power_source', label: 'مصدر الكهرباء', type: 'select', options: ['مطلوب', 'غير مطلوب', 'مولد متوفر'] },
    ],
    features: [
      { id: 'نطيطات', icon: '🤸' },
      { id: 'زحاليق مائية', icon: '💧' },
      { id: 'ألعاب فيديو', icon: '🎮' },
      { id: 'بلياردو', icon: '🎱' },
      { id: 'تنس طاولة', icon: '🏓' },
      { id: 'تركيب داخلي', icon: '🏠' },
      { id: 'تركيب خارجي', icon: '🌳' },
      { id: 'مناسب للأطفال', icon: '👶' },
    ],
  },

  rentals: {
    label: 'معدات وتجهيزات',
    icon: '🎛️',
    desc: 'صوتيات، عرض، ماكينات، أجهزة',
    titlePlaceholder: 'مثال: بروجكتر احترافي مع شاشة عرض وتأجير يومي',
    descriptionPlaceholder:
      'اكتب وصفًا واضحًا للمعدة أو الجهاز ومواصفاته الفنية وطريقة التشغيل وما إذا كان يشمل فنيًا أو مواد تشغيل.',
    defaultPriceUnit: 'يوم',
    priceUnits: ['ساعة', 'يوم', 'مناسبة'],
    priceIncludesPlaceholder: 'مثال: يشمل الجهاز + التوصيل + التركيب + فني عند الطلب',
    showOccasionType: false,
    capacitySectionLabel: 'الكمية أو الطاقة',
    capacityMinLabel: 'الحد الأدنى',
    capacityMaxLabel: 'الحد الأقصى',
    availabilityDaysLabel: 'أيام توفر المعدة',
    availabilityTimeLabel: 'ساعات الاستلام أو التشغيل',
    metaTitle: 'المواصفات الفنية',
    featuresTitle: 'ملحقات ومزايا التجهيز',
    otherFeaturesPlaceholder: 'مثال: كابل HDMI، حقيبة نقل، شاشة إضافية',
    metaFields: [
      {
        key: 'equipment_type',
        label: 'تصنيف المعدة',
        type: 'select',
        options: ['صوتيات', 'شاشات وعرض', 'ماكينات طعام', 'إضاءة', 'أجهزة ضيافة', 'معدات متعددة'],
      },
      { key: 'production_capacity', label: 'الطاقة أو السعة التشغيلية', type: 'text', placeholder: 'مثال: 100 كوب/ساعة' },
      { key: 'power_watts', label: 'القوة الكهربائية', type: 'text', placeholder: 'مثال: 2000 واط' },
      { key: 'operation_mode', label: 'طريقة التشغيل', type: 'select', options: ['خدمة ذاتية', 'مع فني مشغل', 'الخيارات حسب الطلب'] },
    ],
    features: [
      { id: 'ماكينة آيسكريم', icon: '🍦' },
      { id: 'ماكينة فشار', icon: '🍿' },
      { id: 'بروجكتر', icon: '📽️' },
      { id: 'شاشة عرض', icon: '🖥️' },
      { id: 'سماعات', icon: '🔊' },
      { id: 'إضاءة حفلات', icon: '🪩' },
      { id: 'مع فني تشغيل', icon: '👷' },
      { id: 'تشمل المستهلكات', icon: '📦' },
      { id: 'متوفر التوصيل', icon: '🚚' },
    ],
  },
}

const OCCASION_TYPES = [
  'عائلية',
  'تخرج',
  'زواج',
  'خطوبة',
  'عيد ميلاد',
  'مولود',
  'اجتماع عمل',
  'يوم تأسيس',
  'أخرى',
]

const DAYS = [
  { id: 'sat', label: 'السبت' },
  { id: 'sun', label: 'الأحد' },
  { id: 'mon', label: 'الاثنين' },
  { id: 'tue', label: 'الثلاثاء' },
  { id: 'wed', label: 'الأربعاء' },
  { id: 'thu', label: 'الخميس' },
  { id: 'fri', label: 'الجمعة' },
]

const COMMON_FEATURES: CategoryFeature[] = [
  { id: 'متوفر التوصيل', icon: '🚚' },
  { id: 'تكييف', icon: '❄️' },
  { id: 'موقف سيارات', icon: '🅿️' },
  { id: 'واي فاي', icon: '📶' },
  { id: 'خصم لفترة محدودة', icon: '🏷️' },
]

const CANCELLATION_POLICIES = [
  { id: 'flexible', label: 'مرنة', desc: 'استرداد كامل قبل 24 ساعة' },
  { id: 'moderate', label: 'متوسطة', desc: 'استرداد 50% قبل 48 ساعة' },
  { id: 'strict', label: 'صارمة', desc: 'لا استرداد بعد الحجز' },
  { id: 'custom', label: 'مخصصة', desc: 'حدد سياستك الخاصة' },
]

const DEPOSIT_POLICIES: {
  id: DepositPolicyType
  label: string
  desc: string
}[] = [
  { id: 'refundable', label: 'مسترد بالكامل', desc: 'يُسترد العربون بالكامل عند الإلغاء حسب الشروط' },
  { id: 'partial_refundable', label: 'استرداد جزئي', desc: 'يُسترد جزء من العربون فقط' },
  { id: 'non_refundable', label: 'غير مسترد', desc: 'العربون لا يُسترد بعد التأكيد' },
  { id: 'reschedule_only', label: 'قابل للتحويل لتاريخ آخر', desc: 'لا يُسترد نقداً لكن يمكن تحويله' },
  { id: 'custom', label: 'سياسة مخصصة', desc: 'اكتب سياسة العربون الخاصة بك' },
]

const CANCELLATION_POLICY_MAP = CANCELLATION_POLICIES.reduce<Record<string, string>>(
  (acc, policy) => {
    acc[policy.id] = `${policy.label} — ${policy.desc}`
    return acc
  },
  {}
)

const DEPOSIT_POLICY_MAP = Object.fromEntries(
  DEPOSIT_POLICIES.map((policy) => [policy.id, policy.desc])
) as Record<DepositPolicyType, string>

const CAT_MAP: Record<CategorySlug, number> = {
  chalets: 1,
  hospitality: 2,
  catering: 3,
  events: 4,
  games: 5,
  rentals: 6,
}

const CATEGORY_ID_TO_SLUG = Object.fromEntries(
  Object.entries(CAT_MAP).map(([slug, id]) => [id, slug as CategorySlug])
) as Record<number, CategorySlug>

const INITIAL: ListingFormState = {
  title: '',
  category: '',
  description: '',
  districtName: '',
  latitude: null,
  longitude: null,
  priceMin: '',
  priceMax: '',
  priceUnit: 'يوم',
  priceIncludes: '',
  occasionType: '',

  negotiable: false,
  depositRequired: false,
  depositAmount: '',
  depositPolicyType: 'refundable',
  depositPolicyNote: '',
  securityDepositRequired: false,
  securityDepositAmount: '',
  securityDepositPolicyType: 'refundable',
  securityDepositPolicyNote: '',

  capacityMin: '',
  capacityMax: '',

  availableDays: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],
  availableFrom: '08:00',
  availableTo: '23:00',

  features: [],
  additionalFeatures: [],

  cancellationPolicy: 'flexible',
  cancellationPolicyNote: '',
  postponePolicy: '',
  terms: '',

  contactWhatsapp: '966',
  contactPhone: '',
  contactMethod: 'whatsapp',

  notes: '',
  existingImages: [],
  images: [],
  coverIndex: 0,
  meta: {},
}

function StepHeader({ step, total }: { step: number; total: number }) {
  const cur = STEPS[step]

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-rose-50">
            {cur.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-gray-900 truncate">{cur.title}</h1>
            <p className="text-xs text-gray-400 font-medium">{cur.desc}</p>
          </div>
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
            {step + 1} / {total}
          </span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i <= step ? BRAND : '#e5e7eb',
                opacity: i === step ? 1 : i < step ? 0.6 : 0.25,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Lbl({
  text,
  required,
  hint,
}: {
  text: string
  required?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm font-black text-gray-700">
        {text}
        {required && <span className="text-[#f63659] mr-0.5">*</span>}
      </span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

const fld = (err?: string) =>
  `w-full bg-gray-50 border rounded-2xl px-4 py-3.5 text-sm font-medium outline-none transition-colors ${
    err
      ? 'border-red-300 bg-red-50/50'
      : 'border-gray-200 focus:border-[#f63659] focus:bg-white'
  }`

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string
  desc?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border-2 text-right transition-all ${
        value
          ? 'border-[#f63659] bg-rose-50'
          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
      }`}
    >
      <div className="min-w-0 mr-3">
        <p className={`text-sm font-black ${value ? 'text-[#f63659]' : 'text-gray-700'}`}>
          {label}
        </p>
        {desc && <p className="text-xs text-gray-400 font-medium mt-0.5">{desc}</p>}
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
          value ? 'bg-[#f63659]' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            value ? 'right-1' : 'left-1'
          }`}
        />
      </div>
    </button>
  )
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 font-bold mt-1.5">⚠ {msg}</p> : null
}

function normalizePhone(input: string) {
  return input.replace(/[^\d]/g, '')
}

function getDepositPolicyText(policyType: DepositPolicyType, note: string) {
  if (policyType === 'custom') {
    return note.trim()
  }

  return DEPOSIT_POLICY_MAP[policyType]?.trim() ?? note.trim()
}

function buildCancellationPolicyMap(): Record<string, string> {
  return CANCELLATION_POLICIES.reduce<Record<string, string>>((acc, policy) => {
    acc[policy.id] = `${policy.label} â€” ${policy.desc}`
    return acc
  }, {})
}

function getCancellationPolicyText(policyId: string, note: string) {
  if (policyId === 'custom') {
    return note.trim()
  }

  const cancellationPolicyMap = buildCancellationPolicyMap()
  return cancellationPolicyMap[policyId]?.trim() ?? note.trim()
}

function buildInitialForm(editData?: ListingEditData): ListingFormState {
  if (!editData) return INITIAL

  const policies =
    editData.policies && typeof editData.policies === 'object' && !Array.isArray(editData.policies)
      ? editData.policies
      : {}
  const metadata =
    editData.metadata && typeof editData.metadata === 'object' && !Array.isArray(editData.metadata)
      ? editData.metadata
      : {}

  const categorySlug =
    editData.category_id != null ? CATEGORY_ID_TO_SLUG[Number(editData.category_id)] ?? '' : ''
  const cancellationPolicyText = String(editData.cancellation_policy ?? '').trim()
  const matchedCancellationPolicy = CANCELLATION_POLICIES.find(
    (policy) => cancellationPolicyText === `${policy.label} — ${policy.desc}` || cancellationPolicyText === policy.desc
  )
  const bookingDepositPolicyText = String(editData.booking_deposit_policy ?? '').trim()
  const matchedBookingDepositPolicy = DEPOSIT_POLICIES.find(
    (policy) => bookingDepositPolicyText === policy.desc
  )
  const securityDepositPolicyText = String(editData.security_deposit_policy ?? '').trim()
  const matchedSecurityDepositPolicy = DEPOSIT_POLICIES.find(
    (policy) => securityDepositPolicyText === policy.desc
  )
  const additionalFeatures = metadata.additional_features
  const media = Array.isArray(editData.media)
    ? [...editData.media]
        .sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
        .map((item) => (typeof item?.url === 'string' ? item.url.trim() : ''))
        .filter(Boolean)
    : []
  const existingImages = [editData.cover_url, ...media]
    .filter((url): url is string => typeof url === 'string' && Boolean(url.trim()))
    .filter((url, index, arr) => arr.indexOf(url) === index)
  const coverIndex = existingImages.length > 0 && editData.cover_url
    ? Math.max(existingImages.indexOf(editData.cover_url), 0)
    : 0

  return {
    ...INITIAL,
    title: editData.title ?? INITIAL.title,
    category: categorySlug,
    description: editData.description ?? INITIAL.description,
    districtName: editData.district_name ?? INITIAL.districtName,
    latitude: typeof editData.latitude === 'number' ? editData.latitude : INITIAL.latitude,
    longitude: typeof editData.longitude === 'number' ? editData.longitude : INITIAL.longitude,
    priceMin: editData.price_min != null ? String(editData.price_min) : INITIAL.priceMin,
    priceMax: editData.price_max != null ? String(editData.price_max) : INITIAL.priceMax,
    occasionType: editData.occasion_type ?? INITIAL.occasionType,
    negotiable: Boolean(policies.negotiable),
    depositRequired:
      typeof editData.booking_deposit_required === 'boolean'
        ? editData.booking_deposit_required
        : Boolean(policies.depositRequired),
    depositAmount:
      editData.booking_deposit_amount != null
        ? String(editData.booking_deposit_amount)
        : policies.depositAmount != null
          ? String(policies.depositAmount)
          : INITIAL.depositAmount,
    depositPolicyType:
      matchedBookingDepositPolicy?.id ?? ((policies.depositPolicyType as DepositPolicyType | undefined) ?? 'refundable'),
    depositPolicyNote:
      matchedBookingDepositPolicy ? '' : bookingDepositPolicyText || String(policies.depositPolicyNote ?? ''),
    securityDepositRequired: Boolean(editData.security_deposit_required),
    securityDepositAmount:
      editData.security_deposit_amount != null ? String(editData.security_deposit_amount) : INITIAL.securityDepositAmount,
    securityDepositPolicyType: matchedSecurityDepositPolicy?.id ?? 'refundable',
    securityDepositPolicyNote: matchedSecurityDepositPolicy ? '' : securityDepositPolicyText,
    capacityMin: editData.capacity_min != null ? String(editData.capacity_min) : INITIAL.capacityMin,
    capacityMax: editData.capacity_max != null ? String(editData.capacity_max) : INITIAL.capacityMax,
    features: Array.isArray(editData.features) ? editData.features : INITIAL.features,
    additionalFeatures: Array.isArray(additionalFeatures) ? additionalFeatures.filter((item): item is string => typeof item === 'string') : INITIAL.additionalFeatures,
    cancellationPolicy:
      matchedCancellationPolicy?.id ?? (typeof policies.cancellationPolicy === 'string' ? policies.cancellationPolicy : 'flexible'),
    cancellationPolicyNote: matchedCancellationPolicy ? '' : cancellationPolicyText,
    postponePolicy: typeof policies.postponePolicy === 'string' ? policies.postponePolicy : INITIAL.postponePolicy,
    terms: typeof policies.terms === 'string' ? policies.terms : INITIAL.terms,
    contactWhatsapp: editData.contact_whatsapp ?? INITIAL.contactWhatsapp,
    contactPhone: editData.contact_phone ?? INITIAL.contactPhone,
    contactMethod:
      policies.contactMethod === 'call' || policies.contactMethod === 'both' || policies.contactMethod === 'whatsapp'
        ? policies.contactMethod
        : INITIAL.contactMethod,
    notes: typeof policies.notes === 'string' ? policies.notes : INITIAL.notes,
    existingImages,
    availableDays: Array.isArray(policies.availableDays)
      ? policies.availableDays.filter((item): item is string => typeof item === 'string')
      : INITIAL.availableDays,
    availableFrom: typeof policies.availableFrom === 'string' ? policies.availableFrom : INITIAL.availableFrom,
    availableTo: typeof policies.availableTo === 'string' ? policies.availableTo : INITIAL.availableTo,
    meta: Object.entries(metadata).reduce<Record<string, string>>((acc, [key, value]) => {
      if (key !== 'additional_features' && typeof value === 'string') {
        acc[key] = value
      }
      return acc
    }, {}),
    coverIndex,
  }
}

export default function AddListingForm({
  providerId,
  districtId = 1,
  editId,
  editData,
}: AddListingFormProps) {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ListingFormState>(() => buildInitialForm(editData))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [ref, setRef] = useState('')
  const [additionalFeatureDraft, setAdditionalFeatureDraft] = useState('')

  const categoryConfig = form.category ? CATEGORY_CONFIG[form.category] : null
  const categoryFeatures = categoryConfig?.features ?? []
  const categoryMeta = categoryConfig?.metaFields ?? []

  const allSelectedFeatures = useMemo(
    () => Array.from(new Set([...form.features, ...form.additionalFeatures])),
    [form.features, form.additionalFeatures]
  )

  const totalImagesCount = form.existingImages.length + form.images.length

  const newImagePreviews = useMemo(
    () => form.images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.images]
  )

  const imagePreviews = useMemo(
    () => [
      ...form.existingImages.map((url) => ({ kind: 'existing' as const, url })),
      ...newImagePreviews.map((item) => ({ kind: 'new' as const, url: item.url })),
    ],
    [form.existingImages, newImagePreviews]
  )

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [newImagePreviews])

  const set = useCallback(
    <K extends keyof ListingFormState>(key: K, val: ListingFormState[K]) => {
      setForm((f) => ({ ...f, [key]: val }))
      setErrors((e) => {
        const next = { ...e }
        delete next[key as string]
        return next
      })
    },
    []
  )

  const setMeta = useCallback((key: string, val: string) => {
    setForm((f) => ({ ...f, meta: { ...f.meta, [key]: val } }))
  }, [])

  const selectCategory = useCallback((slug: CategorySlug) => {
    const config = CATEGORY_CONFIG[slug]
    setForm((f) => ({
      ...f,
      category: slug,
      priceUnit: config.defaultPriceUnit,
      features: [],
      additionalFeatures: [],
      meta: {},
      occasionType: config.showOccasionType ? f.occasionType : '',
      capacityMin: '',
      capacityMax: '',
    }))
    setAdditionalFeatureDraft('')
    setErrors((e) => {
      const next = { ...e }
      delete next.category
      return next
    })
  }, [])

  const toggleFeature = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      features: f.features.includes(id)
        ? f.features.filter((x) => x !== id)
        : [...f.features, id],
    }))
  }, [])

  const addAdditionalFeature = useCallback(() => {
    const value = additionalFeatureDraft.trim()
    if (!value) return

    setForm((f) => {
      const existsInStructured = f.features.includes(value)
      const existsInAdditional = f.additionalFeatures.includes(value)
      if (existsInStructured || existsInAdditional) return f

      return {
        ...f,
        additionalFeatures: [...f.additionalFeatures, value].slice(0, 12),
      }
    })

    setAdditionalFeatureDraft('')
  }, [additionalFeatureDraft])

  const removeAdditionalFeature = useCallback((value: string) => {
    setForm((f) => ({
      ...f,
      additionalFeatures: f.additionalFeatures.filter((item) => item !== value),
    }))
  }, [])

  const handleAdditionalFeatureKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAdditionalFeature()
    }
  }

  const toggleDay = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(id)
        ? f.availableDays.filter((x) => x !== id)
        : [...f.availableDays, id],
    }))
  }, [])

  const validate = (): boolean => {
    const e: Record<string, string> = {}

    if (step === 0) {
      if (!form.category) e.category = 'اختر فئة الإعلان'
      if (!form.title.trim()) e.title = 'عنوان الإعلان مطلوب'
      if (form.description.trim().length < 30) {
        e.description = 'الوصف قصير — أضف على الأقل 30 حرفاً'
      }
    }

    if (step === 1) {
      if (form.latitude == null || form.longitude == null) {
        e.location = 'حدد الموقع على الخريطة'
      }
    }

    if (step === 2) {
      if (!form.priceMin || Number.isNaN(Number(form.priceMin))) {
        e.priceMin = 'أدخل سعراً صحيحاً'
      }
      if (form.priceMax && Number(form.priceMax) < Number(form.priceMin)) {
        e.priceMax = 'السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى'
      }
      if (
        form.capacityMin &&
        form.capacityMax &&
        Number(form.capacityMax) < Number(form.capacityMin)
      ) {
        e.capacityMax = 'الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى'
      }
      if (form.depositRequired && !form.depositAmount) {
        e.depositAmount = 'أدخل قيمة العربون'
      }

      if (form.securityDepositRequired && !form.securityDepositAmount) {
        e.securityDepositAmount = 'أدخل قيمة التأمين'
      }
    }

    if (step === 4) {
      if (form.depositRequired) {
        if (!form.depositAmount) e.depositAmount = 'أدخل قيمة العربون'
        if (form.depositPolicyType === 'custom' && !form.depositPolicyNote.trim()) {
          e.depositPolicyNote = 'اكتب سياسة العربون المخصصة'
        }
      }

      if (form.securityDepositRequired) {
        if (!form.securityDepositAmount) e.securityDepositAmount = 'أدخل قيمة التأمين'
        if (form.securityDepositPolicyType === 'custom' && !form.securityDepositPolicyNote.trim()) {
          e.securityDepositPolicyNote = 'اكتب شروط التأمين المخصصة'
        }
      }

      if (form.cancellationPolicy === 'custom' && !form.cancellationPolicyNote.trim()) {
        e.cancellationPolicyNote = 'اكتب سياسة الإلغاء المخصصة'
      }
    }

    if (step === 5) {
      if (totalImagesCount < 3) {
        e.images = 'أضف 3 صور على الأقل'
      }
      if (!/^966\d{9}$/.test(normalizePhone(form.contactWhatsapp))) {
        e.contactWhatsapp = 'رقم غير صحيح — مثال: 9665XXXXXXXX'
      }
      if (
        form.contactPhone &&
        !/^966\d{9}$/.test(normalizePhone(form.contactPhone))
      ) {
        e.contactPhone = 'رقم الهاتف غير صحيح — مثال: 9665XXXXXXXX'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validate()) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    )
    const remainingSlots = Math.max(0, 8 - totalImagesCount)
    set('images', [...form.images, ...incoming].slice(0, form.images.length + remainingSlots))
  }

  const removeImage = (index: number) => {
    if (index < form.existingImages.length) {
      const existingImages = form.existingImages.filter((_, i) => i !== index)
      set('existingImages', existingImages)
      if (form.coverIndex >= existingImages.length + form.images.length) set('coverIndex', 0)
      return
    }

    const newImageIndex = index - form.existingImages.length
    const imgs = form.images.filter((_, i) => i !== newImageIndex)
    set('images', imgs)
    if (form.coverIndex >= form.existingImages.length + imgs.length) set('coverIndex', 0)
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!form.category) return

    setSubmitting(true)

    try {
      const policies = {
        negotiable: form.negotiable,
        depositRequired: form.depositRequired,
        depositAmount: form.depositRequired ? Number(form.depositAmount || 0) : 0,
        depositPolicyType: form.depositRequired ? form.depositPolicyType : null,
        depositPolicyNote: form.depositRequired ? form.depositPolicyNote : '',
        cancellationPolicy: form.cancellationPolicy,
        postponePolicy: form.postponePolicy,
        terms: form.terms,
        availableDays: form.availableDays,
        availableFrom: form.availableFrom,
        availableTo: form.availableTo,
        contactMethod: form.contactMethod,
        notes: form.notes,
        priceIncludes: form.priceIncludes,
      }

      const metadata = {
        ...form.meta,
        additional_features: form.additionalFeatures,
      }

      const fd = new FormData()
      fd.append('provider_id', providerId)
      fd.append('title', form.title.trim())
      fd.append('description', form.description.trim())
      fd.append('category_id', String(CAT_MAP[form.category]))
      fd.append('district_id', String(districtId))
      fd.append('district_name', form.districtName)
      fd.append('latitude', String(form.latitude ?? ''))
      fd.append('longitude', String(form.longitude ?? ''))
      fd.append('price_min', form.priceMin)
      fd.append('price_max', form.priceMax || form.priceMin)
      fd.append('price_label', `يبدأ من ${form.priceMin} ر.س / ${form.priceUnit}`)
      fd.append('capacity_min', form.capacityMin)
      fd.append('capacity_max', form.capacityMax || form.capacityMin)
      fd.append('occasion_type', form.occasionType)
      fd.append('contact_whatsapp', normalizePhone(form.contactWhatsapp))
      fd.append('contact_phone', normalizePhone(form.contactPhone))
      fd.append('features', JSON.stringify(allSelectedFeatures))
      fd.append('policies', JSON.stringify(policies))
      fd.append('metadata', JSON.stringify(metadata))
      fd.append('existing_images', JSON.stringify(form.existingImages))
      fd.append('booking_deposit_required', String(form.depositRequired))
      fd.append(
        'booking_deposit_amount',
        form.depositRequired ? String(Number(form.depositAmount || 0)) : ''
      )
      fd.append(
        'booking_deposit_policy',
        form.depositRequired ? getDepositPolicyText(form.depositPolicyType, form.depositPolicyNote) : ''
      )
      fd.append('security_deposit_required', String(form.securityDepositRequired))
      fd.append(
        'security_deposit_amount',
        form.securityDepositRequired ? String(Number(form.securityDepositAmount || 0)) : ''
      )
      fd.append(
        'security_deposit_policy',
        form.securityDepositRequired
          ? getDepositPolicyText(form.securityDepositPolicyType, form.securityDepositPolicyNote)
          : ''
      )
      fd.append(
        'cancellation_policy',
        getCancellationPolicyText(form.cancellationPolicy, form.cancellationPolicyNote)
      )
      fd.append('cover_index', String(form.coverIndex))

      form.images.forEach((img) => fd.append('images', img))

      const res = await fetch(
        editId ? `/api/listings/${editId}` : '/api/listings/add',
        {
          method: editId ? 'PUT' : 'POST',
          body: fd,
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrors({ submit: data.error || 'حدث خطأ غير متوقع' })
        setSubmitting(false)
        return
      }

      setRef(data.ref ?? data.listing_id)
      setDone(true)
    } catch {
      setErrors({ submit: 'تعذر الاتصال بالسيرفر' })
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="max-w-sm w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 stroke-green-500 stroke-2 fill-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-3">
            تم استلام إعلانك! 🎉
          </h1>

          <p className="text-gray-500 font-medium mb-6 leading-relaxed">
            إعلانك قيد المراجعة.
            <br />
            سيتم التواصل معك خلال 24 ساعة.
          </p>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6">
            <p className="text-xs text-gray-400 font-bold mb-2">رقمك المرجعي</p>
            <p className="text-4xl font-black" style={{ color: BRAND }}>
              {ref}
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl font-black text-white text-lg"
            style={{ backgroundColor: BRAND }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <StepHeader step={step} total={STEPS.length} />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">
                  اختر نوع إعلانك
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  ستتغير الحقول والأمثلة والمواصفات حسب الفئة المختارة
                </p>
              </div>

              <div>
                <Lbl text="فئة الإعلان" required />
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_ORDER.map((slug) => {
                    const cat = CATEGORY_CONFIG[slug]
                    const active = form.category === slug

                    return (
                      <button
                        key={slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectCategory(slug)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-right transition-all ${
                          active
                            ? 'border-[#f63659] bg-rose-50 shadow-sm'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{cat.icon}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-black truncate ${
                              active ? 'text-[#f63659]' : 'text-gray-800'
                            }`}
                          >
                            {cat.label}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium truncate">
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <Err msg={errors.category} />
              </div>

              {categoryConfig && (
                <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
                      {categoryConfig.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-gray-900">
                        {categoryConfig.label}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-6">
                        {categoryConfig.desc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Lbl text="عنوان الإعلان" required hint={`${form.title.length}/80`} />
                <input
                  type="text"
                  maxLength={80}
                  placeholder={
                    categoryConfig?.titlePlaceholder ??
                    'اختر الفئة أولاً ليظهر لك مثال مناسب'
                  }
                  className={fld(errors.title)}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
                <Err msg={errors.title} />
              </div>

              <div>
                <Lbl text="وصف الإعلان" required hint={`${form.description.length}/1000`} />
                <textarea
                  rows={5}
                  maxLength={1000}
                  placeholder={
                    categoryConfig?.descriptionPlaceholder ??
                    'اختر الفئة أولاً لتظهر لك صياغة وصف مناسبة'
                  }
                  className={`${fld(errors.description)} resize-none`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
                <Err msg={errors.description} />
              </div>

              {categoryConfig?.showOccasionType && (
                <div>
                  <Lbl text="نوع المناسبة" hint="اختياري" />
                  <div className="flex flex-wrap gap-2">
                    {OCCASION_TYPES.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() =>
                          set('occasionType', form.occasionType === o ? '' : o)
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          form.occasionType === o
                            ? 'border-[#f63659] bg-rose-50 text-[#f63659]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">الموقع</h2>
                <p className="text-sm text-gray-400 font-medium">
                  حدّد موقعك بدقة — هذا يساعد العميل على فهم النطاق الجغرافي للخدمة
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <p className="text-xs text-gray-500 font-bold mb-0.5">المدينة</p>
                <p className="text-sm font-black text-gray-900">
                  جدة، المملكة العربية السعودية 🇸🇦
                </p>
              </div>

              <div>
                <Lbl text="الموقع على الخريطة" required />
                <MapPicker
                  onSelect={({ districtName, latitude, longitude }) => {
                    set('districtName', districtName)
                    set('latitude', latitude)
                    set('longitude', longitude)
                  }}
                  initialLat={form.latitude ?? undefined}
                  initialLng={form.longitude ?? undefined}
                  initialDistrict={form.districtName}
                />
                <Err msg={errors.location} />
              </div>

              {form.districtName && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">الحي المحدد</p>
                    <p className="text-sm font-black text-gray-900">
                      {form.districtName}، جدة
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">التسعير</h2>
                <p className="text-sm text-gray-400 font-medium">
                  السعر الواضح والمنطقي يرفع جودة الطلبات الواردة
                </p>
              </div>

              <div>
                <Lbl text="السعر" required />
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="من"
                      className={fld(errors.priceMin)}
                      value={form.priceMin}
                      onChange={(e) => set('priceMin', e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      ر.س
                    </span>
                  </div>

                  <span className="text-gray-400 font-bold shrink-0">—</span>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="إلى"
                      className={fld(errors.priceMax)}
                      value={form.priceMax}
                      onChange={(e) => set('priceMax', e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      ر.س
                    </span>
                  </div>

                  <select
                    className="w-28 bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-2xl px-3 py-3.5 text-sm font-medium outline-none shrink-0"
                    value={form.priceUnit}
                    onChange={(e) => set('priceUnit', e.target.value)}
                  >
                    {(categoryConfig?.priceUnits ?? ['ساعة', 'يوم', 'ليلة', 'مناسبة', 'باقة']).map(
                      (u) => (
                        <option key={u}>{u}</option>
                      )
                    )}
                  </select>
                </div>
                <Err msg={errors.priceMin} />
                <Err msg={errors.priceMax} />
              </div>

              <div>
                <Lbl text="ما يشمله السعر" hint="اختياري" />
                <textarea
                  rows={3}
                  placeholder={
                    categoryConfig?.priceIncludesPlaceholder ??
                    'اشرح ماذا يشمل السعر الأساسي'
                  }
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-medium outline-none resize-none"
                  value={form.priceIncludes}
                  onChange={(e) => set('priceIncludes', e.target.value)}
                />
              </div>

              <div>
                <Lbl
                  text={categoryConfig?.capacitySectionLabel ?? 'السعة أو النطاق'}
                  hint="اختياري"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1.5">
                      {categoryConfig?.capacityMinLabel ?? 'الحد الأدنى'}
                    </p>
                    <input
                      type="number"
                      min="0"
                      placeholder="1"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-xl px-3 py-3 text-sm font-medium outline-none"
                      value={form.capacityMin}
                      onChange={(e) => set('capacityMin', e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1.5">
                      {categoryConfig?.capacityMaxLabel ?? 'الحد الأقصى'}
                    </p>
                    <input
                      type="number"
                      min="0"
                      placeholder="50"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-xl px-3 py-3 text-sm font-medium outline-none"
                      value={form.capacityMax}
                      onChange={(e) => set('capacityMax', e.target.value)}
                    />
                  </div>
                </div>
                <Err msg={errors.capacityMax} />
              </div>

              <div className="flex flex-col gap-2.5">
                <Toggle
                  label="قابل للتفاوض"
                  desc="يمكن للعميل مناقشة السعر أو الباقة"
                  value={form.negotiable}
                  onChange={(v) => set('negotiable', v)}
                />
                <Toggle
                  label="يتطلب عربونًا"
                  desc="إظهار وجود عربون قبل تأكيد الحجز أو التنفيذ"
                  value={form.depositRequired}
                  onChange={(v) => set('depositRequired', v)}
                />
                <Toggle
                  label="يتطلب تأمينًا"
                  desc="إظهار مبلغ التأمين وشروط استرداده ضمن صفحة التفاصيل"
                  value={form.securityDepositRequired}
                  onChange={(v) => set('securityDepositRequired', v)}
                />
              </div>

              {form.depositRequired && (
                <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-4">
                  <Lbl text="قيمة العربون" required />
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className={fld(errors.depositAmount)}
                      value={form.depositAmount}
                      onChange={(e) => set('depositAmount', e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      ر.س
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-2">
                    ستظهر قيمة العربون أيضًا داخل قسم السياسات ليتم ربطها بسياسة الإلغاء.
                  </p>
                  <Err msg={errors.depositAmount} />
                </div>
              )}

              {form.securityDepositRequired && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-4">
                  <Lbl text="قيمة التأمين" required />
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className={fld(errors.securityDepositAmount)}
                      value={form.securityDepositAmount}
                      onChange={(e) => set('securityDepositAmount', e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      ر.س
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-2">
                    سيظهر مبلغ التأمين مع شروطه بشكل مستقل عن العربون داخل صفحة الإعلان.
                  </p>
                  <Err msg={errors.securityDepositAmount} />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">
                  المواصفات والمميزات
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  حقول خاصة بفئة {categoryConfig?.label ?? 'الإعلان'} مع إمكانية إضافة مميزات غير مدرجة
                </p>
              </div>

              {categoryMeta.length > 0 && (
                <div>
                  <Lbl text={categoryConfig?.metaTitle ?? 'الحقول الخاصة'} />
                  <div className="grid grid-cols-2 gap-4">
                    {categoryMeta.map((field) => (
                      <div
                        key={field.key}
                        className={field.type === 'select' ? 'col-span-2' : ''}
                      >
                        <Lbl text={field.label} hint={field.hint} />
                        {field.type === 'select' ? (
                          <select
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-2xl px-4 py-3.5 text-sm font-medium outline-none"
                            value={form.meta[field.key] ?? ''}
                            onChange={(e) => setMeta(field.key, e.target.value)}
                          >
                            <option value="">اختر...</option>
                            {field.options?.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            min={field.type === 'number' ? '0' : undefined}
                            placeholder={field.placeholder}
                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-2xl px-4 py-3.5 text-sm font-medium outline-none"
                            value={form.meta[field.key] ?? ''}
                            onChange={(e) => setMeta(field.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryFeatures.length > 0 && (
                <div>
                  <Lbl text={categoryConfig?.featuresTitle ?? 'المميزات الخاصة'} />
                  <div className="grid grid-cols-2 gap-2">
                    {categoryFeatures.map((feature) => {
                      const active = form.features.includes(feature.id)

                      return (
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() => toggleFeature(feature.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-right transition-all ${
                            active
                              ? 'border-[#f63659] bg-rose-50 shadow-sm'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-lg">{feature.icon}</span>
                          <span
                            className={`text-xs font-bold ${
                              active ? 'text-[#f63659]' : 'text-gray-700'
                            }`}
                          >
                            {feature.id}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <Lbl text="مميزات عامة إضافية" />
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES.map((feature) => {
                    const active = form.features.includes(feature.id)

                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => toggleFeature(feature.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                          active
                            ? 'border-[#f63659] bg-rose-50 text-[#f63659]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        <span>{feature.icon}</span>
                        <span>{feature.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4">
                <Lbl text="مميزات أخرى" hint="أضف أي ميزة غير موجودة في القوائم السابقة" />
                <div className="flex gap-2 items-stretch">
                  <input
                    type="text"
                    value={additionalFeatureDraft}
                    onChange={(e) => setAdditionalFeatureDraft(e.target.value)}
                    onKeyDown={handleAdditionalFeatureKeyDown}
                    placeholder={
                      categoryConfig?.otherFeaturesPlaceholder ??
                      'أضف ميزة أخرى'
                    }
                    className="flex-1 bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-2xl px-4 py-3.5 text-sm font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAdditionalFeature}
                    className="px-5 rounded-2xl text-white font-black shadow-sm"
                    style={{ backgroundColor: BRAND }}
                  >
                    إضافة
                  </button>
                </div>

                {form.additionalFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {form.additionalFeatures.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => removeAdditionalFeature(feature)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-rose-200 bg-rose-50 text-[#f63659] text-xs font-black"
                      >
                        <span>{feature}</span>
                        <span className="text-sm leading-none">×</span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 font-medium mt-3">
                  يمكنك إضافة حتى 12 ميزة مخصصة. ستُحفظ هذه المميزات مع الإعلان وتُرسل ضمن البيانات.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">
                  السياسات والتشغيل
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  صياغة الشروط بوضوح تقلل النزاعات وترفع الثقة
                </p>
              </div>

              <div>
                <Lbl text={categoryConfig?.availabilityDaysLabel ?? 'أيام التوفر'} />
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS.map((day) => {
                    const active = form.availableDays.includes(day.id)

                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${
                          active
                            ? 'border-[#f63659] bg-rose-50 text-[#f63659]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>

                <Lbl text={categoryConfig?.availabilityTimeLabel ?? 'الساعات'} hint="اختياري" />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-500 mb-1">من</p>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-xl px-3 py-2.5 text-sm outline-none"
                      value={form.availableFrom}
                      onChange={(e) => set('availableFrom', e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-500 mb-1">إلى</p>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] rounded-xl px-3 py-2.5 text-sm outline-none"
                      value={form.availableTo}
                      onChange={(e) => set('availableTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Lbl text="سياسة الإلغاء" />
                <div className="flex flex-col gap-2">
                  {CANCELLATION_POLICIES.map((policy) => {
                    const active = form.cancellationPolicy === policy.id

                    return (
                      <button
                        key={policy.id}
                        type="button"
                        onClick={() => set('cancellationPolicy', policy.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-right transition-all ${
                          active
                            ? 'border-[#f63659] bg-rose-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm font-black ${
                              active ? 'text-[#f63659]' : 'text-gray-800'
                            }`}
                          >
                            {policy.label}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">{policy.desc}</p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            active ? 'border-[#f63659] bg-[#f63659]' : 'border-gray-300'
                          }`}
                        >
                          {active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {form.cancellationPolicy === 'custom' && (
                  <div className="mt-4">
                    <Lbl text="نص سياسة الإلغاء" required />
                    <textarea
                      rows={3}
                      placeholder="مثال: يمكن الإلغاء قبل 48 ساعة مع استرداد العربون حسب الشروط."
                      className={`${fld(errors.cancellationPolicyNote)} resize-none`}
                      value={form.cancellationPolicyNote}
                      onChange={(e) => set('cancellationPolicyNote', e.target.value)}
                    />
                    <Err msg={errors.cancellationPolicyNote} />
                  </div>
                )}
              </div>

              {form.depositRequired ? (
                <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">سياسة العربون</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        اربط قيمة العربون مباشرة بطريقة استرداده أو تحويله عند الإلغاء
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-white border border-rose-100 text-center shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold">العربون</p>
                      <p className="text-sm font-black text-[#f63659]">
                        {form.depositAmount ? `${form.depositAmount} ر.س` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Lbl text="قيمة العربون" required />
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className={fld(errors.depositAmount)}
                        value={form.depositAmount}
                        onChange={(e) => set('depositAmount', e.target.value)}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        ر.س
                      </span>
                    </div>
                    <Err msg={errors.depositAmount} />
                  </div>

                  <div className="flex flex-col gap-2">
                    {DEPOSIT_POLICIES.map((policy) => {
                      const active = form.depositPolicyType === policy.id

                      return (
                        <button
                          key={policy.id}
                          type="button"
                          onClick={() => set('depositPolicyType', policy.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-right transition-all ${
                            active
                              ? 'border-[#f63659] bg-white shadow-sm'
                              : 'border-gray-100 bg-white/70 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <p
                              className={`text-sm font-black ${
                                active ? 'text-[#f63659]' : 'text-gray-800'
                              }`}
                            >
                              {policy.label}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">{policy.desc}</p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              active ? 'border-[#f63659] bg-[#f63659]' : 'border-gray-300'
                            }`}
                          >
                            {active && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4">
                    <Lbl text="تفصيل سياسة العربون" hint="اختياري أو إلزامي عند اختيار سياسة مخصصة" />
                    <textarea
                      rows={3}
                      placeholder="مثال: العربون غير مسترد قبل 24 ساعة، ويمكن تحويله لموعد آخر مرة واحدة حسب التوفر."
                      className={`${fld(errors.depositPolicyNote)} resize-none`}
                      value={form.depositPolicyNote}
                      onChange={(e) => set('depositPolicyNote', e.target.value)}
                    />
                    <Err msg={errors.depositPolicyNote} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-black text-gray-700">لا يوجد عربون</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    إذا كان إعلانك يتطلب عربونًا، فعّله من خطوة التسعير ليظهر هنا بشكل كامل.
                  </p>
                </div>
              )}

              {form.securityDepositRequired ? (
                <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">شروط التأمين</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        وضّح متى يُسترد التأمين أو الحالات التي قد يُقتطع فيها.
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-white border border-amber-100 text-center shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold">التأمين</p>
                      <p className="text-sm font-black text-amber-600">
                        {form.securityDepositAmount ? `${form.securityDepositAmount} ر.س` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Lbl text="قيمة التأمين" required />
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className={fld(errors.securityDepositAmount)}
                        value={form.securityDepositAmount}
                        onChange={(e) => set('securityDepositAmount', e.target.value)}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        ر.س
                      </span>
                    </div>
                    <Err msg={errors.securityDepositAmount} />
                  </div>

                  <div className="flex flex-col gap-2">
                    {DEPOSIT_POLICIES.map((policy) => {
                      const active = form.securityDepositPolicyType === policy.id

                      return (
                        <button
                          key={`security-${policy.id}`}
                          type="button"
                          onClick={() => set('securityDepositPolicyType', policy.id)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-right transition-all ${
                            active
                              ? 'border-amber-400 bg-white shadow-sm'
                              : 'border-gray-100 bg-white/70 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <p
                              className={`text-sm font-black ${
                                active ? 'text-amber-600' : 'text-gray-800'
                              }`}
                            >
                              {policy.label}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">{policy.desc}</p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              active ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                            }`}
                          >
                            {active && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4">
                    <Lbl text="تفصيل شروط التأمين" hint="اختياري أو إلزامي عند اختيار سياسة مخصصة" />
                    <textarea
                      rows={3}
                      placeholder="مثال: يُسترد التأمين بعد التحقق من سلامة الموقع وعدم وجود تلفيات."
                      className={`${fld(errors.securityDepositPolicyNote)} resize-none`}
                      value={form.securityDepositPolicyNote}
                      onChange={(e) => set('securityDepositPolicyNote', e.target.value)}
                    />
                    <Err msg={errors.securityDepositPolicyNote} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-black text-gray-700">لا يوجد تأمين</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    فعّل التأمين من خطوة التسعير إذا كان المكان يتطلب مبلغًا مستردًا أو مشروطًا.
                  </p>
                </div>
              )}

              <div>
                <Lbl text="سياسة التأجيل" hint="اختياري" />
                <textarea
                  rows={2}
                  placeholder="مثال: يمكن التأجيل قبل 48 ساعة مرة واحدة حسب التوفر"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-medium outline-none resize-none"
                  value={form.postponePolicy}
                  onChange={(e) => set('postponePolicy', e.target.value)}
                />
              </div>

              <div>
                <Lbl text="الشروط والأحكام" hint="اختياري" />
                <textarea
                  rows={3}
                  placeholder="مثال: يمنع الإلغاء بعد التأكيد النهائي — يتحمل العميل أي تلفيات — الالتزام بوقت التسليم"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-medium outline-none resize-none"
                  value={form.terms}
                  onChange={(e) => set('terms', e.target.value)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-black text-amber-700">
                  💡 وضّح ما يحدث للعربون عند الإلغاء أو التأجيل بشكل صريح — هذا يقلل الخلافات ويزيد الثقة.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-0.5">
                  الوسائط والتواصل
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  الصور الاحترافية وبيانات التواصل الواضحة ترفع معدل التواصل
                </p>
              </div>

              <div>
                <Lbl text="صور الإعلان" required hint={`${totalImagesCount} / 8`} />
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((item, index) => (
                    <div
                      key={item.url}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group"
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />

                      {form.coverIndex === index && (
                        <div
                          className="absolute top-1.5 right-1.5 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: BRAND }}
                        >
                          غلاف
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full bg-black/65 text-white text-sm font-black flex items-center justify-center hover:bg-red-500 transition-colors"
                        aria-label="حذف الصورة"
                      >
                        ×
                      </button>

                      <div className="absolute inset-x-0 bottom-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => set('coverIndex', index)}
                          className="bg-white text-[10px] font-black px-2 py-1 rounded-lg text-gray-700"
                        >
                          غلاف
                        </button>
                      </div>
                    </div>
                  ))}

                  {totalImagesCount < 8 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#f63659] hover:bg-rose-50 transition-all">
                      <span className="text-3xl">📷</span>
                      <span className="text-[10px] font-black text-gray-400">
                        أضف صورة
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImages}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-medium mt-2">
                  الحد الأدنى 3 صور — اختر صورة الغلاف التي تمثل إعلانك بأفضل شكل
                </p>
                <Err msg={errors.images} />
              </div>

              <div>
                <Lbl text="رقم الواتساب" required />
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="9665XXXXXXXX"
                  className={`${fld(errors.contactWhatsapp)} text-left`}
                  value={form.contactWhatsapp}
                  onChange={(e) => set('contactWhatsapp', normalizePhone(e.target.value))}
                />
                <Err msg={errors.contactWhatsapp} />
              </div>

              <div>
                <Lbl text="رقم الهاتف للمكالمات" hint="اختياري" />
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="9665XXXXXXXX"
                  className={`${fld(errors.contactPhone)} text-left`}
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', normalizePhone(e.target.value))}
                />
                <Err msg={errors.contactPhone} />
              </div>

              <div>
                <Lbl text="طريقة التواصل المفضلة" />
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'whatsapp', label: 'واتساب', icon: '💬' },
                    { id: 'call', label: 'مكالمة', icon: '📞' },
                    { id: 'both', label: 'كلاهما', icon: '📱' },
                  ].map((method) => {
                    const active = form.contactMethod === method.id

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => set('contactMethod', method.id as ContactMethod)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-[#f63659] bg-rose-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span
                          className={`text-[11px] font-black ${
                            active ? 'text-[#f63659]' : 'text-gray-600'
                          }`}
                        >
                          {method.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Lbl text="ملاحظات إضافية" hint="اختياري" />
                <textarea
                  rows={3}
                  placeholder="أي ملاحظات مهمة للعميل قبل التواصل أو الحجز"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#f63659] focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-medium outline-none resize-none"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-black text-gray-500 mb-3">✅ مراجعة سريعة</p>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                  {[
                    { label: 'الإعلان', value: form.title },
                    { label: 'الفئة', value: categoryConfig?.label },
                    { label: 'الموقع', value: form.districtName ? `${form.districtName}، جدة` : '—' },
                    { label: 'السعر', value: form.priceMin ? `${form.priceMin} ر.س / ${form.priceUnit}` : '—' },
                    { label: 'العربون', value: form.depositRequired ? `${form.depositAmount || 0} ر.س` : 'لا يوجد' },
                    { label: 'المميزات', value: allSelectedFeatures.length > 0 ? `${allSelectedFeatures.length} ميزة` : '—' },
                    { label: 'الصور', value: `${totalImagesCount} صورة` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-[10px] text-gray-400 font-bold block">
                        {label}
                      </span>
                      <span className="text-xs text-gray-700 font-black truncate block">
                        {value || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <p className="text-sm text-red-600 font-black">⚠️ {errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-black text-gray-700 hover:border-gray-300 transition-all"
            >
              ← رجوع
            </button>
          )}

          <button
            type="button"
            onClick={step < STEPS.length - 1 ? next : handleSubmit}
            disabled={submitting}
            className="flex-[2] py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND, boxShadow: `0 6px 20px ${BRAND}35` }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                جاري الإرسال...
              </>
            ) : step < STEPS.length - 1 ? (
              'التالي ←'
            ) : (
              '🚀 إرسال للمراجعة'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
