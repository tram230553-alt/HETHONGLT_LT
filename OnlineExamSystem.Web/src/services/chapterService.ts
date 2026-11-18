import { apiRequest } from "./apiClient";

export interface ChapterDto {
    id: string;
    name: string;
    order: number;
    subjectId: string;
    gradeId: string;
    topicCount: number;
}
export type ChapterRequest = Pick<ChapterDto, "name" | "order" | "subjectId" | "gradeId">;

export const chapterService = {
    get: (subjectId?: string, gradeId?: string) => {
        const params = new URLSearchParams();
        if (subjectId) params.set("subjectId", subjectId);
        if (gradeId) params.set("gradeId", gradeId);
        return apiRequest<ChapterDto[]>(`/api/chapters?${params}`);
    },
    create: (data: ChapterRequest) => apiRequest<string>("/api/chapters", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: ChapterRequest) => apiRequest<void>(`/api/chapters/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest<void>(`/api/chapters/${id}`, { method: "DELETE" }),
};
