using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetStudentPracticeResults;

public class GetStudentPracticeResultsQuery
    : IRequest<List<TeacherStudentPracticeResultDto>>
{
}