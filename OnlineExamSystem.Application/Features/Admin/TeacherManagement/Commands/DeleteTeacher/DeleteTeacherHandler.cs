using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.DeleteTeacher
{
    public class DeleteTeacherHandler
    : IRequestHandler<
        DeleteTeacherCommand,
        string>
    {
        private readonly IApplicationDbContext _context;

        public DeleteTeacherHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
            DeleteTeacherCommand request,
            CancellationToken cancellationToken)
        {
            var teacher = await _context.Teachers
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.TeacherId,
                    cancellationToken);

            if (teacher == null)
                throw new Exception("Teacher not found");

            _context.Teachers.Remove(teacher);

            _context.Users.Remove(teacher.User);

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Teacher deleted successfully";
        }
    }
}
