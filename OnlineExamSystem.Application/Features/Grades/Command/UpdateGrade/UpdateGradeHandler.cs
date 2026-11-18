using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Command.UpdateGrade
{
    public class UpdateGradeHandler
     : IRequestHandler<UpdateGradeCommand, string>
    {
        private readonly IApplicationDbContext _context;

        public UpdateGradeHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> Handle(
            UpdateGradeCommand request,
            CancellationToken cancellationToken)
        {
            var grade = await _context.Grades
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (grade == null)
                throw new Exception("Grade not found");

            grade.TenKhoi = request.TenKhoi;

            await _context.SaveChangesAsync(
                cancellationToken);

            return "Grade updated successfully";
        }
    }
}
