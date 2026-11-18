using MediatR;
using OnlineExamSystem.Application.DTOs.Students;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyResults
{
    public class GetMyResultsQuery
    : IRequest<List<StudentResultDto>>
    {
    }
}
