import { apiRequest } from "./apiClient";

/* =========================================================
   QUESTION
========================================================= */

export interface PracticeQuestionDto {
    id: string;
    type: "single_choice" | "multiple_choice" | "true_false" | "essay";

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
   WORD PUZZLE (ALPHABETTY SAGA)
========================================================= */

export interface WordPuzzleQuestionDto {
    id: string;
    questionText: string;
    wordAnswer: string;
    displayAnswer: string;
    explanation?: string | null;
    type: string;
    topicId: string;
    topicName: string;
    subjectName: string;
}

/* =========================================================
   CHESS PUZZLE (TRUE / FALSE, MULTIPLE CHOICE, ESSAY)
========================================================= */

export interface ChessQuestionDto {
    id: string;
    noiDung: string;
    questionText: string;
    type?: "true_false" | "single_choice" | "multiple_choice" | "essay" | string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    isTrue: boolean;
    correctAnswer: string;
    explanation?: string | null;
    topicId: string;
    topicName: string;
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
   GET WORD PUZZLE QUESTIONS (ALPHABETTY SAGA)
========================================================= */

export async function getWordPuzzleQuestions(
    topicId: string,
): Promise<WordPuzzleQuestionDto[]> {
    return await apiRequest<WordPuzzleQuestionDto[]>(
        `/api/students/topics/${topicId}/word-puzzle-questions`,
        {
            method: "GET",
        },
    );
}

/* =========================================================
   GET CHESS QUESTIONS (TRUE / FALSE)
========================================================= */

export async function getChessQuestions(
    topicId: string,
): Promise<ChessQuestionDto[]> {
    return await apiRequest<ChessQuestionDto[]>(
        `/api/students/topics/${topicId}/chess-questions`,
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
    getWordPuzzleQuestions,
    getChessQuestions,
    submitPractice,
    getPracticeAttempts,
    getPracticeAttemptDetail,
    explainPracticeAnswer,
};
