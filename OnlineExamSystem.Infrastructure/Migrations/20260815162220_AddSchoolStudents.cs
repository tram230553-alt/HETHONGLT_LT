using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineExamSystem.Infrastructure.Migrations
{
    public partial class AddSchoolStudents : Migration
    {
        protected override void Up(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SchoolStudents",
                columns: table => new
                {
                    Id = table.Column<Guid>(
                        type: "uniqueidentifier",
                        nullable: false),

                    MaHS = table.Column<string>(
                        type: "nvarchar(50)",
                        maxLength: 50,
                        nullable: false),

                    HoTen = table.Column<string>(
                        type: "nvarchar(200)",
                        maxLength: 200,
                        nullable: false),

                    GradeId = table.Column<Guid>(
                        type: "uniqueidentifier",
                        nullable: false),

                    IsActive = table.Column<bool>(
                        type: "bit",
                        nullable: false,
                        defaultValue: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_SchoolStudents",
                        x => x.Id);

                    table.ForeignKey(
                        name:
                            "FK_SchoolStudents_Grades_GradeId",

                        column:
                            x => x.GradeId,

                        principalTable:
                            "Grades",

                        principalColumn:
                            "Id",

                        onDelete:
                            ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SchoolStudents_GradeId",
                table: "SchoolStudents",
                column: "GradeId");

            migrationBuilder.CreateIndex(
                name: "IX_SchoolStudents_MaHS",
                table: "SchoolStudents",
                column: "MaHS",
                unique: true);
        }

        protected override void Down(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SchoolStudents");
        }
    }
}