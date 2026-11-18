using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetCommonWrongPracticeQuestions;

public class GetCommonWrongPracticeQuestionsQuery
    : IRequest<List<CommonWrongPracticeQuestionDto>>
{
    public int Limit { get; set; } = 20;
}
