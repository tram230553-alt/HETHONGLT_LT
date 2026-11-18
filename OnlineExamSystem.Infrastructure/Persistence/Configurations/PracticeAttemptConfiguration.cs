using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class PracticeAttemptConfiguration
    : IEntityTypeConfiguration<PracticeAttempt>
{
    public void Configure(
        EntityTypeBuilder<PracticeAttempt> builder)
    {
        builder.ToTable("PracticeAttempts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Score)
            .HasColumnType("decimal(5,2)");

        builder.Property(x => x.SubmittedAt)
            .IsRequired();

        builder.HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Topic)
            .WithMany()
            .HasForeignKey(x => x.TopicId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasMany(x => x.Answers)
            .WithOne(x => x.PracticeAttempt)
            .HasForeignKey(x => x.PracticeAttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new
        {
            x.StudentId,
            x.SubmittedAt
        });
    }
}
