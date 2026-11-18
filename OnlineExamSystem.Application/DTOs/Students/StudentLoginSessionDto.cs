namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentLoginSessionDto
{
    public Guid Id { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string BrowserName { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime LoggedInAt { get; set; }
}
