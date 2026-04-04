"use client";

import { MuiIcon } from "@/components/MuiIcons";
import { Badge } from "@/components/ui/badge";

interface ProviderServiceBadgeProps {
    service: any;
}

export default function ProviderServiceBadge({ service }: ProviderServiceBadgeProps) {
    return (
        <Badge variant="outline" className="text-xs">
            <MuiIcon icon={service.categoryIcon} size={20} className="mr-1" />
            {service.name}
        </Badge>
    );
}
