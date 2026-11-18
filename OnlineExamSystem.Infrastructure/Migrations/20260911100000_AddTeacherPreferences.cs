using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260911100000_AddTeacherPreferences")]
public class AddTeacherPreferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(name: "AutoSaveEnabled", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<bool>(name: "EmailNotifications", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<bool>(name: "ExamApprovalNotifications", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<bool>(name: "ReceiveAdminNotifications", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<bool>(name: "StudentSubmissionNotifications", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<bool>(name: "SystemNotifications", table: "Teachers", type: "bit", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<string>(name: "ThemePreference", table: "Teachers", type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "light");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "AutoSaveEnabled", table: "Teachers");
        migrationBuilder.DropColumn(name: "EmailNotifications", table: "Teachers");
        migrationBuilder.DropColumn(name: "ExamApprovalNotifications", table: "Teachers");
        migrationBuilder.DropColumn(name: "ReceiveAdminNotifications", table: "Teachers");
        migrationBuilder.DropColumn(name: "StudentSubmissionNotifications", table: "Teachers");
        migrationBuilder.DropColumn(name: "SystemNotifications", table: "Teachers");
        migrationBuilder.DropColumn(name: "ThemePreference", table: "Teachers");
    }
}
