using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnlineExamSystem.Domain.Entities;

namespace OnlineExamSystem.Infrastructure.Persistence.Configurations;

public class NotificationReadReceiptConfiguration : IEntityTypeConfiguration<NotificationReadReceipt>
{
    public void Configure(EntityTypeBuilder<NotificationReadReceipt> builder)
    {
        builder.ToTable("NotificationReads");
        builder.HasKey(x => new { x.NotificationId, x.UserId });
        builder.HasOne(x => x.Notification)
            .WithMany(x => x.ReadReceipts)
            .HasForeignKey(x => x.NotificationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.UserId);
    }
}
