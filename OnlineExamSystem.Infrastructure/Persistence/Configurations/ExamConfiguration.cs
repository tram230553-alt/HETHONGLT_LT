using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.ToTable("Exams");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenBaiKT)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.IsSubmittedForApproval)
            .HasDefaultValue(false);

        builder.Property(x => x.IsRejected)
            .HasDefaultValue(false);

        builder.Property(x => x.RejectionReasonCodes)
            .HasMaxLength(500);

        builder.Property(x => x.RejectionNote)
            .HasMaxLength(1000);
    }
}
