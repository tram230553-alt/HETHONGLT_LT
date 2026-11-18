using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260907113000_AddSystemSettings")]
public class AddSystemSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SystemSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false),
                SystemName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                SchoolName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                LogoUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                AcademicYear = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                DefaultPracticeQuestionCount = table.Column<int>(type: "int", nullable: false),
                AllowPracticeRetake = table.Column<bool>(type: "bit", nullable: false),
                DefaultExamDurationMinutes = table.Column<int>(type: "int", nullable: false),
                DefaultExamQuestionCount = table.Column<int>(type: "int", nullable: false),
                ShowExamResultAfterSubmit = table.Column<bool>(type: "bit", nullable: false),
                SessionTimeoutMinutes = table.Column<int>(type: "int", nullable: false),
                MinimumPasswordLength = table.Column<int>(type: "int", nullable: false),
                RequireUppercasePassword = table.Column<bool>(type: "bit", nullable: false),
                RequireDigitPassword = table.Column<bool>(type: "bit", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SystemSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SystemSettings");
    }
}
