using MediatR;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetResultDetail
{
    public class GetResultDetailQuery
        : IRequest<ResultDetailDto>
    {
        public Guid ExamId { get; set; }

        public Guid? ExamResultId { get; set; }
    }
}
