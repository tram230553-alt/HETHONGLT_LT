import {
    apiRequest,
} from "./apiClient";

export interface ImportSchoolStudentsResult {
    totalRows: number;
    inserted: number;
    updated: number;
    unchanged: number;
    failed: number;
    errors: string[];
}

export async function importSchoolStudents(
    file: File,
) {
    const formData =
        new FormData();

    formData.append(
        "file",
        file,
    );

    return apiRequest<
        ImportSchoolStudentsResult
    >(
        "/api/admin/school-students/import",
        {
            method: "POST",
            body: formData,
        },
    );
}