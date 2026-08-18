import TeacherDetail from "@/app/components/head/teachers/teacher-detail";

export default async function TeacherDetailPage({
    params,
}: {
    params: Promise<{
        teacherId: string;
    }>;
}) {
    const { teacherId } = await params;

    return <TeacherDetail teacherId={teacherId} />;
}