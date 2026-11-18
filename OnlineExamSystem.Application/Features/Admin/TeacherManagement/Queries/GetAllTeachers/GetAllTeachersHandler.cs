using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Queries.GetAllTeachers
{
    public class GetAllTeachersHandler
    : IRequestHandler<GetAllTeachersQuery, List<TeacherDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllTeachersHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TeacherDto>> Handle(
    GetAllTeachersQuery request,
    CancellationToken cancellationToken)
        {
            return await _context.Teachers
                .AsNoTracking()
                .Select(x => new TeacherDto
                {
                    Id = x.Id,

                    HoTen =
                        x.User.Ho + " " +
                        x.User.TenDem + " " +
                        x.User.Ten,

                    Email = x.User.Email,

                    SDT = x.SDT,

                    SubjectId = x.SubjectId,

                    TenMH = x.Subject != null
                        ? x.Subject.TenMH
                        : null,

                    GradeId = x.GradeId,

                    TenKhoi = x.Grade != null
                        ? x.Grade.TenKhoi
                        : null,

                    IsLocked = x.User.IsLocked,

                    CreatedAt = x.User.CreatedAt,

                    QuestionsCount = _context.Questions
                        .Count(q => q.TeacherId == x.Id),

                    ExamsCount = _context.Exams
                        .Count(e => e.TeacherId == x.Id)
                })
                .ToListAsync(cancellationToken);
        }
    }
}
