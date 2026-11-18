import { apiRequest } from "./apiClient";

/* =========================================================
   QUESTION
========================================================= */

export interface PracticeQuestionDto {
    id: string;
    type: "single_choice" | "multiple_choice";

    noiDung: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    topicId?: string | null;
    topicName?: string | null;

    explanation?: string | null;
}

/* =========================================================
   SUBMIT ANSWER
========================================================= */

export interface SubmitPracticeAnswer {
    questionId: string;
    answer: string;
}

/* =========================================================
   SUBMIT RESULT ITEM
========================================================= */

export interface PracticeAnswerResult {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string | null;
}

/* =========================================================
   SUBMIT RESULT
========================================================= */

export interface SubmitPracticeResult {
    attemptId: string;

    topicId: string;
    topicName: string;

    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;

    score: number;

    results: PracticeAnswerResult[];
}

/* =========================================================
   PRACTICE HISTORY
========================================================= */

export interface PracticeAttemptDto {
    id: string;

    topicId: string;
    topicName: string;

    subjectName: string;
    chapterName: string;
    chapterOrder: number;
    orderNum: number;

    score: number;

    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;

    submittedAt: string;
}

export interface PracticeAttemptAnswerDto {
    questionId: string;
    questionOrder: number;

    questionText: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    studentAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;

    explanation?: string | null;
}

export interface PracticeAttemptDetailDto {
    id: string;

    topicId: string;
    topicName: string;

    subjectName: string;
    chapterName: string;
    chapterOrder: number;
    orderNum: number;

    score: number;

    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;

    submittedAt: string;

    answers: PracticeAttemptAnswerDto[];
}

export interface PracticeAnswerExplanationDto {
    questionId: string;
    text: string;
    /** true khi AI không khả dụng và server trả lời giải có sẵn của giáo viên. */
    isFallback?: boolean;
    notice?: string | null;
}

export async function explainPracticeAnswer(
    attemptId: string,
    questionId: string,
): Promise<PracticeAnswerExplanationDto> {
    return apiRequest<PracticeAnswerExplanationDto>(
        `/api/students/practice-attempts/${attemptId}/questions/${questionId}/explain`,
        { method: "POST" },
    );
}

/* =========================================================
   GET QUESTIONS
========================================================= */

export async function getPracticeQuestions(
    topicId: string,
): Promise<PracticeQuestionDto[]> {
    return await apiRequest<PracticeQuestionDto[]>(
        `/api/students/topics/${topicId}/questions`,
        {
            method: "GET",
        },
    );
}

/* =========================================================
   SUBMIT
========================================================= */

export async function submitPractice(
    topicId: string,
    answers: SubmitPracticeAnswer[],
): Promise<SubmitPracticeResult> {
    return await apiRequest<SubmitPracticeResult>(
        `/api/students/topics/${topicId}/practice/submit`,
        {
            method: "POST",
            body: JSON.stringify(answers),
        },
    );
}

/* =========================================================
   HISTORY LIST
========================================================= */

export async function getPracticeAttempts(): Promise<
    PracticeAttemptDto[]
> {
    return await apiRequest<PracticeAttemptDto[]>(
        "/api/students/practice-attempts",
        {
            method: "GET",
        },
    );
}

/* =========================================================
   HISTORY DETAIL
========================================================= */

export async function getPracticeAttemptDetail(
    attemptId: string,
): Promise<PracticeAttemptDetailDto> {
    return await apiRequest<PracticeAttemptDetailDto>(
        `/api/students/practice-attempts/${attemptId}`,
        {
            method: "GET",
        },
    );
}

/* =========================================================
   SERVICE
========================================================= */

export const practiceService = {
    getPracticeQuestions,
    submitPractice,
    getPracticeAttempts,
    getPracticeAttemptDetail,
    explainPracticeAnswer,
};
