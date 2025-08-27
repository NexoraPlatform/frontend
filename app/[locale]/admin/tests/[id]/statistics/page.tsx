import TestStatisticsClient from './TestStatisticsClient';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TestStatisticsPage({ params }: PageProps) {
    const { id } = await params;
    return <TestStatisticsClient id={id} />;
}
