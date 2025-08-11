import ProviderProfileClient from "./ProviderProfileClient";

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderProfilePage({ params }: PageProps) {
    const { id } = await params;
    return <ProviderProfileClient id={id} />;
}
