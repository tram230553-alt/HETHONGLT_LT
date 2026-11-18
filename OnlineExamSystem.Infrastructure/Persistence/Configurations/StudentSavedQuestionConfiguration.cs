using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class StudentSavedQuestionConfiguration
    : IEntityTypeConfiguration<StudentSavedQuestion>
{
    public void Configure(
        EntityTypeBuilder<StudentSavedQuestion> builder)
    {
        builder.ToTable("StudentSavedQuestions");

        builder.HasKey(x => x.Id);


        // Một học sinh không được bookmark
        // cùng một câu hỏi nhiều lần.
        builder.HasIndex(x => new
        {
            x.StudentId,
            x.QuestionId
        })
        .IsUnique();


        builder.Property(x => x.CreatedAt)
            .IsRequired();


        // Student -> SavedQuestion
        builder.HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);


        // Question -> SavedQuestion
        //
        // Không Cascade để tránh vấn đề
        // multiple cascade paths của SQL Server.
        builder.HasOne(x => x.Question)
            .WithMany()
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}