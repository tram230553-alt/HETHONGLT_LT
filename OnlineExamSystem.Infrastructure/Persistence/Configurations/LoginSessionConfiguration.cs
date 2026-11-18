using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class LoginSessionConfiguration : IEntityTypeConfiguration<LoginSession>
{
    public void Configure(EntityTypeBuilder<LoginSession> builder)
    {
        builder.ToTable("LoginSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.BrowserName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.IpAddress).IsRequired().HasMaxLength(100);
        builder.Property(x => x.UserAgent).IsRequired().HasMaxLength(1000);
        builder.HasIndex(x => new { x.UserId, x.LoggedInAt });
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
