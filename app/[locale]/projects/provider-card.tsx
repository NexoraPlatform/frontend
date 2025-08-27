"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {MapPin, Star} from "lucide-react";
import ProviderService from "./[id]/provider-service";
import {useRouter} from "next/navigation";

interface ProviderCardProps {
    provider: any;
}
export default function ProviderCard({ provider}: ProviderCardProps) {
    const router = useRouter();

    return (
        <Card key={provider.id} className="cursor-pointer" onClick={() => router.push(`/provider/${provider.profile_url}`)}>
            <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={provider.avatar} alt={`Imagine prestator ${provider.firstName} ${provider.lastName}`} />
                        <AvatarFallback>
                            {provider.firstName?.[0]}{provider.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div>
                                    <div className="font-medium">
                                        {provider.firstName} {provider.lastName}
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">

                                        <div className="flex items-center space-x-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{provider.location || 'România'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                        {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                            <ProviderService service={ service} key={index} />
                                        ))}
                                    </div>
                                </div>
                                {provider.bio && (<div className="mt-2 text-xs text-muted-foreground">{provider.bio}</div>)}
                            </div>

                            <div className="text-right">
                                <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{provider.rating || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
