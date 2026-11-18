using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;
namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;
public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("AuditLogs"); b.HasKey(x => x.Id);
        b.Property(x => x.UserEmail).HasMaxLength(255); b.Property(x => x.Role).HasMaxLength(50);
        b.Property(x => x.Method).IsRequired().HasMaxLength(10); b.Property(x => x.Path).IsRequired().HasMaxLength(500);
        b.Property(x => x.IpAddress).HasMaxLength(100); b.HasIndex(x => x.CreatedAt); b.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}
