import EditRoleClient from './EditRoleClient';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRolePage({ params }: PageProps) {
    const { id } = await params;
    return <EditRoleClient id={Number(id)} />;
}
