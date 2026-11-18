using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.LockStudent
{
    public class LockStudentHandler
    : IRequestHandler<LockStudentCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public LockStudentHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(
            LockStudentCommand request,
            CancellationToken cancellationToken)
        {
            var student = await _context.Students
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.StudentId,
                    cancellationToken);

            if (student == null)
                throw new Exception("Student not found");

            student.User.IsLocked = true;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
