using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetExamWrongQuestions;

public class GetExamWrongQuestionsQuery : IRequest<ExamWrongQuestionStatsDto>
{
    /// <summary>Để trống = thống kê gộp mọi đề của giáo viên.</summary>
    public Guid? ExamId { get; set; }

    public int Limit { get; set; } = 100;
}
