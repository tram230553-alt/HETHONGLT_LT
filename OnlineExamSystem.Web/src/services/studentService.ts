import {
    apiRequest,
} from "./apiClient";

export interface StudentApiDto {
    id: string;
    hoTen: string;
    email: string;
    maHS: string;
    ngaySinh: string;
    lop: string;
    gradeId: string;
    tenKhoi: string;
    isLocked: boolean;
    createdAt: string;
}

export interface StudentAvailableExamDto {
    id: string;
    monHoc: string;
    khoi: string;
    giaoVien: string;
    tenBaiKT: string;
    thoiLuong: number;
    totalQuestions: number;
    isSubmittedForApproval: boolean;
    isPublished: boolean;
}

export interface StudentQuestionDto {
    id: string;
    type: "single_choice" | "multiple_choice" | "true_false" | "essay";
    noiDung: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
}
export interface StudentWrongQuestionDto {
    questionId: string;

    examId: string;

    tenBaiKT: string;

    subjectId: string;

    monHoc: string;

    gradeId: string;

    khoi: string;

    noiDung: string;

    optionA: string;

    optionB: string;

    optionC: string;

    optionD: string;

    selectedAnswer: string;

    correctAnswer: string;

    isUnanswered: boolean;

    wrongCount: number;

    lastWrongAt: string;
}
export interface StudentExamDetailDto {
    id: string;
    tenBaiKT: string;
    thoiLuong: number;
    questions: StudentQuestionDto[];
}

export interface StudentAnswerRequest {
    questionId: string;
    selectedAnswer: string;
}

export interface SubmitStudentExamResponse {
    examResultId: string;
    diem: number;
    totalQuestion: number;
    correctQuestion: number;
    attemptNumber: number;
    showResultAfterSubmit: boolean;
}

export interface StudentResultDto {
    examResultId: string;

    examId: string;


    // Môn học
    subjectId: string;

    monHoc: string;


    // Khối
    gradeId: string;

    khoi: string;


    // Bài thi
    tenBaiKT: string;

    diem: number;

    correctQuestion: number;

    totalQuestion: number;

    attemptNumber: number;

    submittedAt: string;
}

export interface StudentResultQuestionDetailDto {
    questionId: string;
    noiDung: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    selectedAnswer: string;
    correctAnswer: string;
    type?: "single_choice" | "multiple_choice" | "true_false" | "essay";
    isCorrect: boolean;
}


export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface StudentResultDetailDto {
    examId: string;
    tenBaiKT: string;
    diem: number;
    totalQuestion: number;
    correctQuestion: number;
    submittedAt: string;
    questions: StudentResultQuestionDetailDto[];
}

export interface StudentSavedQuestionDto {
    id: string;

    questionId: string;

    subjectId: string;

    monHoc: string;

    gradeId: string;

    khoi: string;

    noiDung: string;

    optionA: string;

    optionB: string;

    optionC: string;

    optionD: string;

    correctAnswer: string;

    createdAt: string;
}

export interface StudentLeaderboardDto {
    rank: number;

    studentId: string;

    studentName: string;

    avatarUrl?: string | null;

    gradeId?: string | null;

    khoi?: string | null;

    averageScore: number;

    totalExams: number;

    totalCorrectAnswers: number;

    totalQuestions: number;
}

export interface StudentLoginSessionDto {
    id: string;
    deviceName: string;
    browserName: string;
    ipAddress: string;
    loggedInAt: string;
}
export function getStudents() {
    return apiRequest<StudentApiDto[]>(
        "/api/admin/students",
    );
}

export function lockStudent(
    studentId: string,
) {
    return apiRequest<boolean>(
        `/api/admin/students/${studentId}/lock`,
        {
            method: "PUT",
        },
    );
}

export function unlockStudent(
    studentId: string,
) {
    return apiRequest<boolean>(
        `/api/admin/students/${studentId}/unlock`,
        {
            method: "PUT",
        },
    );
}
export function getMyWrongQuestions() {
    return apiRequest<StudentWrongQuestionDto[]>(
        "/api/students/questions/wrong",
    );
}
export function getMyStudentProfile() {
    return apiRequest<StudentApiDto>(
        "/api/students/profile",
    );
}

export function getAvailableStudentExams() {
    return apiRequest<StudentAvailableExamDto[]>(
        "/api/exams/available",
    );
}

export function getStudentExamDetail(
    examId: string,
) {
    return apiRequest<StudentExamDetailDto>(
        `/api/students/exams/${examId}`,
    );
}

export function submitStudentExam(
    examId: string,
    answers: StudentAnswerRequest[],
) {
    return apiRequest<SubmitStudentExamResponse>(
        `/api/students/exams/${examId}/submit`,
        {
            method: "POST",
            body: JSON.stringify({
                examId,
                answers,
            }),
        },
    );
}

export function getMyStudentResults() {
    return apiRequest<StudentResultDto[]>(
        "/api/students/results",
    );
}
export function getMySavedQuestions() {
    return apiRequest<StudentSavedQuestionDto[]>(
        "/api/students/questions/saved",
    );
}


export function saveStudentQuestion(
    questionId: string,
) {
    return apiRequest<boolean>(
        `/api/students/questions/${questionId}/save`,
        {
            method: "POST",
        },
    );
}


export function removeSavedStudentQuestion(
    questionId: string,
) {
    return apiRequest<boolean>(
        `/api/students/questions/${questionId}/save`,
        {
            method: "DELETE",
        },
    );
}

export function getStudentResultDetail(
    examId: string,
) {
    return apiRequest<StudentResultDetailDto>(
        `/api/students/results/${examId}`,
    );
}

export function retakeStudentExam(
    examId: string,
    answers: StudentAnswerRequest[],
) {
    return apiRequest<SubmitStudentExamResponse>(
        `/api/students/exams/${examId}/retake`,
        {
            method: "POST",
            body: JSON.stringify({
                examId,
                answers,
            }),
        },
    );
}

export function getStudentResultAttemptDetail(
    examResultId: string,
) {
    return apiRequest<StudentResultDetailDto>(
        `/api/students/results/attempt/${examResultId}`,
    );
}

export function changeMyPassword(
    request: ChangePasswordRequest,
) {
    return apiRequest<string>(
        "/api/users/change-password",
        {
            method: "PUT",
            body: JSON.stringify(request),
        },
    );
}

export function getStudentLeaderboard(
    params?: {
        gradeId?: string;
        subjectId?: string;
        limit?: number;
    },
) {
    const searchParams =
        new URLSearchParams();

    if (params?.gradeId) {
        searchParams.set(
            "gradeId",
            params.gradeId,
        );
    }

    if (params?.subjectId) {
        searchParams.set(
            "subjectId",
            params.subjectId,
        );
    }

    if (params?.limit) {
        searchParams.set(
            "limit",
            String(params.limit),
        );
    }

    const query =
        searchParams.toString();

    return apiRequest<StudentLeaderboardDto[]>(
        `/api/students/leaderboard${query ? `?${query}` : ""
        }`,
    );
}

export function getMyLoginSessions() {
    return apiRequest<StudentLoginSessionDto[]>(
        "/api/students/login-sessions",
    );
}
