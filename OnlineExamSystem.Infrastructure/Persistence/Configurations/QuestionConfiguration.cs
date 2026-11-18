using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class QuestionConfiguration
    : IEntityTypeConfiguration<Question>
{
    public void Configure(
        EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.NoiDung)
            .IsRequired();

        builder.Property(x => x.Type)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("single_choice");

        builder.HasOne(x => x.Subject)
             .WithMany()
             .HasForeignKey(x => x.SubjectId);

        builder.HasOne(x => x.Teacher)
            .WithMany()
            .HasForeignKey(x => x.TeacherId);
        builder.HasOne(x => x.Topic)
    .WithMany(x => x.Questions)
    .HasForeignKey(x => x.TopicId)
    .OnDelete(DeleteBehavior.Restrict);
    }
}
