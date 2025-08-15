import EditRoleClient from './EditRoleClient';

type PageProps = {
    params: Promise<{ id: number }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRolePage({ params }: PageProps) {
    const { id } = await params;
    return <EditRoleClient id={id} />;
}
