using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations
{
    public class SubjectConfiguration
    : IEntityTypeConfiguration<Subject>
    {
        public void Configure(
            EntityTypeBuilder<Subject> builder)
        {
            builder.ToTable("Subjects");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenMH)
                .IsRequired()
                .HasMaxLength(100);
        }
    }
}
