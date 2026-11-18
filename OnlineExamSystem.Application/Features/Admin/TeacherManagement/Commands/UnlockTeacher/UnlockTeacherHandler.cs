using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.TeacherManagement.Commands.UnlockTeacher
{
    public class UnlockTeacherHandler
    : IRequestHandler<UnlockTeacherCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UnlockTeacherHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(
            UnlockTeacherCommand request,
            CancellationToken cancellationToken)
        {
            var teacher = await _context.Teachers
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.TeacherId,
                    cancellationToken);

            if (teacher == null)
                throw new Exception("Teacher not found");

            teacher.User.IsLocked = false;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
    }
