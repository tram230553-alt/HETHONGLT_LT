using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Students;

namespace OnlineExamSystem.Application.Features.Students.Queries.GetLoginSessions;

public class GetStudentLoginSessionsHandler
    : IRequestHandler<GetStudentLoginSessionsQuery, List<StudentLoginSessionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetStudentLoginSessionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<StudentLoginSessionDto>> Handle(
        GetStudentLoginSessionsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được tài khoản đang đăng nhập.");

        return await _context.LoginSessions
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.LoggedInAt)
            .Take(20)
            .Select(x => new StudentLoginSessionDto
            {
                Id = x.Id,
                DeviceName = x.DeviceName,
                BrowserName = x.BrowserName,
                IpAddress = x.IpAddress,
                LoggedInAt = x.LoggedInAt
            })
            .ToListAsync(cancellationToken);
    }
}
