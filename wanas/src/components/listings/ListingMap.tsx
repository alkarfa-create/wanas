'use client'

import { useEffect, useRef } from 'react'

interface ListingMapProps {
  latitude: number
  longitude: number
  title: string
}

export default function ListingMap({ latitude, longitude, title }: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loadMap = async () => {
      const L = (await import('leaflet')).default

      // Dynamically inject Leaflet CSS into the <head>
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 19,
        }
      ).addTo(map)

      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 40px; height: 40px;
            background: #f63659;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(246,54,89,0.4);
          ">
            <div style="
              position: absolute; inset: 0;
              display: flex; align-items: center; justify-content: center;
              transform: rotate(45deg);
              font-size: 16px;
            ">🏡</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; text-align: right; direction: rtl; padding: 4px 0;">
            <strong style="font-size: 13px;">${title}</strong>
          </div>
        `)

      mapInstanceRef.current = map
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, title])

  return (
    <div>
      <h2 className="text-base font-black text-gray-900 mb-3">الموقع</h2>
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden border border-gray-100"
        style={{ height: '280px' }}
      />
      <p className="text-xs text-gray-400 mt-2 font-medium text-center">
        الموقع تقريبي للحفاظ على خصوصية المزود
      </p>
    </div>
  )
}