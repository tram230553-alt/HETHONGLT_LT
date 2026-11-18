using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations
{
    public partial class AddExamApprovalWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSubmittedForApproval",
                table: "Exams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Giữ trạng thái hợp lệ cho các đề đã được phát hành trước migration này.
            migrationBuilder.Sql(
                "UPDATE Exams SET IsSubmittedForApproval = 1 WHERE IsPublished = 1");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSubmittedForApproval",
                table: "Exams");
        }
    }
}
