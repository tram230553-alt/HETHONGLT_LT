using MediatR;
using OnlineExamSystem.Application.DTOs.Students;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetMyProfile
{
    public class GetMyProfileQuery
    : IRequest<StudentProfileDto>
    {
    }
}
