using MediatR;
using OnlineExamSystem.Application.DTOs.Subjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Queries.GetAllSubjects
{
    public class GetAllSubjectsQuery
    : IRequest<List<SubjectDto>>
    {
    }
}
