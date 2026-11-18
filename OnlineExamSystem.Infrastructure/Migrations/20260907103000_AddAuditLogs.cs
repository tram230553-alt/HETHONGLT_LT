using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;
#nullable disable
namespace OnlineExamSystem.Infrastructure.Migrations;
[DbContext(typeof(ApplicationDbContext)), Migration("20260907103000_AddAuditLogs")]
public class AddAuditLogs : Migration
{
    protected override void Up(MigrationBuilder m)
    {
        m.CreateTable("AuditLogs", t => new { Id = t.Column<Guid>("uniqueidentifier", nullable:false), UserId = t.Column<Guid>("uniqueidentifier", nullable:true), UserEmail = t.Column<string>("nvarchar(255)", maxLength:255, nullable:false), Role = t.Column<string>("nvarchar(50)", maxLength:50, nullable:false), Method = t.Column<string>("nvarchar(10)", maxLength:10, nullable:false), Path = t.Column<string>("nvarchar(500)", maxLength:500, nullable:false), StatusCode = t.Column<int>("int", nullable:false), IpAddress = t.Column<string>("nvarchar(100)", maxLength:100, nullable:false), CreatedAt = t.Column<DateTime>("datetime2", nullable:false) }, constraints: t => t.PrimaryKey("PK_AuditLogs", x => x.Id));
        m.CreateIndex("IX_AuditLogs_CreatedAt", "AuditLogs", "CreatedAt"); m.CreateIndex("IX_AuditLogs_UserId_CreatedAt", "AuditLogs", new[] { "UserId", "CreatedAt" });
    }
    protected override void Down(MigrationBuilder m) => m.DropTable("AuditLogs");
}
