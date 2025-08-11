import { Metadata } from 'next'

interface SEOProps {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    url?: string
    type?: 'website' | 'article'
    publishedTime?: string
    modifiedTime?: string
    authors?: string[]
    section?: string
}

export function generateSEO({
                                title,
                                description = "Nexora - Modern web solutions for the next generation. Build, deploy, and scale your applications with our cutting-edge platform.",
                                keywords = ['nexora', 'web development', 'modern applications', 'next generation', 'platform', 'servicii IT', 'dezvoltare web', 'design', 'marketing digital', 'freelanceri România', 'aplicații mobile', 'SEO', 'WordPress', 'React', 'prestatori IT'],
                                image = "/og-image.jpg",
                                url,
                                type = "website",
                                publishedTime,
                                modifiedTime,
                                authors,
                                section,
                            }: SEOProps = {}): Metadata {
    const siteTitle = "Nexora"
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexora.dev"
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl
    const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`

    return {
        title: fullTitle,
        description,
        keywords: keywords.join(', '),
        authors: authors ? authors.map(name => ({ name })) : [{ name: 'Nexora Team' }],
        creator: 'Nexora',
        publisher: 'Nexora',
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: fullUrl,
            languages: {
                'ro': '/ro',
                'en': '/en',
            },
        },
        openGraph: {
            title: fullTitle,
            description,
            url: fullUrl,
            siteName: siteTitle,
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: fullTitle,
                },
            ],
            locale: 'ro_RO',
            type: type,
            ...(type === 'article' && publishedTime && {
                publishedTime,
                modifiedTime,
                authors,
                section,
            }),
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [fullImage],
            creator: '@nexora',
            site: '@nexora',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        verification: {
            google: process.env.GOOGLE_VERIFICATION_ID,
            yandex: process.env.YANDEX_VERIFICATION_ID,
            yahoo: process.env.YAHOO_VERIFICATION_ID,
        },
    }
}

export function generateStructuredData(data: {
    type: 'Organization' | 'WebSite' | 'Article' | 'BreadcrumbList' | 'FAQPage'
    [key: string]: any
}) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexora.dev"

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': data.type,
        ...data,
    }

    if (data.type === 'Organization') {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Nexora',
            url: baseUrl,
            logo: `${baseUrl}/logo.webp`,
            description: 'Modern web solutions for the next generation',
            foundingDate: '2024',
            sameAs: [
                'https://twitter.com/nexora',
                'https://linkedin.com/company/nexora',
                'https://github.com/nexora',
            ],
            contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+40-21-000-0000',
                contactType: 'customer service',
                areaServed: 'RO',
                availableLanguage: ['Romanian', 'English'],
            },
        }
    }

    if (data.type === 'WebSite') {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Nexora',
            url: baseUrl,
            description: 'Modern web solutions for the next generation',
            potentialAction: {
                '@type': 'SearchAction',
                target: `${baseUrl}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        }
    }

    return structuredData
}
