using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin.StudentManagement.Commands.UnlockStudent
{
    public class UnlockStudentHandler
    : IRequestHandler<UnlockStudentCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public UnlockStudentHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(
            UnlockStudentCommand request,
            CancellationToken cancellationToken)
        {
            var student = await _context.Students
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Id == request.StudentId,
                    cancellationToken);

            if (student == null)
                throw new Exception("Student not found");

            student.User.IsLocked = false;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
