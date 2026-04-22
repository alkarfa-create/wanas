'use client'

export default function WensWhatsAppCTA({
  phoneE164Digits,
  listingId,
  listingTitle,
}: {
  phoneE164Digits: string
  listingId: string
  listingTitle: string
}) {
  const msg = encodeURIComponent(
    `السلام عليكم\nأنا عميل من منصة ونس 🌙\nرقم الطلب: WN-${listingId}\nأرغب بالاستفسار عن: ${listingTitle}\n`
  )
  const href = `https://wa.me/${phoneE164Digits}?text=${msg}`

  return (
    <div className="sticky bottom-0 w-full bg-white border-t border-gray-100 px-4 py-3 flex justify-center z-[80] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="w-full max-w-[640px] flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-black rounded-full px-4 py-3.5 shadow-lg hover:-translate-y-px hover:brightness-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <span className="text-xs font-extrabold bg-white/20 px-2.5 py-1.5 rounded-full">
          WhatsApp
        </span>
        تواصل عبر واتساب
      </a>
    </div>
  )
}
