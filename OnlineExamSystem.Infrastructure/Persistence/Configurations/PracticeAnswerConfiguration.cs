using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class PracticeAnswerConfiguration
    : IEntityTypeConfiguration<PracticeAnswer>
{
    public void Configure(
        EntityTypeBuilder<PracticeAnswer> builder)
    {
        builder.ToTable("PracticeAnswers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.QuestionText)
            .IsRequired();

        builder.Property(x => x.OptionA)
            .IsRequired();

        builder.Property(x => x.OptionB)
            .IsRequired();

        builder.Property(x => x.OptionC)
            .IsRequired();

        builder.Property(x => x.OptionD)
            .IsRequired();

        builder.Property(x => x.StudentAnswer)
            .HasMaxLength(10);

        builder.Property(x => x.CorrectAnswer)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasOne(x => x.Question)
            .WithMany()
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(x => new
        {
            x.PracticeAttemptId,
            x.QuestionId
        })
        .IsUnique();
    }
}
