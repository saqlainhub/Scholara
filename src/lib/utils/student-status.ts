export type StudentStatus = "TOP" | "ACTIVE" | "WEAK";

export type StudentWithScore = {
    id: string;
    totalScore: number;
};

export function getStudentStatus(
    score: number,
    averageScore: number
): StudentStatus {
    if (averageScore <= 0) {
        return "ACTIVE";
    }

    const percentage =
        (score / averageScore) * 100;

    if (percentage > 90) {
        return "TOP";
    }

    if (percentage >= 60) {
        return "ACTIVE";
    }

    return "WEAK";
}

export function calculateStudentStatuses<
    T extends StudentWithScore
>(
    students: T[]
) {
    const totalScore =
        students.reduce(
            (total, student) =>
                total +
                Number(student.totalScore || 0),
            0
        );

    const averageScore =
        students.length > 0
            ? totalScore / students.length
            : 0;

    const studentsWithStatus =
        students.map((student) => {
            const score =
                Number(
                    student.totalScore || 0
                );

            const percentage =
                averageScore > 0
                    ? (score / averageScore) * 100
                    : 0;

            return {
                ...student,
                percentage,
                status: getStudentStatus(
                    score,
                    averageScore
                ),
            };
        });

    return {
        totalScore,
        averageScore,
        students: studentsWithStatus,
    };
}