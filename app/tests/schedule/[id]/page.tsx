import ScheduleCallClient from "./ScheduleCallClient";

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ScheduleCallPage({ params }: PageProps) {
    const { id } = await params;
    return <ScheduleCallClient id={id} />;
}
