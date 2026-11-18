using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260915100000_AddLoginSessions")]
public class AddLoginSessions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "LoginSessions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DeviceName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                BrowserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                IpAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                UserAgent = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                LoggedInAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LoginSessions", x => x.Id);
                table.ForeignKey("FK_LoginSessions_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_LoginSessions_UserId_LoggedInAt",
            table: "LoginSessions",
            columns: new[] { "UserId", "LoggedInAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "LoginSessions");
    }
}
