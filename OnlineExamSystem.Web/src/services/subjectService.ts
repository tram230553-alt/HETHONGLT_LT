import {
    apiRequest,
} from "./apiClient";

export interface SubjectDto {
    id: string;
    tenMH: string;
    chaptersCount: number;
    topicsCount: number;
    questionsCount: number;
    examsCount: number;
    studentsCount: number;
}

// Chi tiết một môn học (drawer "Xem chi tiết"), toàn bộ lấy từ SQL Server.
export interface SubjectChapterItemDto {
    name: string;
    order: number;
    gradeName: string;
    topicsCount: number;
    questionsCount: number;
}

export interface SubjectTopicItemDto {
    id: string;
    name: string;
    chapterName: string;
    gradeName: string;
    isActive: boolean;
    questionsCount: number;
}

export interface SubjectTeacherItemDto {
    id: string;
    hoTen: string;
    email: string;
    gradeName: string;
    isLocked: boolean;
}

export interface SubjectQuestionItemDto {
    id: string;
    noiDung: string;
    difficulty: string;
    topicName: string;
    creatorName: string;
}

export interface SubjectExamItemDto {
    id: string;
    tenBaiKT: string;
    thoiLuong: number;
    totalQuestions: number;
    gradeName: string;
    creatorName: string;
    status: "published" | "pending" | "rejected" | "draft";
}

export interface SubjectDetailDto {
    id: string;
    tenMH: string;
    chaptersCount: number;
    topicsCount: number;
    teachersCount: number;
    questionsCount: number;
    examsCount: number;
    studentsCount: number;
    chapters: SubjectChapterItemDto[];
    topics: SubjectTopicItemDto[];
    teachers: SubjectTeacherItemDto[];
    recentQuestions: SubjectQuestionItemDto[];
    questionsByDifficulty: {
        easy: number;
        medium: number;
        hard: number;
        other: number;
    };
    exams: SubjectExamItemDto[];
    examsByStatus: {
        published: number;
        pending: number;
        rejected: number;
        draft: number;
    };
    examResultsCount: number;
    averageScore: number | null;
}

export async function getSubjectDetail(
    id: string,
): Promise<SubjectDetailDto> {
    return apiRequest<SubjectDetailDto>(
        `/api/subjects/${id}/detail`,
    );
}

export async function getSubjects():
    Promise<SubjectDto[]> {
    return apiRequest<SubjectDto[]>(
        "/api/subjects",
    );
}

export async function createSubject(
    tenMH: string,
): Promise<string> {
    return apiRequest<string>(
        "/api/subjects",
        {
            method: "POST",

            body: JSON.stringify({
                tenMH,
            }),
        },
    );
}

export async function updateSubject(
    id: string,
    tenMH: string,
): Promise<string> {
    return apiRequest<string>(
        `/api/subjects/${id}`,
        {
            method: "PUT",

            body: JSON.stringify({
                tenMH,
            }),
        },
    );
}

export async function deleteSubject(
    id: string,
): Promise<string> {
    return apiRequest<string>(
        `/api/subjects/${id}`,
        {
            method: "DELETE",
        },
    );
}
