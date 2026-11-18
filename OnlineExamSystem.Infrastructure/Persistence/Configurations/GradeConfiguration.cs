using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations
{
    public class GradeConfiguration
    : IEntityTypeConfiguration<Grade>
    {
        public void Configure(
            EntityTypeBuilder<Grade> builder)
        {
            builder.ToTable("Grades");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenKhoi)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
