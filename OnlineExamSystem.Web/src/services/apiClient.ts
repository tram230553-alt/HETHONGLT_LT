import { apiUrl } from "../api";
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token =
        localStorage.getItem("accessToken");

    const headers =
        new Headers(options.headers);

    const isFormData =
        typeof FormData !== "undefined" &&
        options.body instanceof FormData;

    if (
        !headers.has("Content-Type") &&
        !isFormData
    ) {
        headers.set(
            "Content-Type",
            "application/json",
        );
    }

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`,
        );
    }

    const response = await fetch(
        apiUrl(endpoint),
        {
            ...options,
            headers,
        },
    );

    const rawText =
        await response.text();

    if (response.status === 401) {
        localStorage.removeItem(
            "accessToken",
        );

        localStorage.removeItem(
            "smartexam_logged_in",
        );

        localStorage.removeItem(
            "smartexam_session_role",
        );

        localStorage.removeItem(
            "smartexam_session_email",
        );

        localStorage.removeItem(
            "smartexam_user_id",
        );

        window.location.href = "/";

        throw new Error(
            "Phiên đăng nhập đã hết hạn.",
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Bạn không có quyền thực hiện chức năng này.",
        );
    }

    if (!response.ok) {
        let errorMessage =
            `Yêu cầu thất bại: HTTP ${response.status}`;

        if (rawText) {
            try {
                const errorData = JSON.parse(rawText) as {
                    message?: string;
                    title?: string;
                };

                errorMessage =
                    errorData.message ||
                    errorData.title ||
                    errorMessage;
            } catch {
                errorMessage = rawText;
            }
        }

        throw new Error(errorMessage);
    }

    if (!rawText) {
        return undefined as T;
    }

    const contentType =
        response.headers.get(
            "content-type",
        ) ?? "";

    if (
        contentType.includes(
            "application/json",
        )
    ) {
        try {
            return JSON.parse(
                rawText,
            ) as T;
        } catch {
            return rawText as T;
        }
    }

    return rawText as T;
}