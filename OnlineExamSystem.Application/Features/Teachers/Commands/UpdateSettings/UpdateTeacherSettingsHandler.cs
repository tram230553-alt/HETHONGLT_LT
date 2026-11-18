using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;

namespace OnlineExamSystem.Application.Features.Teachers.Commands.UpdateSettings;

public class UpdateTeacherSettingsHandler : IRequestHandler<UpdateTeacherSettingsCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateTeacherSettingsHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<string> Handle(UpdateTeacherSettingsCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var theme = request.ThemePreference.Trim().ToLowerInvariant();
        if (theme is not ("light" or "dark" or "auto"))
            throw new ArgumentException("Giao diện chỉ nhận light, dark hoặc auto.");

        var teacher = await _context.Teachers.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ giáo viên.");

        teacher.ReceiveAdminNotifications = request.ReceiveAdminNotifications;
        teacher.ExamApprovalNotifications = request.ExamApprovalNotifications;
        teacher.StudentSubmissionNotifications = request.StudentSubmissionNotifications;
        teacher.EmailNotifications = request.EmailNotifications;
        teacher.SystemNotifications = request.SystemNotifications;
        teacher.ThemePreference = theme;
        teacher.AutoSaveEnabled = request.AutoSaveEnabled;

        await _context.SaveChangesAsync(cancellationToken);
        return "Đã lưu cài đặt giáo viên.";
    }
}
