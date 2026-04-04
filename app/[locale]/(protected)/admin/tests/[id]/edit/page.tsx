import EditTestClient from './EditTestClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditTestPage({ params }: PageProps) {
  const { id } = await params;
  return <EditTestClient id={id} />;
}
