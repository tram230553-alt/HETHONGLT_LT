import { apiRequest } from "./apiClient";

export interface TeacherQuestionDto {
    id: string;

    noiDung: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    correctAnswer: string;

    subjectId: string;

    // THÊM DÒNG NÀY
    topicId: string;

    createdBy: string;

    creatorName?: string;


    createdAt?: string;

    explanation?: string;
}

export interface SaveTeacherQuestionRequest {
  noiDung: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

export function getMyTeacherQuestions() {
  return apiRequest<TeacherQuestionDto[]>(
    "/api/questions/my",
  );
}

export function createTeacherQuestion(
  data: SaveTeacherQuestionRequest,
) {
  return apiRequest<string>(
    "/api/questions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function updateTeacherQuestion(
  id: string,
  data: SaveTeacherQuestionRequest,
) {
  return apiRequest<string>(
    `/api/questions/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export function deleteTeacherQuestion(
  id: string,
) {
  return apiRequest<string>(
    `/api/questions/${id}`,
    {
      method: "DELETE",
    },
  );
}
