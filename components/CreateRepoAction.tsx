"use client";
import { useState } from 'react';
import { apiClient } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreateRepoAction({ projectId, hasGithubToken }: { projectId: string, hasGithubToken: boolean }) {
    const [target, setTarget] = useState<'without' | 'platform' | 'provider' | 'client'>('without');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const response = await apiClient.createGithubRepo(projectId, target);

            toast.success("Repository creat cu succes!", {
                description: `Link: ${response.data.repo_url}`
            });

            // Refresh la pagină sau state update
        } catch (error: any) {
            toast.error("Eroare la creare repo", {
                description: error.response?.data?.error || "Ceva nu a mers bine."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-4">Git Repository Setup</h3>

            <RadioGroup defaultValue="platform" onValueChange={(v) => setTarget(v as any)} className="mb-4">

                {/* Opțiunea 1: Fara */}
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without" id="r1" />
                    <Label htmlFor="r1">
                        Fara repo
                        <span className="block text-xs text-muted-foreground">Nu am nevoie de repo.</span>
                    </Label>
                </div>

                {/* Opțiunea 2: Trustora */}
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="platform" id="r2" />
                    <Label htmlFor="r2">
                        Repo pe Trustora (Recomandat)
                        <span className="block text-xs text-muted-foreground">Noi deținem repo-ul, tu ești colaborator. Siguranță maximă.</span>
                    </Label>
                </div>

                {/* Opțiunea 3: Provider */}
                <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="provider" id="r3" disabled={!hasGithubToken} />
                    <Label htmlFor="r3" className={!hasGithubToken ? "opacity-50" : ""}>
                        Repo pe contul meu
                        {!hasGithubToken && <span className="block text-xs text-red-500">Trebuie să conectezi contul de GitHub mai întâi.</span>}
                    </Label>
                </div>

                {/* Opțiunea 4: Client */}
                <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="client" id="r4" disabled={!hasGithubToken} />
                    <Label htmlFor="r4" className={!hasGithubToken ? "opacity-50" : ""}>
                        Repo pe contul clientului
                        {!hasGithubToken && <span className="block text-xs text-red-500">Trebuie să conectezi contul de GitHub mai întâi.</span>}
                    </Label>
                </div>
            </RadioGroup>

            <Button onClick={handleCreate} disabled={loading || (target !== 'platform' && !hasGithubToken)}>
                {loading ? "Se creează..." : "Generează Repository"}
            </Button>
        </div>
    );
}
