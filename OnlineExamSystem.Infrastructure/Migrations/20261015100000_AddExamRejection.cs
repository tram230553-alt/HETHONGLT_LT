using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261015100000_AddExamRejection")]
public partial class AddExamRejection : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Trạng thái và lý do Admin từ chối đề thi.
        migrationBuilder.AddColumn<bool>(
            name: "IsRejected",
            table: "Exams",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "RejectionReasonCodes",
            table: "Exams",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RejectionNote",
            table: "Exams",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "RejectedAt",
            table: "Exams",
            type: "datetime2",
            nullable: true);

        // Thông báo riêng cho một người dùng (giáo viên có đề bị từ chối).
        migrationBuilder.AddColumn<Guid>(
            name: "TargetUserId",
            table: "Notifications",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_TargetUserId_Status",
            table: "Notifications",
            columns: new[] { "TargetUserId", "Status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Notifications_TargetUserId_Status",
            table: "Notifications");

        migrationBuilder.DropColumn(name: "TargetUserId", table: "Notifications");

        migrationBuilder.DropColumn(name: "RejectedAt", table: "Exams");
        migrationBuilder.DropColumn(name: "RejectionNote", table: "Exams");
        migrationBuilder.DropColumn(name: "RejectionReasonCodes", table: "Exams");
        migrationBuilder.DropColumn(name: "IsRejected", table: "Exams");
    }
}
