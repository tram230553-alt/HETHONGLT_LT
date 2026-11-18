using ClosedXML.Excel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic.FileIO;
using OnlineExamSystem.Application.Features.Admin
    .SchoolStudentManagement.Commands.ImportSchoolStudents;
using System.Text;

namespace OnlineExamSystem.API.Controllers.AdminController;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/school-students")]
public class SchoolStudentImportController
    : ControllerBase
{
    private readonly IMediator _mediator;

    public SchoolStudentImportController(
        IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("import")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Import(
        [FromForm] IFormFile file)
    {
        if (file == null ||
            file.Length == 0)
        {
            return BadRequest(
                "Vui lòng chọn file Excel hoặc CSV.");
        }

        var extension =
            Path.GetExtension(
                    file.FileName)
                .ToLowerInvariant();

        if (extension != ".csv" &&
            extension != ".xlsx")
        {
            return BadRequest(
                "Chỉ hỗ trợ file .csv hoặc .xlsx.");
        }

        try
        {
            List<ImportSchoolStudentRowDto> rows;

            if (extension == ".csv")
            {
                rows = ReadCsv(file);
            }
            else
            {
                rows = ReadExcel(file);
            }

            if (rows.Count == 0)
            {
                return BadRequest(
                    "File không có dữ liệu học sinh.");
            }

            var result =
                await _mediator.Send(
                    new ImportSchoolStudentsCommand
                    {
                        Rows = rows
                    });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(
                ex.Message);
        }
    }

    private static List<ImportSchoolStudentRowDto>
        ReadCsv(
            IFormFile file)
    {
        var rows =
            new List<ImportSchoolStudentRowDto>();

        using var stream =
            file.OpenReadStream();

        using var parser =
            new TextFieldParser(
                stream,
                Encoding.UTF8,
                true);

        parser.TextFieldType =
            FieldType.Delimited;

        parser.SetDelimiters(",");

        parser.HasFieldsEnclosedInQuotes =
            true;

        if (parser.EndOfData)
        {
            throw new ArgumentException(
                "File CSV rỗng.");
        }

        var headers =
            parser.ReadFields();

        ValidateHeader(headers);

        var rowNumber = 1;

        while (!parser.EndOfData)
        {
            rowNumber++;

            var fields =
                parser.ReadFields();

            if (fields == null)
            {
                continue;
            }

            var maHS =
                GetField(fields, 0);

            var hoTen =
                GetField(fields, 1);

            var tenKhoi =
                GetField(fields, 2);

            var isActive =
                GetField(fields, 3);

            // Bỏ dòng trống.
            if (string.IsNullOrWhiteSpace(
                    maHS) &&
                string.IsNullOrWhiteSpace(
                    hoTen) &&
                string.IsNullOrWhiteSpace(
                    tenKhoi))
            {
                continue;
            }

            rows.Add(
                new ImportSchoolStudentRowDto
                {
                    RowNumber =
                        rowNumber,

                    MaHS = maHS,

                    HoTen = hoTen,

                    TenKhoi =
                        tenKhoi,

                    IsActive =
                        ParseIsActive(
                            isActive,
                            rowNumber)
                });
        }

        return rows;
    }

    private static List<ImportSchoolStudentRowDto>
        ReadExcel(
            IFormFile file)
    {
        var rows =
            new List<ImportSchoolStudentRowDto>();

        using var stream =
            file.OpenReadStream();

        using var workbook =
            new XLWorkbook(stream);

        var worksheet =
            workbook.Worksheets
                .FirstOrDefault();

        if (worksheet == null)
        {
            throw new ArgumentException(
                "File Excel không có worksheet.");
        }

        ValidateHeader(
            new[]
            {
                worksheet.Cell(1, 1)
                    .GetString(),

                worksheet.Cell(1, 2)
                    .GetString(),

                worksheet.Cell(1, 3)
                    .GetString(),

                worksheet.Cell(1, 4)
                    .GetString()
            });

        var lastRow =
            worksheet
                .LastRowUsed()?
                .RowNumber()
            ?? 1;

        for (
            var rowNumber = 2;
            rowNumber <= lastRow;
            rowNumber++)
        {
            var maHS =
                worksheet
                    .Cell(
                        rowNumber,
                        1)
                    .GetString()
                    .Trim();

            var hoTen =
                worksheet
                    .Cell(
                        rowNumber,
                        2)
                    .GetString()
                    .Trim();

            var tenKhoi =
                worksheet
                    .Cell(
                        rowNumber,
                        3)
                    .GetString()
                    .Trim();

            var activeText =
                worksheet
                    .Cell(
                        rowNumber,
                        4)
                    .GetString()
                    .Trim();

            if (string.IsNullOrWhiteSpace(
                    maHS) &&
                string.IsNullOrWhiteSpace(
                    hoTen) &&
                string.IsNullOrWhiteSpace(
                    tenKhoi))
            {
                continue;
            }

            rows.Add(
                new ImportSchoolStudentRowDto
                {
                    RowNumber =
                        rowNumber,

                    MaHS = maHS,

                    HoTen = hoTen,

                    TenKhoi =
                        tenKhoi,

                    IsActive =
                        ParseIsActive(
                            activeText,
                            rowNumber)
                });
        }

        return rows;
    }

    private static void ValidateHeader(
        string[]? headers)
    {
        if (headers == null ||
            headers.Length < 4)
        {
            throw new ArgumentException(
                "File phải có 4 cột: MaHS, HoTen, TenKhoi, IsActive.");
        }

        var expected =
            new[]
            {
                "MaHS",
                "HoTen",
                "TenKhoi",
                "IsActive"
            };

        for (
            var i = 0;
            i < expected.Length;
            i++)
        {
            var actual =
                headers[i]
                    ?.Trim()
                    .Trim('\uFEFF');

            if (!string.Equals(
                    actual,
                    expected[i],
                    StringComparison
                        .OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    $"Cột {i + 1} phải là '{expected[i]}'.");
            }
        }
    }

    private static string GetField(
        string[] fields,
        int index)
    {
        if (index >= fields.Length)
        {
            return string.Empty;
        }

        return fields[index]
            ?.Trim()
            ?? string.Empty;
    }

    private static bool ParseIsActive(
        string? value,
        int rowNumber)
    {
        var normalized =
            value?
                .Trim()
                .ToLowerInvariant()
            ?? string.Empty;

        // Để trống mặc định là đang hoạt động.
        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            return true;
        }

        if (
            normalized == "1" ||
            normalized == "true" ||
            normalized == "active" ||
            normalized == "yes" ||
            normalized == "có")
        {
            return true;
        }

        if (
            normalized == "0" ||
            normalized == "false" ||
            normalized == "inactive" ||
            normalized == "no" ||
            normalized == "không")
        {
            return false;
        }

        throw new ArgumentException(
            $"Dòng {rowNumber}: IsActive chỉ nhận 1/0, true/false.");
    }
}