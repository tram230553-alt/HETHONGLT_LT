using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.LockTeacher
{
    public class LockTeacherHandler
    : IRequestHandler<LockTeacherCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public LockTeacherHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(
            LockTeacherCommand request,
            CancellationToken cancellationToken)
        {
            var teacher = await _context.Teachers
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.TeacherId,
                    cancellationToken);

            if (teacher == null)
                throw new Exception("Teacher not found");

            teacher.User.IsLocked = true;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
