using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetSavedQuestions;

public class GetSavedQuestionsQuery
    : IRequest<List<StudentSavedQuestionDto>>
{
}