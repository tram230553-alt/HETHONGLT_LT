using MediatR;
using OnlineExamSystem.Application.DTOs.Teachers;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyProfileQuery
{
    public class GetMyProfileQuery
    : IRequest<TeacherProfileDto>
    {
    }
}
