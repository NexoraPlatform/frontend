import ProviderCard from "@/app/[locale]/projects/provider-card";

export const dynamic = 'force-dynamic'

import apiClient from "@/lib/api";
import {Header} from "@/components/header";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle} from "lucide-react";
import {Footer} from "@/components/footer";
import { Card, CardContent } from '@/components/ui/card';
import {formatDistanceToNow} from "date-fns";
import {ro} from "date-fns/locale";
import {Badge} from "@/components/ui/badge";
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";

type ProjectDetailPageProps = {
    params: {
        id: string;
    }
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
    const { id } = params;
    let projectTitle: string | undefined

    try {
        projectTitle = await apiClient.getProjectNameByProjectUrl(id)
    } catch {
    }

    return generateSEO({
        title: projectTitle ? `${projectTitle} | Proiect Detaliat` : 'Proiect Detaliat',
        description: projectTitle
            ? `Vezi detalii despre ${projectTitle}, inclusiv servicii oferite și evaluări.`
            : 'Vezi detalii despre proiectul selectat, inclusiv informații despre prestatori și tehnologii utilizate.',
        url: `/projects/${id}`,
    })
}

export default async function ProjectDetailClient({ id }: {  id: string; }) {
    const project = await apiClient.getProjectBySlug(id);

    if (!project) {
        return (
            <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
                <TrustoraThemeStyles />
                <Header />
                <div className="container mx-auto px-4 py-20">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{'Proiectul nu a fost găsit'}</AlertDescription>
                    </Alert>
                </div>
                <Footer />
            </div>
        );
    }

    const formatDeadline = (value: string): string => {
        const map: Record<string, string> = {
            '1day': '1 zi',
            '1week': 'O săptămână',
            '2weeks': '2 săptămâni',
            '3weeks': '3 săptămâni',
            '1month': '1 lună',
            '3months': '3 luni',
            '6months': '6 luni',
            '1year': '1 an',
            '1plusyear': '1+ ani',
        };

        return map[value] || value;
    };
    return (
        <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />
            <main className="pt-24">
                <section className="px-6 pb-10 hero-gradient">
                    <div className="max-w-6xl mx-auto">
                        <Badge className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                            <span className="text-[#1BC47D]">●</span> Detalii proiect
                        </Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {project.title.replace(/^Proiect(\s+)/i, "")}
                        </h1>
                        <p className="mt-3 text-base text-slate-600 max-w-3xl dark:text-[#A3ADC2]">
                            {project.description || "Nu există o descriere pentru acest proiect."}
                        </p>
                    </div>
                </section>

                <section className="px-6 py-12 bg-[#F5F7FA] dark:bg-[#0B1220]">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <Card className="glass-card shadow-sm">
                                <CardContent className="p-8">
                                    <div className="grid xs:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-4 bg-white/80 border border-slate-100 rounded-lg dark:bg-[#0F172A] dark:border-[#1E2A3D]">
                                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">Adaugat</div>
                                            <div className="text-2xl font-bold text-[#1BC47D]">
                                                {formatDistanceToNow(new Date(project.created_at), {
                                                    addSuffix: true,
                                                    locale: ro
                                                })}
                                            </div>
                                        </div>

                                        <div className="text-center p-4 bg-white/80 border border-slate-100 rounded-lg dark:bg-[#0F172A] dark:border-[#1E2A3D]">
                                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">Durata proiect</div>
                                            <div className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                {formatDeadline(project.project_duration)}
                                            </div>
                                        </div>

                                        <div className="text-center p-4 bg-white/80 border border-slate-100 rounded-lg dark:bg-[#0F172A] dark:border-[#1E2A3D]">
                                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">Status proiect</div>
                                            <div className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                {project.completedAt ? 'Finalizat' : 'Nefinalizat' }
                                            </div>
                                        </div>

                                        <div className="text-center p-4 bg-white/80 border border-slate-100 rounded-lg dark:bg-[#0F172A] dark:border-[#1E2A3D]">
                                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">Prestatori selectati</div>
                                            <div className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                {project.selected_providers.length > 0 ? project.selected_providers.length : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {(project?.existing_services?.length > 0
                                        || project?.custom_services?.length > 0) && (
                                        <div className="my-6">
                                            <div className="text-sm font-medium mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                Tehnologii Proiect:
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {project.existing_services.map((tech: any, index: number) => (
                                                    <Badge key={index} variant="outline" className="text-xs border-slate-200 dark:border-[#1E2A3D]">
                                                        {tech.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {project?.recommended_team?.length > 0 && (
                                        <div className="my-6">
                                            <div className="text-sm font-medium mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                Structura recomandata de echipa:
                                            </div>
                                            <ul className="list-disc flex flex-wrap" style={{ gap: '1.6rem' }}>
                                                {project?.recommended_team?.map((team: any, index: number) => (
                                                    <li
                                                        key={index}
                                                        className="text-sm font-medium basis-[16.66%] min-w-[150px]"
                                                    >
                                                        Serviciu: <span className="text-emerald-green">{team.service}</span>
                                                        <ul className="list-disc pl-5 space-y-2">
                                                            <li className="text-slate-500 dark:text-[#A3ADC2]">
                                                                <span className="font-normal">Rol:</span> {team.role}
                                                            </li>
                                                            <li className="text-slate-500 dark:text-[#A3ADC2]">
                                                                <span className="font-normal">Nivel de experiență:</span> {team.experience_level}
                                                            </li>
                                                            <li className="text-slate-500 dark:text-[#A3ADC2]">
                                                                <span className="font-normal">Număr de prestatori:</span> {team.count}
                                                            </li>
                                                        </ul>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {project.providers.length > 0 && (
                                        <div className="lg:col-span-2 space-y-4">
                                            {project.providers.map((provider: any) => (
                                                <ProviderCard provider={provider} key={provider.id} />
                                            ))}
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
