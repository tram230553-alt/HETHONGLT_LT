using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OnlineExamSystem.Infrastructure.Persistence.DbContext;

namespace OnlineExamSystem.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260924100000_NormalizeChapters")]
public class NormalizeChapters : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
CREATE TABLE dbo.Chapters (
    Id uniqueidentifier NOT NULL CONSTRAINT PK_Chapters PRIMARY KEY,
    Name nvarchar(200) NOT NULL,
    [Order] int NOT NULL,
    SubjectId uniqueidentifier NOT NULL,
    GradeId uniqueidentifier NOT NULL,
    CONSTRAINT FK_Chapters_Subjects_SubjectId FOREIGN KEY (SubjectId) REFERENCES dbo.Subjects(Id),
    CONSTRAINT FK_Chapters_Grades_GradeId FOREIGN KEY (GradeId) REFERENCES dbo.Grades(Id)
);
CREATE UNIQUE INDEX IX_Chapters_SubjectId_GradeId_Order ON dbo.Chapters(SubjectId, GradeId, [Order]);
CREATE INDEX IX_Chapters_GradeId ON dbo.Chapters(GradeId);
INSERT INTO dbo.Chapters (Id, Name, [Order], SubjectId, GradeId)
SELECT NEWID(), LEFT(COALESCE(MAX(NULLIF(LTRIM(RTRIM(ChapterName)), N'')), CONCAT(N'Chương ', ChapterOrder)), 200),
    ChapterOrder, SubjectId, GradeId
FROM dbo.Topics GROUP BY SubjectId, GradeId, ChapterOrder;
ALTER TABLE dbo.Topics ADD ChapterId uniqueidentifier NULL;
UPDATE t SET ChapterId = c.Id FROM dbo.Topics t JOIN dbo.Chapters c
 ON t.SubjectId = c.SubjectId AND t.GradeId = c.GradeId AND t.ChapterOrder = c.[Order];
ALTER TABLE dbo.Topics ALTER COLUMN ChapterId uniqueidentifier NOT NULL;
CREATE INDEX IX_Topics_ChapterId ON dbo.Topics(ChapterId);
ALTER TABLE dbo.Topics ADD CONSTRAINT FK_Topics_Chapters_ChapterId
 FOREIGN KEY (ChapterId) REFERENCES dbo.Chapters(Id);
");
        migrationBuilder.DropColumn(name: "ChapterName", table: "Topics");
        migrationBuilder.DropColumn(name: "ChapterOrder", table: "Topics");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
ALTER TABLE dbo.Topics ADD ChapterName nvarchar(max) NOT NULL CONSTRAINT DF_Topics_ChapterName DEFAULT N'', ChapterOrder int NOT NULL CONSTRAINT DF_Topics_ChapterOrder DEFAULT 0;
UPDATE t SET ChapterName = c.Name, ChapterOrder = c.[Order] FROM dbo.Topics t JOIN dbo.Chapters c ON t.ChapterId = c.Id;
ALTER TABLE dbo.Topics DROP CONSTRAINT FK_Topics_Chapters_ChapterId;
DROP INDEX IX_Topics_ChapterId ON dbo.Topics;
ALTER TABLE dbo.Topics DROP COLUMN ChapterId;
DROP TABLE dbo.Chapters;
");
    }
}
