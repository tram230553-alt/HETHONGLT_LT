using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

    public class StudentAnswerConfiguration
     : IEntityTypeConfiguration<StudentAnswer>
    {
        public void Configure(
            EntityTypeBuilder<StudentAnswer> builder)
        {
            builder.ToTable("StudentAnswers");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.SelectedAnswer)
                .HasMaxLength(10);

            builder.HasOne(x => x.ExamResult)
                .WithMany(x => x.StudentAnswers)
                .HasForeignKey(x => x.ExamResultId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Question)
                .WithMany(x => x.StudentAnswers)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

