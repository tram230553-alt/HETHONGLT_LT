/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone: string;

    subjectId: string;
    subjectName: string;

    gradeId?: string;
    gradeName?: string;

    status:
    | "active"
    | "inactive";

    joinedDate: string;

    questionsContributed: number;
    examsCreated: number;
}

export interface Student {
    id: string;

    name: string;

    email: string;

    // Backend Student hiện chưa có SĐT.
    phone: string;

    // Backend hiện chưa có lớp cụ thể như 9A1.
    className: string;

    grade: string;

    // Dữ liệu thật từ API.
    gradeId?: string;

    gradeName?: string;

    studentCode?: string;

    birthDate?: string;

    status:
    | "active"
    | "inactive";

    joinedDate: string;

    // Chưa nối API thống kê.
    examsCompleted: number;

    averageScore: number;

    targetScore: string;

    progress?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  chaptersCount: number;
  topicsCount: number;
  questionsCount: number;
  examsCount?: number;
  studentsCount?: number;
  status: 'active' | 'inactive';
  icon: string; // lucide icon name
}

export interface Topic {
    id: string;

    name: string;

    description?: string | null;

    subjectId: string;
    subjectName: string;

    gradeId: string;
    gradeName: string;

    isActive: boolean;

    questionsCount: number;

    createdAt: string;
    updatedAt?: string | null;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'essay' | 'true_false';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'approved' | 'pending' | 'draft' | 'rejected' | 'locked';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // MCQs
  correctAnswer: string | string[]; // depending on type
  difficulty: QuestionDifficulty;
  subjectId: string;
  topicId: string;
  createdBy: string; // Teacher or Admin
  creatorName: string; // Add creator name for UI
  status: QuestionStatus;
  createdAt: string;
  explanation?: string; // Add explanation for UI drawer
}

export type ExamStatus = 'scheduled' | 'draft' | 'pending' | 'approved' | 'official' | 'rejected';

export interface Exam {
  id: string;
  title: string;
  code: string;
  subjectId: string;
  subjectName: string;
  creatorId: string;
  creatorName: string;
  duration: number; // in minutes
  totalQuestions: number;
  totalMarks: number;
  status: ExamStatus;
  difficulty: QuestionDifficulty;
  createdAt: string; // added to match request
  startDate?: string;
  attemptsCount: number;
  passingScore: number; // e.g. 50
  questionsList: string[]; // Question IDs
  rejectionReason?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number; // percentage
  timeSpent: number; // in minutes
  date: string;
  status: 'passed' | 'failed';
}

export interface NotificationAttachment {
  name: string;
  size: string;
  type: string; // 'pdf' | 'docx' | 'xlsx' | 'image'
  url?: string;
}

export interface ReadReceipt {
  teacherId: string;
  teacherName: string;
  read: boolean;
  readAt?: string; // ISO string or formatted locale date string
}

export interface SystemNotification {
  id: string;
  title: string;
  content: string; // Rich text / markdown/ text body
  senderId: string;
  senderName: string;
  recipientType: 'all' | 'subject' | 'group' | 'specific';
  recipientValue?: string; // string representation or comma separated IDs
  recipientLabel: string; // e.g. "Toàn bộ giáo viên" or "Môn Vật lý"
  priority: 'normal' | 'important' | 'urgent';
  status: 'draft' | 'sent';
  createdAt: string; // ISO string
  sentAt?: string; // ISO string
  attachments: NotificationAttachment[];
  readReceipts: ReadReceipt[];
}
