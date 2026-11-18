using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations
{
    public class TeacherConfiguration
    : IEntityTypeConfiguration<Teacher>
    {
        public void Configure(
            EntityTypeBuilder<Teacher> builder)
        {
            builder.ToTable("Teachers");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.SDT)
                .HasMaxLength(20);

            builder.Property(x => x.ThemePreference)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("light");

            builder.Property(x => x.ReceiveAdminNotifications).HasDefaultValue(true);
            builder.Property(x => x.ExamApprovalNotifications).HasDefaultValue(true);
            builder.Property(x => x.StudentSubmissionNotifications).HasDefaultValue(true);
            builder.Property(x => x.EmailNotifications).HasDefaultValue(true);
            builder.Property(x => x.SystemNotifications).HasDefaultValue(true);
            builder.Property(x => x.AutoSaveEnabled).HasDefaultValue(true);

            // RELATIONSHIPS
            builder.HasOne(x => x.User)
                .WithOne(x => x.Teacher)
                .HasForeignKey<Teacher>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Subject)
                .WithMany()
                .HasForeignKey(x => x.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Grade)
                .WithMany()
                .HasForeignKey(x => x.GradeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
