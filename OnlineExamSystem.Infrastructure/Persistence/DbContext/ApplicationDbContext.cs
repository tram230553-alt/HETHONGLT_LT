using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.DbContext
{
    public class ApplicationDbContext :
        Microsoft.EntityFrameworkCore.DbContext,
        IApplicationDbContext
    {
    public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
    {
    }

    // ============================
    // Model configuration
    // ============================
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //ÁP DỤNG CONFIGURATION TỰ ĐỘNG
        //1 dòng → load toàn bộ configuration
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

    }
        // ============================
        // DbSets
        // ============================


        public DbSet<User> Users { get; set; }

        public DbSet<Student> Students { get; set; }

        public DbSet<SchoolStudent> SchoolStudents { get; set; }

        public DbSet<Teacher> Teachers { get; set; }

        public DbSet<Grade> Grades { get; set; }

        public DbSet<Question> Questions { get; set; }
        public DbSet<ExamQuestion> ExamQuestions { get; set; }

        public DbSet<Exam> Exams { get; set; }
        public DbSet<Subject> Subjects { get; set; }

        public DbSet<ExamResult> ExamResults { get; set; }
        public DbSet<StudentAnswer> StudentAnswers { get; set; }

        public DbSet<StudentSavedQuestion>
    StudentSavedQuestions
        { get; set; }

        public DbSet<Topic> Topics { get; set; }
        public DbSet<Chapter> Chapters { get; set; }

        public DbSet<PracticeAttempt> PracticeAttempts { get; set; }

        public DbSet<PracticeAnswer> PracticeAnswers { get; set; }
        public DbSet<NotificationMessage> Notifications { get; set; }
        public DbSet<NotificationReadReceipt> NotificationReads { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<LoginSession> LoginSessions { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    }
}
