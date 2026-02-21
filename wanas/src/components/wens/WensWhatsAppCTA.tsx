"use client";

export default function WensWhatsAppCTA({
    phoneE164Digits,
    listingId,
    listingTitle,
}: {
    phoneE164Digits: string; // مثل: 9665xxxxxxx بدون +
    listingId: string;
    listingTitle: string;
}) {
    const msg = encodeURIComponent(
        `السلام عليكم\nأنا عميل من منصة ونس 🌙\nرقم الطلب: WN-${listingId}\nأرغب بالاستفسار عن: ${listingTitle}\n`
    );

    const href = `https://wa.me/${phoneE164Digits}?text=${msg}`;

    return (
        <div className="ctaWrap" role="contentinfo" aria-label="التواصل مع المزود">
            <a className="ctaBtn" href={href} target="_blank" rel="noreferrer">
                <span className="waDot" aria-hidden="true">WhatsApp</span>
                تواصل عبر واتساب
            </a>

            <style jsx>{`
        .ctaWrap {
          position: sticky;
          bottom: 0;
          width: 100%;
          background: #ffffff;
          border-top: 1px solid #EBEBEB;
          padding: 12px 16px;
          display: flex;
          justify-content: center;
          z-index: 80;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.05); /* Added shadow for better separation */
        }

        .ctaBtn {
          width: min(640px, 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #25D366;
          color: #ffffff;
          text-decoration: none;
          font-weight: 900;
          border-radius: 999px;
          padding: 14px 16px;
          transition: transform 0.15s ease, filter 0.15s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }

        .ctaBtn:hover {
          transform: translateY(-1px);
          filter: brightness(0.97);
        }

        .ctaBtn:focus-visible {
          outline: 2px solid rgba(60,36,132,0.35);
          outline-offset: 2px;
        }

        .waDot {
          font-weight: 800;
          font-size: 12px;
          background: rgba(255,255,255,0.18);
          padding: 6px 10px;
          border-radius: 999px;
        }
      `}</style>
        </div>
    );
}
