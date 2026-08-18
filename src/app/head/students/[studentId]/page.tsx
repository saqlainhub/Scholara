import StudentDetail from "@/app/components/head/students/student-detail";

export default async function StudentDetailPage({
    params,
}: {
    params: Promise<{
        studentId: string;
    }>;
}) {
    const { studentId } = await params;

    return <StudentDetail studentId={studentId} />;
}