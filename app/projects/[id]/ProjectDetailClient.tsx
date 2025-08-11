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
import ProviderCard from "@/app/projects/provider-card";
import {Metadata} from "next";
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
            <div className="min-h-screen bg-background">
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
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">

                <div className="mb-8">
                    <Card className="border-2 shadow-lg">
                        <CardContent className="p-8">
                            <h1 className="text-3xl font-bold mb-2">
                                {project.title.replace(/^Proiect(\s+)/i, "")}
                            </h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-3 bg-muted/30 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Adaugat</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatDistanceToNow(new Date(project.created_at), {
                                            addSuffix: true,
                                            locale: ro
                                        })}
                                    </div>
                                </div>

                                <div className="text-center p-3 bg-muted/30 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Durata proiect</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatDeadline(project.project_duration)}
                                    </div>
                                </div>

                                <div className="text-center p-3 bg-muted/30 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Status proiect</div>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {project.completedAt ? 'Finalizat' : 'Nefinalizat' }
                                    </div>
                                </div>

                                <div className="text-center p-3 bg-muted/30 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Prestatori selectati</div>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {project.selected_providers.length > 0 ? project.selected_providers.length : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {project.description || "Nu există o descriere pentru acest proiect."}
                            </p>

                            {(project?.existing_services?.length > 0
                                || project?.custom_services?.length > 0) && (
                                <div className="my-4">
                                    <div className="text-sm font-medium mb-2">Tehnologii Proiect:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {project.existing_services.map((tech: any, index: number) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {tech.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {project?.recommended_team?.length > 0 && (
                                <div className="my-4">
                                    <div className="text-sm font-medium mb-2">Structura recomandata de echipa:</div>
                                    <ul className="list-disc flex flex-wrap" style={{ gap: '1.6rem' }}>
                                        {project?.recommended_team?.map((team: any, index: number) => (
                                            <li
                                                key={index}
                                                className="text-sm font-medium basis-[16.66%] min-w-[150px]"
                                            >
                                                Serviciu: <span className="text-blue-600">{team.service}</span>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li className="text-muted-foreground">
                                                        <span className="font-normal">Rol:</span> {team.role}
                                                    </li>
                                                    <li className="text-muted-foreground">
                                                        <span className="font-normal">Nivel de experiență:</span> {team.experience_level}
                                                    </li>
                                                    <li className="text-muted-foreground">
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

            <Footer />
        </div>
    );
}
