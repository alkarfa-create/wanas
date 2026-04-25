// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/profile/', '/add-listing'],
            },
        ],
        sitemap: 'https://wanas.sa/sitemap.xml',
    }
}
