using MediatR;
using OnlineExamSystem.Application.DTOs.Subjects;
using System;

namespace OnlineExamSystem.Application.Features.Subjects.Queries.GetSubjectDetail
{
    public class GetSubjectDetailQuery : IRequest<SubjectDetailDto>
    {
        public Guid Id { get; set; }
    }
}
