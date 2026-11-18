import { apiRequest } from './apiClient';

export interface SystemSettings {
  systemName: string;
  schoolName: string;
  logoUrl: string;
  academicYear: string;
  gradeCount: number;
  subjectCount: number;
  defaultPracticeQuestionCount: number;
  allowPracticeRetake: boolean;
  defaultExamDurationMinutes: number;
  defaultExamQuestionCount: number;
  showExamResultAfterSubmit: boolean;
  sessionTimeoutMinutes: number;
  minimumPasswordLength: number;
  requireUppercasePassword: boolean;
  requireDigitPassword: boolean;
  updatedAt: string;
}

export type UpdateSystemSettings = Omit<SystemSettings, 'gradeCount' | 'subjectCount' | 'updatedAt'>;

export const getSystemSettings = () =>
  apiRequest<SystemSettings>('/api/admin/system-settings');

export const updateSystemSettings = (data: UpdateSystemSettings) =>
  apiRequest<SystemSettings>('/api/admin/system-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export interface ClientSystemSettings {
  systemName: string;
  schoolName: string;
  logoUrl: string;
  academicYear: string;
  defaultPracticeQuestionCount: number;
  allowPracticeRetake: boolean;
  defaultExamDurationMinutes: number;
  defaultExamQuestionCount: number;
  showExamResultAfterSubmit: boolean;
}

export const getClientSystemSettings = () =>
  apiRequest<ClientSystemSettings>('/api/system-settings');
