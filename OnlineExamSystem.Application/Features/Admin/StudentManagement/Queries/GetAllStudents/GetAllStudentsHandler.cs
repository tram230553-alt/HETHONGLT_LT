using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Queries.GetAllStudents
{
    public class GetAllStudentsHandler
    : IRequestHandler<GetAllStudentsQuery, List<StudentProfileDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllStudentsHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StudentProfileDto>> Handle(
    GetAllStudentsQuery request,
    CancellationToken cancellationToken)
        {
            return await _context.Students

                .AsNoTracking()

                .Include(x => x.User)

                .Include(x => x.Grade)

                .Select(x => new StudentProfileDto
                {
                    Id = x.Id,

                    HoTen =
                        (
                            x.User.Ho + " " +
                            x.User.TenDem + " " +
                            x.User.Ten
                        ).Trim(),

                    Email =
                        x.User.Email,

                    MaHS =
                        x.MaHS,

                    NgaySinh =
                        x.NgaySinh,

                    GradeId =
                        x.GradeId,

                    TenKhoi =
                        x.Grade.TenKhoi,

                    IsLocked =
                        x.User.IsLocked,

                    CreatedAt =
                        x.User.CreatedAt
                })

                .OrderByDescending(
                    x => x.CreatedAt)

                .ToListAsync(
                    cancellationToken);
        }
    }
}
