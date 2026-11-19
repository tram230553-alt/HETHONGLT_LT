import { apiUrl } from "../api";
import { jwtDecode } from "jwt-decode";

export type AppRole =
    | "admin"
    | "teacher"
    | "student";

export interface LoginRequest {
    // Student: MaHS. Admin/Teacher: email.
    identifier: string;
    password: string;
}

interface JwtPayload {
    role?: string;
    email?: string;
    nameid?: string;
    unique_name?: string;
    name?: string;
    student_code?: string;
    exp?: number;

    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;

    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;

    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;

    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
}

export interface LoginResult {
    token: string;
    role: AppRole;
    email: string;
    userId: string;
    name: string;
    studentCode?: string;
}

export interface RegisterStudentRequest {
    maHS: string;
    ho: string;
    tenDem: string;
    ten: string;
    ngaySinh: string;
    email: string;
    password: string;
}

function normalizeToken(rawToken: string): string {
    let token = rawToken.trim();

    if (
        token.startsWith('"') &&
        token.endsWith('"')
    ) {
        token = JSON.parse(token) as string;
    }

    return token;
}

function extractRole(
    payload: JwtPayload,
): AppRole {
    const rawRole =
        payload.role ??
        payload[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ];

    const role =
        rawRole?.trim().toLowerCase();

    if (
        role !== "admin" &&
        role !== "teacher" &&
        role !== "student"
    ) {
        throw new Error(
            `JWT không chứa role hợp lệ: ${rawRole ?? "không có"}`,
        );
    }

    return role;
}

export async function login(
    request: LoginRequest,
): Promise<LoginResult> {
    const response = await fetch(
        apiUrl("/api/auth/login"),
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                identifier:
                    request.identifier,
                matKhau:
                    request.password,
            }),
        },
    );

    if (!response.ok) {
        let message =
            "Mã học sinh/email hoặc mật khẩu không chính xác.";

        try {
            const body =
                await response.json() as {
                    message?: string;
                };

            if (body?.message) {
                message = body.message;
            }
        } catch {
            // Giữ thông báo mặc định.
        }

        throw new Error(message);
    }

    const rawToken =
        await response.text();

    const token =
        normalizeToken(rawToken);

    if (!token) {
        throw new Error(
            "Backend không trả JWT token.",
        );
    }

    let payload: JwtPayload;

    try {
        payload =
            jwtDecode<JwtPayload>(token);
    } catch {
        throw new Error(
            "Token backend trả về không hợp lệ.",
        );
    }

    if (
        payload.exp &&
        payload.exp * 1000 <= Date.now()
    ) {
        throw new Error(
            "Token đã hết hạn.",
        );
    }

    const role = extractRole(payload);

    const email =
        payload.email ??
        payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ] ??
        "";

    const userId =
        payload.nameid ??
        payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ??
        "";

    const name =
        payload.unique_name ??
        payload.name ??
        payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] ??
        email;

    return {
        token,
        role,
        email,
        userId,
        name,
        studentCode:
            payload.student_code,
    };
}

export async function registerStudent(
    request: RegisterStudentRequest,
): Promise<string> {
    const response = await fetch(
        apiUrl("/api/auth/register"),
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                maHS:
                    request.maHS,
                ho:
                    request.ho,
                tenDem:
                    request.tenDem,
                ten:
                    request.ten,
                ngaySinh:
                    request.ngaySinh,
  
                email:
                    request.email,
                matKhau:
                    request.password,
            }),
        },
    );

    const rawText =
        await response.text();

    if (!response.ok) {
        let message =
            rawText ||
            "Đăng ký tài khoản thất bại.";

        try {
            const body =
                JSON.parse(rawText) as {
                    message?: string;
                };

            if (body.message) {
                message = body.message;
            }
        } catch {
            // Backend có thể trả plain text.
        }

        throw new Error(message);
    }

    if (!rawText) {
        return "Đăng ký thành công";
    }

    try {
        return JSON.parse(rawText) as string;
    } catch {
        return rawText;
    }
}

export interface ResetPasswordRequest {
    // Học sinh: mã học sinh. Giáo viên: email.
    identifier: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
}

async function postAuthMessage(
    endpoint: string,
    payload: unknown,
    fallbackError: string,
): Promise<string> {
    const response = await fetch(
        apiUrl(endpoint),
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(payload),
        },
    );

    const rawText =
        await response.text();

    let message = "";

    try {
        const body =
            JSON.parse(rawText) as {
                message?: string;
            };

        message = body?.message ?? "";
    } catch {
        // Backend có thể trả plain text hoặc rỗng.
    }

    if (!response.ok) {
        throw new Error(
            message ||
            (response.status === 429
                ? "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút."
                : fallbackError),
        );
    }

    return message;
}

// Bước 1: gửi mã xác nhận tới email đăng ký của tài khoản.
export function requestPasswordReset(
    identifier: string,
): Promise<string> {
    return postAuthMessage(
        "/api/auth/forgot-password",
        { identifier },
        "Không thể gửi mã xác nhận. Vui lòng thử lại.",
    );
}

// Bước 2: nhập mã xác nhận và mật khẩu mới.
export function resetPassword(
    request: ResetPasswordRequest,
): Promise<string> {
    return postAuthMessage(
        "/api/auth/reset-password",
        {
            identifier: request.identifier,
            code: request.code,
            newPassword: request.newPassword,
            confirmPassword: request.confirmPassword,
        },
        "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
    );
}
