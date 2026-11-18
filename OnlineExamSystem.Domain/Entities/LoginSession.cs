namespace OnlineExamSystem.Domain.Entities;

public class LoginSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string BrowserName { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DateTime LoggedInAt { get; set; }

    public User User { get; set; } = null!;
}
