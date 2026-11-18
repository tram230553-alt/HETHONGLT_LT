import {
    apiRequest,
} from "./apiClient";

export interface TeacherProfileDto {
    id: string;
    hoTen: string;
    email: string;
    sdt: string;
    subjectId: string;
    gradeId: string;
    tenMH: string;
    tenKhoi: string;
    receiveAdminNotifications: boolean;
    examApprovalNotifications: boolean;
    studentSubmissionNotifications: boolean;
    emailNotifications: boolean;
    systemNotifications: boolean;
    themePreference: 'light' | 'dark' | 'auto';
    autoSaveEnabled: boolean;
    recentAccountActivities: TeacherAccountActivityDto[];
}

export interface TeacherAccountActivityDto {
    description: string;
    createdAt: string;
}

export interface UpdateTeacherProfileRequest {
    sdt: string;
}

export interface UpdateTeacherSettingsRequest {
    receiveAdminNotifications: boolean;
    examApprovalNotifications: boolean;
    studentSubmissionNotifications: boolean;
    emailNotifications: boolean;
    systemNotifications: boolean;
    themePreference: 'light' | 'dark' | 'auto';
    autoSaveEnabled: boolean;
}

// THÊM PHẦN NÀY
export interface ChangeTeacherPasswordRequest {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function getTeacherProfile() {
    return apiRequest<TeacherProfileDto>(
        "/api/teachers/profile",
    );
}

export function updateTeacherProfile(
    data: UpdateTeacherProfileRequest,
) {
    return apiRequest<string>(
        "/api/teachers/profile",
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
    );
}

export function updateTeacherSettings(data: UpdateTeacherSettingsRequest) {
    return apiRequest<string>("/api/teachers/settings", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// THÊM HÀM NÀY
export function changeTeacherPassword(
    request: ChangeTeacherPasswordRequest,
) {
    return apiRequest<string>(
        "/api/users/change-password",
        {
            method: "PUT",
            body: JSON.stringify(request),
        },
    );
}
