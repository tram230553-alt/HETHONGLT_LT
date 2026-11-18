import { apiRequest } from './apiClient';
export interface AuditLogDto { id:string; userId:string|null; userEmail:string; role:string; method:string; path:string; statusCode:number; ipAddress:string; createdAt:string; }
export const getAuditLogs = (search='', role='') => apiRequest<AuditLogDto[]>(`/api/admin/audit-logs?search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}&limit=300`);
