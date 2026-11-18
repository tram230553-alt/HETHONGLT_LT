using MediatR;
using OnlineExamSystem.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

public class GetTopicsQueryHandler
    : IRequestHandler<GetTopicsQuery, List<TopicDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTopicsQueryHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TopicDto>> Handle(
        GetTopicsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Topics
            .AsNoTracking()
            .Include(x => x.Subject)
            .Include(x => x.Grade)
            .AsQueryable();

        if (request.SubjectId.HasValue)
        {
            query = query.Where(x =>
                x.SubjectId == request.SubjectId.Value);
        }

        if (request.GradeId.HasValue)
        {
            query = query.Where(x =>
                x.GradeId == request.GradeId.Value);
        }

        return await query
    .OrderBy(x => x.SubjectId)
    .ThenBy(x => x.Chapter.Order)
    .ThenBy(x => x.OrderNum)
    .ThenBy(x => x.Name)
    .Select(x => new TopicDto
    {
        Id = x.Id,

        Name = x.Name,

        Description = x.Description,

        SubjectId = x.SubjectId,

        SubjectName = x.Subject.TenMH,

        GradeId = x.GradeId,

        GradeName = x.Grade.TenKhoi,

        ChapterId = x.ChapterId,
        ChapterName = x.Chapter.Name,

        ChapterOrder = x.Chapter.Order,

        OrderNum = x.OrderNum,

        IsActive = x.IsActive,

        QuestionCount =
            x.Questions.Count()
    })
    .ToListAsync(cancellationToken);
    }
}