import { apiRequest } from './apiClient';
export interface AiTopic { id: string; name: string; chapterName: string; subjectName: string; gradeName: string; }
export interface AiDraftQuestion { noiDung: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; explanation: string; }
export const getAiTopics = () => apiRequest<AiTopic[]>('/api/ai/topics');
export const askAi = (message: string, topicId?: string, history: {role: string; text: string}[] = []) =>
  apiRequest<{text: string}>('/api/ai/ask', {method: 'POST', body: JSON.stringify({message, topicId: topicId || null, history})});
export const generateAiQuestions = (topicId: string, count: number, difficulty: string, requirements: string) =>
  apiRequest<{questions: AiDraftQuestion[]}>('/api/ai/generate-questions', {method: 'POST', body: JSON.stringify({topicId, count, difficulty, requirements})});
export const saveAiQuestion = (question: AiDraftQuestion, topicId: string, difficulty: string) =>
  apiRequest<string>('/api/questions', {method: 'POST', body: JSON.stringify({...question, topicId, difficulty, type: 'single_choice'})});
