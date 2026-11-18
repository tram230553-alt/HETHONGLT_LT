using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Subjects.Commands.CreateSubject
{
    public class CreateSubjectHandler
    : IRequestHandler<CreateSubjectCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateSubjectHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(
            CreateSubjectCommand request,
            CancellationToken cancellationToken)
        {
            var subject = new Subject
            {
                Id = Guid.NewGuid(),
                TenMH = request.TenMH
            };

            _context.Subjects.Add(subject);

            await _context.SaveChangesAsync(cancellationToken);

            return subject.Id;
        }
    }
}
