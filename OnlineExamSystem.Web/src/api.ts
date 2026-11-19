const RAW_API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || ""
).trim();

export const API_BASE_URL = RAW_API_BASE_URL
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

export function apiUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
        return endpoint;
    }

    const path = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;

    return `${API_BASE_URL}${path}`;
}

