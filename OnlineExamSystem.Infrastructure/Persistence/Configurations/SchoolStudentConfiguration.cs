using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class SchoolStudentConfiguration
    : IEntityTypeConfiguration<SchoolStudent>
{
    public void Configure(
        EntityTypeBuilder<SchoolStudent> builder)
    {
        builder.ToTable("SchoolStudents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MaHS)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.MaHS)
            .IsUnique();

        builder.Property(x => x.HoTen)
            .IsRequired()
            .HasMaxLength(200);



        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);

        builder.HasOne(x => x.Grade)
            .WithMany()
            .HasForeignKey(x => x.GradeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}