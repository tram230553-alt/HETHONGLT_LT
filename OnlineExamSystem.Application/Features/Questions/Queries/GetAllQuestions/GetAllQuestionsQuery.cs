using MediatR;
using OnlineExamSystem.Application.DTOs.Questions;

public record GetQuestionsQuery(
    Guid? SubjectId,
    Guid? GradeId,
    Guid? TopicId
) : IRequest<List<QuestionDto>>;