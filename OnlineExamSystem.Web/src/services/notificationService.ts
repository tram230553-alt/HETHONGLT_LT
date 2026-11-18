import { apiRequest } from './apiClient';

export type NotificationTargetRole = 'All' | 'Teacher' | 'Student';
export type NotificationPriority = 'Normal' | 'Important' | 'Urgent';
export type NotificationStatus = 'Draft' | 'Sent';

export interface NotificationDto {
  id: string;
  title: string;
  content: string;
  targetRole: NotificationTargetRole;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  sentAt: string | null;
  isRead: boolean;
  readAt: string | null;
  readCount: number;
  recipientCount: number;
}

export interface SaveNotificationRequest {
  title: string;
  content: string;
  targetRole: NotificationTargetRole;
  priority: NotificationPriority;
  status: NotificationStatus;
}

export const getNotifications = () => apiRequest<NotificationDto[]>('/api/notifications');
export const createNotification = (data: SaveNotificationRequest) => apiRequest<NotificationDto>('/api/notifications', { method: 'POST', body: JSON.stringify(data) });
export const updateNotification = (id: string, data: SaveNotificationRequest) => apiRequest<NotificationDto>(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteNotification = (id: string) => apiRequest<void>(`/api/notifications/${id}`, { method: 'DELETE' });
export const markNotificationRead = (id: string) => apiRequest<void>(`/api/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () => apiRequest<void>('/api/notifications/read-all', { method: 'PUT' });
