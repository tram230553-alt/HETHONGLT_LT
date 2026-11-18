using MediatR;
using OnlineExamSystem.Application.DTOs.Students;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Queries.GetAllStudents
{
    public class GetAllStudentsQuery : IRequest<List<StudentProfileDto>>
    {
    }
}
