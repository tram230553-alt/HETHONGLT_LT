using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.CreateGrade
{
    public class CreateGradeHandler
    : IRequestHandler<CreateGradeCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateGradeHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(
            CreateGradeCommand request,
            CancellationToken cancellationToken)
        {
            var grade = new Grade
            {
                Id = Guid.NewGuid(),
                TenKhoi = request.TenKhoi
            };

            _context.Grades.Add(grade);

            await _context.SaveChangesAsync(
                cancellationToken);

            return grade.Id;
        }
    }
}
