using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.DeleteGrade
{
    public class DeleteGradeHandler
    : IRequestHandler<DeleteGradeCommand, string>
    {
        private readonly IApplicationDbContext _context;

        public DeleteGradeHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
            DeleteGradeCommand request,
            CancellationToken cancellationToken)
        {
            var grade = await _context.Grades
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (grade == null)
                throw new Exception("Grade not found");

            _context.Grades.Remove(grade);

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Grade deleted successfully";
        }
    }
}
