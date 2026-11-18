using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.UpdateTeacher
{
    public class UpdateTeacherHandler
    : IRequestHandler<
        UpdateTeacherCommand,
        string>
    {
        private readonly IApplicationDbContext _context;

        public UpdateTeacherHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
    UpdateTeacherCommand request,
    CancellationToken cancellationToken)
        {
            var teacher = await _context.Teachers
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.TeacherId,
                    cancellationToken);

            if (teacher == null)
            {
                throw new Exception(
                    "Teacher not found");
            }

            var email = request.Email.Trim();

            if (string.IsNullOrWhiteSpace(email))
            {
                throw new Exception(
                    "Email không được để trống");
            }

            var emailExists =
                await _context.Users
                    .AnyAsync(
                        x =>
                            x.Email == email &&
                            x.Id != teacher.UserId,
                        cancellationToken);

            if (emailExists)
            {
                throw new Exception(
                    "Email đã tồn tại");
            }

            var subjectExists =
                await _context.Subjects
                    .AnyAsync(
                        x =>
                            x.Id ==
                            request.SubjectId,
                        cancellationToken);

            if (!subjectExists)
            {
                throw new Exception(
                    "Môn học không tồn tại");
            }

            var gradeExists =
                await _context.Grades
                    .AnyAsync(
                        x =>
                            x.Id ==
                            request.GradeId,
                        cancellationToken);

            if (!gradeExists)
            {
                throw new Exception(
                    "Khối lớp không tồn tại");
            }

            // Admin chỉ được sửa 3 trường này.
            teacher.User.Email = email;

            teacher.SubjectId =
                request.SubjectId;

            teacher.GradeId =
                request.GradeId;

            await _context.SaveChangesAsync(
                cancellationToken);

            return
                "Teacher updated successfully";
        }
    }
}
