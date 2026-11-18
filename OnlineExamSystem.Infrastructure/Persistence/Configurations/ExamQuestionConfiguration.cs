using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations
{
    public class ExamQuestionConfiguration
    : IEntityTypeConfiguration<ExamQuestion>
    {
        public void Configure(
            EntityTypeBuilder<ExamQuestion> builder)
        {
            builder.ToTable("ExamQuestions");

            builder.HasKey(x => new
            {
                x.ExamId,
                x.QuestionId
            });

            builder.HasOne(x => x.Exam)
                .WithMany(x => x.ExamQuestions)
                .HasForeignKey(x => x.ExamId);

            builder.HasOne(x => x.Question)
                .WithMany(x => x.ExamQuestions)
                .HasForeignKey(x => x.QuestionId);
        }
    }
}
