using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.UpdateSubject
{
    public class UpdateSubjectHandler
    : IRequestHandler<UpdateSubjectCommand, string>
    {
        private readonly IApplicationDbContext _context;

        public UpdateSubjectHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
            UpdateSubjectCommand request,
            CancellationToken cancellationToken)
        {
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (subject == null)
                throw new Exception("Subject not found");

            subject.TenMH = request.TenMH;

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Subject updated successfully";
        }
    }
}
