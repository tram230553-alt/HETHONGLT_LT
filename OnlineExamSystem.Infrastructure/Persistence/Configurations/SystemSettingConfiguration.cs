using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.SystemName).IsRequired().HasMaxLength(150);
        builder.Property(x => x.SchoolName).IsRequired().HasMaxLength(250);
        builder.Property(x => x.LogoUrl).HasMaxLength(1000);
        builder.Property(x => x.AcademicYear).IsRequired().HasMaxLength(20);
    }
}
