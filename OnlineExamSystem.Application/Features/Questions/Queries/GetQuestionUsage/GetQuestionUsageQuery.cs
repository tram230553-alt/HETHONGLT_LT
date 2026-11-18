using MediatR;
using OnlineExamSystem.Application.DTOs.Questions;

namespace OnlineExamSystem.Application.Features.Questions.Queries.GetQuestionUsage;

public class GetQuestionUsageQuery : IRequest<QuestionUsageDto>
{
    public Guid Id { get; set; }
}
