using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Exams;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetAvailableExams
{
    public class GetAvailableExamsHandler
    : IRequestHandler<
        GetAvailableExamsQuery,
        List<ExamDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public GetAvailableExamsHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<List<ExamDto>> Handle(
            GetAvailableExamsQuery request,
            CancellationToken cancellationToken)
        {
            var userId =
                Guid.Parse(_currentUser.UserId);

            var student =
                await _context.Students
                    .FirstOrDefaultAsync(
                        x => x.UserId == userId,
                        cancellationToken);

            if (student == null)
                throw new Exception(
                    "Student not found");

            return await (
    from exam in _context.Exams
    join subject in _context.Subjects
        on exam.SubjectId equals subject.Id
    join grade in _context.Grades
        on exam.GradeId equals grade.Id
    join teacher in _context.Teachers
        on exam.TeacherId equals teacher.Id
    join user in _context.Users
        on teacher.UserId equals user.Id
    where exam.GradeId == student.GradeId
          && exam.IsPublished
    select new ExamDto
    {
        Id = exam.Id,

        MonHoc = subject.TenMH,

        Khoi = grade.TenKhoi,

        GiaoVien = user.Ho + " " + user.TenDem + " " + user.Ten,

        TenBaiKT = exam.TenBaiKT,

        ThoiLuong = exam.ThoiLuong,

        TotalQuestions = exam.ExamQuestions.Count(),

        IsSubmittedForApproval = exam.IsSubmittedForApproval,

        IsPublished = exam.IsPublished
    })
    .OrderBy(x => x.MonHoc)
    .ThenBy(x => x.TenBaiKT)
    .ToListAsync(cancellationToken);
        }
        }
}
