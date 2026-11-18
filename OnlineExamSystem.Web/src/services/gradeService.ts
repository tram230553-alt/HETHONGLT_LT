import {
    apiRequest,
} from "./apiClient";

export interface GradeDto {
    id: string;
    tenKhoi: string;
}

export async function getGrades():
    Promise<GradeDto[]> {
    return apiRequest<GradeDto[]>(
        "/api/grades",
    );
}

export async function createGrade(
    tenKhoi: string,
): Promise<string> {
    return apiRequest<string>(
        "/api/grades",
        {
            method: "POST",
            body: JSON.stringify({
                tenKhoi,
            }),
        },
    );
}

export async function updateGrade(
    id: string,
    tenKhoi: string,
): Promise<string> {
    return apiRequest<string>(
        `/api/grades/${id}`,
        {
            method: "PUT",
            body: JSON.stringify({
                tenKhoi,
            }),
        },
    );
}

export async function deleteGrade(
    id: string,
): Promise<string> {
    return apiRequest<string>(
        `/api/grades/${id}`,
        {
            method: "DELETE",
        },
    );
}