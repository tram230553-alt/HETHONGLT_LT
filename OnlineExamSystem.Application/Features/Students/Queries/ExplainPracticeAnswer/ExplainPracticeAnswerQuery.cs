using MediatR;

namespace OnlineExamSystem.Application.Features.Students.Queries.ExplainPracticeAnswer;

public record ExplainPracticeAnswerQuery(Guid AttemptId, Guid QuestionId)
    : IRequest<PracticeAnswerExplanationDto>;

public record PracticeAnswerExplanationDto(
    Guid QuestionId, string Text, bool IsFallback = false, string? Notice = null);
