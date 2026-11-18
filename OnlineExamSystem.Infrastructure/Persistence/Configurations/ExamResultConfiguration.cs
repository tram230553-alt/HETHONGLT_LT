using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations
{
    public class ExamResultConfiguration
    : IEntityTypeConfiguration<ExamResult>
    {
        public void Configure(
            EntityTypeBuilder<ExamResult> builder)
        {
            builder.ToTable("ExamResults");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Diem)
                .HasColumnType("decimal(5,2)");

            builder.Property(x => x.SubmittedAt)
                .IsRequired();

            builder.HasOne(x => x.Student)
                .WithMany(x => x.ExamResults)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(x => x.Exam)
                .WithMany(x => x.ExamResults)
                .HasForeignKey(x => x.ExamId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    
}
}
