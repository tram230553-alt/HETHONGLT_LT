import { apiRequest } from "./apiClient";

/* =========================================================
   DTO
========================================================= */

export interface QuestionDto {
    id: string;

    noiDung: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    correctAnswer: string;
    type: "single_choice" | "multiple_choice";
    difficulty: "easy" | "medium" | "hard";

    subjectId: string;
    subjectName?: string;

    topicId: string;
    topicName?: string;

    createdBy: string;
    creatorName?: string;

    status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "locked";

    createdAt: string;

    explanation?: string;
}


/* =========================================================
   CREATE
========================================================= */

export interface CreateQuestionRequest {
    noiDung: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    correctAnswer: string;
    type: "single_choice" | "multiple_choice";
    difficulty: "easy" | "medium" | "hard";

    topicId: string;

    explanation?: string;
}


/* =========================================================
   UPDATE
========================================================= */

export interface UpdateQuestionRequest {
    noiDung: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    correctAnswer: string;
    type: "single_choice" | "multiple_choice";
    difficulty: "easy" | "medium" | "hard";

    topicId: string;

    explanation?: string;
}


/* =========================================================
   SERVICE
========================================================= */

export interface QuestionUsageExamDto {
    id: string;
    tenBaiKT: string;
    isPublished: boolean;
    isSubmittedForApproval: boolean;
    isRejected: boolean;
}

export interface QuestionUsageDto {
    questionId: string;
    exams: QuestionUsageExamDto[];
    hasPublishedExam: boolean;
    hasStudentActivity: boolean;
    canDelete: boolean;
    blockReason: string | null;
    requiresConfirmation: boolean;
}

export const questionService = {

    /**
     * GET
     * Lấy toàn bộ câu hỏi của giáo viên hiện tại.
     *
     * Backend:
     * GET /api/Questions/my
     */
    async getMyQuestions(): Promise<QuestionDto[]> {

        const response =
            await apiRequest(
                "/api/questions/my",
                {
                    method: "GET",
                }
            );

        return normalizeList<QuestionDto>(
            response
        );
    },


    /**
     * GET
     * Lấy các câu hỏi mà giáo viên được phép xem.
     *
     * Backend:
     * GET /api/Questions/available
     */
    async getAvailableQuestions():
        Promise<QuestionDto[]> {

        const response =
            await apiRequest(
                "/api/questions/my",
                {
                    method: "GET",
                }
            );

        return normalizeList<QuestionDto>(
            response
        );
    },


    /**
     * GET
     * Lấy câu hỏi theo Topic.
     *
     * Backend:
     * GET /api/Questions/topic/{topicId}
     */
    async getQuestionsByTopic(
        topicId: string
    ): Promise<QuestionDto[]> {

        if (!topicId) {
            return [];
        }

        const response =
            await apiRequest(
                `/api/questions/topic/${topicId}`,
                {
                    method: "GET",
                }
            );

        return normalizeList<QuestionDto>(
            response
        );
    },


    /**
     * GET
     * Lấy một câu hỏi.
     *
     * Backend:
     * GET /api/Questions/{id}
     */
    async getQuestionById(
        id: string
    ): Promise<QuestionDto> {

        if (!id) {
            throw new Error(
                "Question id không hợp lệ."
            );
        }

        const response =
            await apiRequest(
                `/api/questions/${id}`,
                {
                    method: "GET",
                }
            );

        return normalizeItem<QuestionDto>(
            response
        );
    },


    /**
     * POST
     * Teacher tạo câu hỏi.
     *
     * Backend tự xác định:
     * - CreatedBy
     * - SubjectId
     * - TeacherId
     *
     * Frontend CHỈ gửi TopicId.
     */
    async createQuestion(
        request: CreateQuestionRequest
    ): Promise<QuestionDto> {

        validateCreateRequest(
            request
        );

        const response =
            await apiRequest(
                "/api/questions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        request
                    ),
                }
            );

        return normalizeItem<QuestionDto>(
            response
        );
    },


    /**
     * PUT
     * Teacher sửa câu hỏi của chính mình.
     *
     * Backend phải kiểm tra CreatedBy.
     */
    async updateQuestion(
        id: string,
        request: UpdateQuestionRequest
    ): Promise<void> {

        if (!id) {
            throw new Error(
                "Question id không hợp lệ."
            );
        }

        validateUpdateRequest(
            request
        );

        await apiRequest(
            `/api/questions/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    request
                ),
            }
        );
    },


    /**
     * GET
     * Xem câu hỏi đang được dùng trong đề thi nào trước khi xóa.
     */
    async getQuestionUsage(
        id: string
    ): Promise<QuestionUsageDto> {

        if (!id) {
            throw new Error(
                "Question id không hợp lệ."
            );
        }

        return await apiRequest<QuestionUsageDto>(
            `/api/questions/${id}/usage`,
            {
                method: "GET",
            }
        );
    },


    /**
     * DELETE
     * Teacher xóa câu hỏi của chính mình.
     *
     * - Đề đã công bố đang dùng câu hỏi → server từ chối.
     * - Đề chưa công bố đang dùng câu hỏi → cần confirm = true.
     */
    async deleteQuestion(
        id: string,
        confirm = false
    ): Promise<void> {

        if (!id) {
            throw new Error(
                "Question id không hợp lệ."
            );
        }

        await apiRequest(
            `/api/questions/${id}${confirm ? "?confirm=true" : ""}`,
            {
                method: "DELETE",
            }
        );
    },


    /**
     * POST
     * Teacher gửi câu hỏi.
     *
     * Lưu ý:
     * Theo yêu cầu của bạn, Admin KHÔNG duyệt Question.
     * Hàm này chỉ dùng nếu Backend của bạn có workflow submit.
     */
    async submitQuestion(
        id: string
    ): Promise<void> {

        if (!id) {
            throw new Error(
                "Question id không hợp lệ."
            );
        }

        await apiRequest(
            `/api/questions/${id}/submit`,
            {
                method: "POST",
            }
        );
    },
};


/* =========================================================
   HELPERS
========================================================= */

function normalizeList<T>(
    response: unknown
): T[] {

    if (Array.isArray(response)) {
        return response as T[];
    }

    if (
        response &&
        typeof response === "object"
    ) {

        const data =
            response as {
                data?: unknown;
                items?: unknown;
                result?: unknown;
            };


        if (Array.isArray(data.data)) {
            return data.data as T[];
        }


        if (Array.isArray(data.items)) {
            return data.items as T[];
        }


        if (Array.isArray(data.result)) {
            return data.result as T[];
        }
    }

    return [];
}


function normalizeItem<T>(
    response: unknown
): T {

    if (
        response &&
        typeof response === "object"
    ) {

        const data =
            response as {
                data?: unknown;
                result?: unknown;
            };


        if (
            data.data &&
            typeof data.data === "object"
        ) {
            return data.data as T;
        }


        if (
            data.result &&
            typeof data.result === "object"
        ) {
            return data.result as T;
        }
    }

    return response as T;
}


/* =========================================================
   VALIDATION
========================================================= */

function validateCreateRequest(
    request: CreateQuestionRequest
): void {

    if (!request.noiDung.trim()) {
        throw new Error(
            "Nội dung câu hỏi không được để trống."
        );
    }


    if (!request.topicId) {
        throw new Error(
            "Vui lòng chọn Topic."
        );
    }


    if (!request.optionA.trim()) {
        throw new Error(
            "Đáp án A không được để trống."
        );
    }


    if (!request.optionB.trim()) {
        throw new Error(
            "Đáp án B không được để trống."
        );
    }


    if (!request.optionC.trim()) {
        throw new Error(
            "Đáp án C không được để trống."
        );
    }


    if (!request.optionD.trim()) {
        throw new Error(
            "Đáp án D không được để trống."
        );
    }


    if (!request.correctAnswer) {
        throw new Error(
            "Vui lòng chọn đáp án đúng."
        );
    }
}


function validateUpdateRequest(
    request: UpdateQuestionRequest
): void {

    validateCreateRequest(
        request
    );
}
