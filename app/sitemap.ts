import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = ['/', '/services', '/projects'].map((r) => ({
        url: `https://nexora.ro${r}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));
    // TODO: trage din API slug‑urile pentru servicii/proiecte și mapează-le aici.
    return [...staticRoutes];
}
