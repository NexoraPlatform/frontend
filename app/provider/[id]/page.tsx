export const dynamic = 'force-dynamic'

import ProviderProfile from "@/app/provider/[id]/provider-profile";
import {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import apiClient from "@/lib/api";

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = params;
    let providerName: string | undefined

    try {
        providerName = await apiClient.getProviderUserNameByProfileUrl(id)
    } catch {
    }

    return generateSEO({
        title: providerName ? `${providerName} | Profil Prestator` : 'Profil Prestator',
        description: providerName
            ? `Vezi detalii despre ${providerName}, inclusiv servicii oferite și evaluări.`
            : 'Vezi detalii despre prestatorul selectat, inclusiv servicii oferite și evaluări.',
        url: `/provider/${id}`,
    })
}

export default function ProviderProfilePage({ params }: Props) {
    return <ProviderProfile id={params.id} />
}
