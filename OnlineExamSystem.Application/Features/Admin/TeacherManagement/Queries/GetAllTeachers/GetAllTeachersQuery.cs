using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetAllTeachers
{
    public class GetAllTeachersQuery : IRequest<List<TeacherDto>>
    {
    }
}
