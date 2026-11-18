export type UserRole =
    | 'admin'
    | 'teacher'
    | 'student';

export const ACCESS_TOKEN_KEY =
    'accessToken';

const ROLE_CLAIM_KEYS = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

export function normalizeRole(
    value: unknown,
): UserRole | null {
    const candidates =
        Array.isArray(value)
            ? value
            : [value];

    for (const candidate of candidates) {
        const role =
            String(candidate ?? '')
                .trim()
                .toLowerCase();

        if (
            role === 'admin' ||
            role === 'administrator'
        ) {
            return 'admin';
        }

        if (
            role === 'teacher' ||
            role === 'giaovien' ||
            role === 'giáo viên'
        ) {
            return 'teacher';
        }

        if (
            role === 'student' ||
            role === 'hocsinh' ||
            role === 'học sinh'
        ) {
            return 'student';
        }
    }

    return null;
}

function getJwtPayload(
    token: string,
): Record<string, unknown> | null {
    try {
        const payloadPart =
            token.split('.')[1];

        if (!payloadPart) {
            return null;
        }

        const normalized =
            payloadPart
                .replace(/-/g, '+')
                .replace(/_/g, '/');

        const padded =
            normalized.padEnd(
                Math.ceil(
                    normalized.length / 4,
                ) * 4,
                '=',
            );

        return JSON.parse(
            atob(padded),
        ) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function getRoleFromJwt(
    token: string | null | undefined,
): UserRole | null {
    if (!token) {
        return null;
    }

    const payload =
        getJwtPayload(token);

    if (!payload) {
        return null;
    }

    for (
        const key of ROLE_CLAIM_KEYS
    ) {
        const role =
            normalizeRole(payload[key]);

        if (role) {
            return role;
        }
    }

    return null;
}

export function isTokenExpired(
    token: string | null | undefined,
): boolean {
    if (!token) {
        return true;
    }

    const payload =
        getJwtPayload(token);

    if (!payload) {
        return true;
    }

    const exp = payload.exp;

    if (typeof exp !== 'number') {
        return true;
    }

    return exp * 1000 <= Date.now();
}

export function hasValidSession():
    boolean {
    const token =
        localStorage.getItem(
            ACCESS_TOKEN_KEY,
        );

    return Boolean(
        token &&
        !isTokenExpired(token) &&
        getRoleFromJwt(token),
    );
}

export function getStoredRole():
    UserRole | null {
    const token =
        localStorage.getItem(
            ACCESS_TOKEN_KEY,
        );

    if (
        !token ||
        isTokenExpired(token)
    ) {
        return null;
    }

    return getRoleFromJwt(token);
}

export function saveSession(
    email: string,
    role: UserRole,
    token: string,
    userId?: string,
): void {
    localStorage.setItem(
        ACCESS_TOKEN_KEY,
        token,
    );

    localStorage.setItem(
        'smartexam_logged_in',
        'true',
    );

    localStorage.setItem(
        'smartexam_session_email',
        email,
    );

    localStorage.setItem(
        'smartexam_session_role',
        role,
    );

    if (userId) {
        localStorage.setItem(
            'smartexam_user_id',
            userId,
        );
    } else {
        localStorage.removeItem(
            'smartexam_user_id',
        );
    }

    // Xóa token key cũ của project.
    localStorage.removeItem(
        'smartexam_access_token',
    );
}

export function clearSession():
    void {
    localStorage.removeItem(
        ACCESS_TOKEN_KEY,
    );

    // Dọn luôn key cũ.
    localStorage.removeItem(
        'smartexam_access_token',
    );

    localStorage.removeItem(
        'smartexam_logged_in',
    );

    localStorage.removeItem(
        'smartexam_session_role',
    );

    localStorage.removeItem(
        'smartexam_session_email',
    );

    localStorage.removeItem(
        'smartexam_user_id',
    );
}