import {
    apiRequest,
} from "./apiClient";

export interface TeacherApiDto {
    id: string;
    hoTen: string;
    email: string;
    sdt: string;
    subjectId: string;
    tenMH: string | null;
    gradeId: string;
    tenKhoi: string | null;
    isLocked: boolean;
    createdAt: string;
    questionsCount?: number;
    examsCount?: number;
}

// Chi tiết giáo viên dành cho Admin: câu hỏi, đề thi, luyện tập (dữ liệu thật từ SQL Server).
export interface TeacherDetailQuestionItem {
    id: string;
    noiDung: string;
    difficulty: string;
    topicName: string;
    createdAt: string;
}

export interface TeacherDetailExamItem {
    id: string;
    tenBaiKT: string;
    thoiLuong: number;
    totalQuestions: number;
    status: "published" | "pending" | "rejected" | "draft";
    submissionsCount: number;
    averageScore: number | null;
    rejectionNote: string | null;
}

export interface TeacherDetailPracticeStudent {
    studentId: string;
    maHS: string;
    studentName: string;
    attemptsCount: number;
    practicedTopicsCount: number;
    averageScore: number;
    lastSubmittedAt: string | null;
}

export interface TeacherDetailPracticeAttempt {
    attemptId: string;
    studentName: string;
    topicName: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    submittedAt: string;
}

export interface TeacherDetailDto {
    id: string;
    hoTen: string;
    email: string;
    sdt: string;
    tenMH: string | null;
    tenKhoi: string | null;
    isLocked: boolean;
    createdAt: string;
    questionsCount: number;
    examsCount: number;
    studentsCount: number;
    examSubmissionsCount: number;
    questionsByDifficulty: {
        easy: number;
        medium: number;
        hard: number;
        other: number;
    };
    recentQuestions: TeacherDetailQuestionItem[];
    examsByStatus: {
        published: number;
        pending: number;
        rejected: number;
        draft: number;
    };
    exams: TeacherDetailExamItem[];
    practice: {
        attemptsCount: number;
        studentsCount: number;
        practicedTopicsCount: number;
        totalTopicsCount: number;
        averageScore: number | null;
        students: TeacherDetailPracticeStudent[];
        recentAttempts: TeacherDetailPracticeAttempt[];
    };
}

export interface CreateTeacherRequest {
    ho: string;
    tenDem: string;
    ten: string;
    email: string;
    matKhau: string;
    sdt: string;
    subjectId: string;
    gradeId: string;
}

export interface UpdateTeacherRequest {
    email: string;
    subjectId: string;
    gradeId: string;
}

interface CreateTeacherResponse {
    message: string;
    teacherId: string;
}

export function getTeachers() {
    return apiRequest<TeacherApiDto[]>(
        "/api/admin/teachers",
    );
}

export function getTeacherDetail(
    teacherId: string,
) {
    return apiRequest<TeacherDetailDto>(
        `/api/admin/teachers/${teacherId}/detail`,
    );
}

export function createTeacher(
    data: CreateTeacherRequest,
) {
    return apiRequest<CreateTeacherResponse>(
        "/api/admin/teachers",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}

export function updateTeacher(
    teacherId: string,
    data: UpdateTeacherRequest,
) {
    return apiRequest<string>(
        `/api/admin/teachers/${teacherId}`,
        {
            method: "PUT",

            body:
                JSON.stringify(data),
        },
    );
}

export function lockTeacher(
    teacherId: string,
) {
    return apiRequest<boolean>(
        `/api/admin/teachers/${teacherId}/lock`,
        {
            method: "PUT",
        },
    );
}

export function unlockTeacher(
    teacherId: string,
) {
    return apiRequest<boolean>(
        `/api/admin/teachers/${teacherId}/unlock`,
        {
            method: "PUT",
        },
    );
}

export function deleteTeacher(
    teacherId: string,
) {
    return apiRequest<string>(
        `/api/admin/teachers/${teacherId}`,
        {
            method: "DELETE",
        },
    );
}