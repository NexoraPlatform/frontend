import StripeCheckoutClient from './CheckoutFormClient';

type PageProps = {
    params: Promise<{ projectId: string; clientSecret: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params }: PageProps) {
    const { projectId, clientSecret } = await params; // <- Next 15
    return (
        <StripeCheckoutClient
            projectId={projectId}
            clientSecret={clientSecret}
        />
    );
}
