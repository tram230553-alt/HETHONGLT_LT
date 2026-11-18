using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students
    .Queries.GetWrongQuestions;

public class GetWrongQuestionsQuery
    : IRequest<List<StudentWrongQuestionDto>>
{
}