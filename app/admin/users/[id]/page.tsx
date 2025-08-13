import EditUserClient from './EditUserClient';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUserPage({ params }: PageProps) {
    const { id } = await params;
    return <EditUserClient id={id} />;
}
