import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: '*', allow: '/' },
        sitemap: 'https://nexora.ro/sitemap.xml',
        host: 'https://nexora.ro',
    };
}
