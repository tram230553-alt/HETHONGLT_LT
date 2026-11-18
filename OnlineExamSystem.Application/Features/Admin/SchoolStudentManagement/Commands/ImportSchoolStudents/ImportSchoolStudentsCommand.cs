using MediatR;

namespace OnlineExamSystem.Application.Features.Admin
    .SchoolStudentManagement.Commands.ImportSchoolStudents;

public class ImportSchoolStudentsCommand
    : IRequest<ImportSchoolStudentsResultDto>
{
    public List<ImportSchoolStudentRowDto> Rows { get; set; }
        = new();
}

public class ImportSchoolStudentRowDto
{
    public int RowNumber { get; set; }

    public string MaHS { get; set; }
        = string.Empty;

    public string HoTen { get; set; }
        = string.Empty;

    public string TenKhoi { get; set; }
        = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class ImportSchoolStudentsResultDto
{
    public int TotalRows { get; set; }

    public int Inserted { get; set; }

    public int Updated { get; set; }

    public int Unchanged { get; set; }

    public int Failed { get; set; }

    public List<string> Errors { get; set; }
        = new();
}