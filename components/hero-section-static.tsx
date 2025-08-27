import HeroSectionClient from "@/components/hero-section.client";

export const revalidate = false;
export const dynamic = "force-static";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Rocket,
    Sparkles,
    Target,
    Play,
    Users,
    CheckCircle,
    Star,
    Clock,
    Globe,
} from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

const POPULAR_TAGS = ["React", "WordPress", "Logo Design", "SEO", "Mobile App", "E-commerce"];

export async function HeroSectionStatic({ locale }: { locale: string }) {

    const [
        heroBadge,
        heroTitleHtml,
        subtitleBefore,
        subtitleHighlight,
        subtitleAfter,
        subtitleExtra,
        searchPlaceholder,
        searchPlaceholderAria,
        searchNow,
        searchNowAria,
        popularLabel,
        searchServicesFor,
        joinAsClient,
        joinAsProvider,
        platformStatistics,
        verifiedExperts,
        completedProjects,
        satisfactionRate,
        tehnicalSupport,
        change
    ] = await Promise.all([
        t(locale as Locale, "homepage.hero.badge"),
        t(locale as Locale, "homepage.hero.title"),
        t(locale as Locale, "homepage.hero.subtitleParts.before"),
        t(locale as Locale, "homepage.hero.subtitleParts.highlight"),
        t(locale as Locale, "homepage.hero.subtitleParts.after"),
        t(locale as Locale, "homepage.hero.subtitleParts.extra"),
        t(locale as Locale, "common.search_placeholder"),
        t(locale as Locale, "common.search_placeholder_aria_label"),
        t(locale as Locale, "common.search_now"),
        t(locale as Locale, "common.search_now_aria_label"),
        t(locale as Locale, "common.popular"),
        t(locale as Locale, "common.search_services_for"),
        t(locale as Locale, "common.join_as_client"),
        t(locale as Locale, "common.join_as_provider"),
        t(locale as Locale, "common.platform_statistics"),
        t(locale as Locale, "common.verified_experts"),
        t(locale as Locale, "common.completed_projects"),
        t(locale as Locale, "common.satisfaction_rate"),
        t(locale as Locale, "common.tehnical_support"),
        t(locale as Locale, "common.change")
    ]);

    const STATS = [
        { number: "500+", label: verifiedExperts, icon: Users, change: "+12%" },
        { number: "2,847", label: completedProjects, icon: CheckCircle, change: "+23%" },
        { number: "98.5%", label: satisfactionRate, icon: Star, change: "+2.1%" },
        { number: "24/7", label: tehnicalSupport, icon: Clock, change: "Non-stop" },
    ];

    return (
        <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
            aria-labelledby="hero-heading"
            role="banner"
        >
            <div className="absolute inset-0" aria-hidden="true">
                <HeroSectionClient />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/10 to-purple-100/10 dark:from-transparent dark:via-blue-900/5 dark:to-purple-900/5" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <Badge
                        variant="secondary"
                        className="inline-flex h-12 items-center px-8 mb-8 text-base font-semibold bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm"
                    >
                        <Sparkles className="w-5 h-5 mr-3 text-blue-600" />
                        🚀 {heroBadge}
                        <span className="ml-3 inline-flex h-6 w-[36px] items-center justify-center bg-blue-600 text-white text-xs rounded-full">
              LIVE
            </span>
                    </Badge>

                    <h1
                        id="hero-heading"
                        className="text-5xl lg:text-7xl font-black mb-8 leading-tight"
                        style={{ willChange: "auto" }}
                    >
                        <span dangerouslySetInnerHTML={{ __html: heroTitleHtml }} />
                    </h1>

                    <h2 className="mx-auto max-w-4xl text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-8">
                        {subtitleBefore}{" "}
                        <strong className="text-blue-600 font-semibold">
                            {subtitleHighlight}
                        </strong>{" "}
                        {subtitleAfter}
                        <br />
                        {subtitleExtra}
                    </h2>

                    <div className="max-w-4xl mx-auto mb-12">
                        <form className="relative group" role="search" aria-label="Căutare servicii IT">
                            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-3 shadow-lg border border-blue-200/50 dark:border-blue-800/50">
                                <div className="flex items-center">
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute left-8 top-1/2 transform -translate-y-1/2 text-muted-foreground w-7 h-7"
                                            aria-hidden="true"
                                        />
                                        <Input
                                            placeholder={searchPlaceholder}
                                            className="w-[98%] pl-20 pr-6 py-8 text-xl border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70"
                                            aria-label={searchPlaceholderAria}
                                            autoComplete="off"
                                            spellCheck="false"
                                            name="search"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="mr-3 px-4 md:px-12 py-8 text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg transition-colors duration-200"
                                        aria-label={searchNowAria}
                                    >
                                        <Rocket className="w-6 h-6 md:mr-3" />
                                        <span className="hidden md:inline">{searchNow}</span>
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div
                            className="flex flex-wrap justify-center items-center gap-3 mt-8"
                            role="group"
                            aria-label="Căutări populare"
                        >
                            <span className="text-sm text-muted-foreground font-medium">{popularLabel}:</span>
                            {POPULAR_TAGS.map((tag) => (
                                <Button
                                    key={tag}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-600 dark:hover:bg-blue-950 transition-colors duration-200 bg-transparent"
                                    aria-label={`${searchServicesFor} ${tag}`}
                                >
                                    {tag}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                        <Button
                            size="lg"
                            className="px-12 py-8 text-xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl transition-colors duration-200"
                            asChild
                        >
                            <Link href={`/${locale}/auth/signup?type=client`}>
                                <Target className="mr-3 w-6 h-6" />
                                {joinAsClient}
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-12 py-8 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 rounded-2xl shadow-lg transition-colors duration-200 bg-transparent"
                            asChild
                        >
                            <Link href={`/${locale}/auth/signup?type=provider`}>
                                <Play className="mr-3 w-6 h-6" />
                                {joinAsProvider}
                            </Link>
                        </Button>
                    </div>

                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
                        role="list"
                        aria-label={platformStatistics}
                    >
                        {STATS.map((stat) => (
                            <div
                                key={stat.label}
                                className="group"
                                role="listitem"
                                tabIndex={0}
                                aria-label={`${stat.number} ${stat.label}, ${stat.change}`}
                            >
                                <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                    <stat.icon className="w-10 h-10 text-blue-600" />
                                </div>
                                <div
                                    className="text-3xl lg:text-4xl font-black text-blue-600 mb-2"
                                    aria-label={`Numărul: ${stat.number}`}
                                >
                                    {stat.number}
                                </div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                    {stat.label}
                                </div>
                                <div
                                    className="text-xs text-green-600 font-semibold"
                                    aria-label={change + ': ' + stat.change}
                                >
                                    {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" aria-hidden="true">
                <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center animate-bounce">
                    <div className="w-1 h-3 bg-blue-600 rounded-full mt-2" />
                </div>
            </div>
        </section>
    );
}
