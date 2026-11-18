namespace OnlineExamSystem.Domain.Entities;

public class SystemSetting
{
    public int Id { get; set; } = 1;
    public string SystemName { get; set; } = "SmartExam";
    public string SchoolName { get; set; } = "Trường học";
    public string LogoUrl { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public int DefaultPracticeQuestionCount { get; set; } = 20;
    public bool AllowPracticeRetake { get; set; } = true;
    public int DefaultExamDurationMinutes { get; set; } = 60;
    public int DefaultExamQuestionCount { get; set; } = 40;
    public bool ShowExamResultAfterSubmit { get; set; } = true;
    public int SessionTimeoutMinutes { get; set; } = 60;
    public int MinimumPasswordLength { get; set; } = 6;
    public bool RequireUppercasePassword { get; set; }
    public bool RequireDigitPassword { get; set; }
    public DateTime UpdatedAt { get; set; }
}
