using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; set; }
        DbSet<Student> Students { get; set; }
        DbSet<SchoolStudent> SchoolStudents { get; set; }
        DbSet<Teacher> Teachers { get; set; }
        DbSet<Exam> Exams { get; set; }
        DbSet<ExamResult> ExamResults { get; set; }
        DbSet<Subject> Subjects { get; set; }
        DbSet<Grade> Grades { get; set; }
        DbSet<Question> Questions { get; set; }
        DbSet<ExamQuestion> ExamQuestions { get; set; }
        DbSet<StudentAnswer> StudentAnswers { get; set; }
        DbSet<StudentSavedQuestion> StudentSavedQuestions {get; set;}
        DbSet<Topic> Topics { get; set; }
        DbSet<Chapter> Chapters { get; set; }
        DbSet<PracticeAttempt> PracticeAttempts { get; set; }
        DbSet<PracticeAnswer> PracticeAnswers { get; set; }
        DbSet<NotificationMessage> Notifications { get; set; }
        DbSet<NotificationReadReceipt> NotificationReads { get; set; }
        DbSet<AuditLog> AuditLogs { get; set; }
        DbSet<SystemSetting> SystemSettings { get; set; }
        DbSet<LoginSession> LoginSessions { get; set; }
        DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        Task<int> SaveChangesAsync(
            CancellationToken cancellationToken);
    }
}
