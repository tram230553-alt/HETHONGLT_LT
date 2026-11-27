import { apiRequest } from "./apiClient";

/* =========================================================
   TOPIC DTO
========================================================= */

export interface TopicDto {
    id: string;

    name: string;

    description: string | null;

    subjectId: string;
    subjectName: string;

    gradeId: string;
    gradeName: string;

    isActive: boolean;

    questionCount: number;
    chessQuestionCount?: number;
    wordPuzzleQuestionCount?: number;
    chapterId: string;
    chapterName: string;
    chapterOrder: number;
    orderNum: number;
}


/* =========================================================
   CREATE TOPIC
========================================================= */

export interface CreateTopicRequest {
    name: string;

    description?: string | null;

    subjectId: string;

    gradeId: string;

    isActive: boolean;
    chapterId: string;
    orderNum: number;
}


/* =========================================================
   UPDATE TOPIC
========================================================= */

export interface UpdateTopicRequest {
    name: string;

    description?: string | null;

    subjectId: string;

    gradeId: string;

    isActive: boolean;
    chapterId: string;
    orderNum: number;
}


/* =========================================================
   GET TOPICS
========================================================= */

/**
 * Lấy Topic theo Subject và Grade.
 *
 * Ví dụ:
 *
 * /api/topics?subjectId=GUID_SUBJECT&gradeId=GUID_GRADE
 */
export async function getTopics(
    subjectId?: string,
    gradeId?: string,
): Promise<TopicDto[]> {

    const params = new URLSearchParams();


    /* =========================
       SUBJECT
    ========================= */

    if (subjectId?.trim()) {

        params.append(
            "subjectId",
            subjectId.trim(),
        );
    }


    /* =========================
       GRADE
    ========================= */

    if (gradeId?.trim()) {

        params.append(
            "gradeId",
            gradeId.trim(),
        );
    }


    const queryString =
        params.toString();


    const endpoint =
        queryString.length > 0
            ? `/api/topics?${queryString}`
            : `/api/topics`;


    console.log(
        "GET TOPICS:",
        endpoint,
    );


    const result =
        await apiRequest<unknown>(
            endpoint,
            {
                method: "GET",
            },
        );


    /* =========================
       VALIDATE RESPONSE
    ========================= */

    if (!Array.isArray(result)) {

        console.error(
            "TOPIC API RESPONSE KHÔNG PHẢI ARRAY:",
            result,
        );

        throw new Error(
            "API Topic trả về dữ liệu không hợp lệ.",
        );
    }


    return result as TopicDto[];
}


/* =========================================================
   CREATE TOPIC
========================================================= */

export async function createTopic(
    request: CreateTopicRequest,
): Promise<string> {

    return await apiRequest<string>(
        "/api/topics",
        {
            method: "POST",

            body: JSON.stringify(request),
        },
    );
}


/* =========================================================
   UPDATE TOPIC
========================================================= */

export async function updateTopic(
    id: string,
    request: UpdateTopicRequest,
): Promise<void> {

    await apiRequest<void>(
        `/api/topics/${id}`,
        {
            method: "PUT",

            body: JSON.stringify(request),
        },
    );
}


/* =========================================================
   DELETE TOPIC
========================================================= */

export async function deleteTopic(
    id: string,
): Promise<void> {

    await apiRequest<void>(
        `/api/topics/${id}`,
        {
            method: "DELETE",
        },
    );
}


/* =========================================================
   SERVICE OBJECT
========================================================= */

export const topicService = {

    /**
     * Lấy Topic theo môn + khối.
     */
    async getTopics(
        subjectId?: string,
        gradeId?: string,
    ): Promise<TopicDto[]> {

        return await getTopics(
            subjectId,
            gradeId,
        );
    },
    /**
     * Lấy Topic cho student
     */
    async getStudentTopics(
        subjectId?: string,
    ): Promise<TopicDto[]> {

        return await getStudentTopics(
            subjectId,
        );
    },

    /**
     * Tạo Topic.
     */
    async createTopic(
        request: CreateTopicRequest,
    ): Promise<string> {

        return await createTopic(request);
    },


    /**
     * Cập nhật Topic.
     */
    async updateTopic(
        id: string,
        request: UpdateTopicRequest,
    ): Promise<void> {

        return await updateTopic(
            id,
            request,
        );
    },


    /**
     * Xóa Topic.
     */
    async deleteTopic(
        id: string,
    ): Promise<void> {

        return await deleteTopic(id);
    },

};
/* =========================================================
   GET STUDENT
========================================================= */
export async function getStudentTopics(
    subjectId?: string,
): Promise<TopicDto[]> {

    const params = new URLSearchParams();

    if (subjectId?.trim()) {
        params.append(
            "subjectId",
            subjectId.trim(),
        );
    }

    const queryString =
        params.toString();

    const endpoint =
        queryString
            ? `/api/students/topics?${queryString}`
            : `/api/students/topics`;

    console.log(
        "GET STUDENT TOPICS:",
        endpoint,
    );

    const result =
        await apiRequest<unknown>(
            endpoint,
            {
                method: "GET",
            },
        );

    if (!Array.isArray(result)) {

        throw new Error(
            "API Student Topics trả về dữ liệu không hợp lệ.",
        );
    }

    return result as TopicDto[];
}