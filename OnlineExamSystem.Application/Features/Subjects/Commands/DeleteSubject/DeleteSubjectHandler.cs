using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.DeleteSubject
{
    public class DeleteSubjectHandler
    : IRequestHandler<DeleteSubjectCommand, string>
    {
        private readonly IApplicationDbContext _context;

        public DeleteSubjectHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
            DeleteSubjectCommand request,
            CancellationToken cancellationToken)
        {
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (subject == null)
                throw new Exception("Subject not found");

            _context.Subjects.Remove(subject);

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Subject deleted successfully";
        }
    }
}
