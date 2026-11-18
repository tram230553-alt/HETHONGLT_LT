using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Grades;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Grades.Queries.GetAllGrades
{
    public class GetAllGradesHandler
    : IRequestHandler<
        GetAllGradesQuery,
        List<GradeDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllGradesHandler(
            IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<GradeDto>> Handle(
            GetAllGradesQuery request,
            CancellationToken cancellationToken)
        {
            return await _context.Grades
                .Select(x => new GradeDto
                {
                    Id = x.Id,
                    TenKhoi = x.TenKhoi
                })
                .ToListAsync(cancellationToken);
        }
    }
}
