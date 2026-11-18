using MediatR;

namespace OnlineExamSystem.Application.Features.Teachers.Commands.UpdateSettings;

public class UpdateTeacherSettingsCommand : IRequest<string>
{
    public bool ReceiveAdminNotifications { get; set; }
    public bool ExamApprovalNotifications { get; set; }
    public bool StudentSubmissionNotifications { get; set; }
    public bool EmailNotifications { get; set; }
    public bool SystemNotifications { get; set; }
    public string ThemePreference { get; set; } = "light";
    public bool AutoSaveEnabled { get; set; }
}
