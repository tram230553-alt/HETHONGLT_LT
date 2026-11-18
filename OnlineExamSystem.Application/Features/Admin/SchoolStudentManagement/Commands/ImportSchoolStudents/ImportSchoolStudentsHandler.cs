using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Domain.Entities;
using System.Text;

namespace OnlineExamSystem.Application.Features.Admin
    .SchoolStudentManagement.Commands.ImportSchoolStudents;

public class ImportSchoolStudentsHandler
    : IRequestHandler<
        ImportSchoolStudentsCommand,
        ImportSchoolStudentsResultDto>
{
    private readonly IApplicationDbContext _context;

    public ImportSchoolStudentsHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ImportSchoolStudentsResultDto> Handle(
        ImportSchoolStudentsCommand request,
        CancellationToken cancellationToken)
    {
        var result =
            new ImportSchoolStudentsResultDto
            {
                TotalRows = request.Rows.Count
            };

        // Lấy danh sách khối hiện tại.
        var grades = await _context.Grades
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var gradeDictionary = grades
            .GroupBy(x =>
                NormalizeText(x.TenKhoi))
            .ToDictionary(
                x => x.Key,
                x => x.First().Id);

        // Lấy danh sách SchoolStudents hiện có.
        var existingStudents =
            await _context.SchoolStudents
                .ToListAsync(
                    cancellationToken);

        var studentDictionary =
            existingStudents
                .ToDictionary(
                    x => NormalizeMaHS(
                        x.MaHS));

        // Chống trùng MaHS ngay trong file upload.
        var seenCodes =
            new HashSet<string>();

        foreach (var row in request.Rows)
        {
            var maHS =
                NormalizeMaHS(row.MaHS);

            var hoTen =
                NormalizeDisplayName(
                    row.HoTen);

            var tenKhoiKey =
                NormalizeText(
                    row.TenKhoi);

            if (string.IsNullOrWhiteSpace(maHS))
            {
                AddError(
                    result,
                    row.RowNumber,
                    "Mã học sinh không được để trống.");

                continue;
            }

            if (string.IsNullOrWhiteSpace(hoTen))
            {
                AddError(
                    result,
                    row.RowNumber,
                    $"Học sinh {maHS}: Họ tên không được để trống.");

                continue;
            }

            if (string.IsNullOrWhiteSpace(
                    tenKhoiKey))
            {
                AddError(
                    result,
                    row.RowNumber,
                    $"Học sinh {maHS}: Khối không được để trống.");

                continue;
            }

            if (!seenCodes.Add(maHS))
            {
                AddError(
                    result,
                    row.RowNumber,
                    $"Mã học sinh {maHS} bị trùng trong file.");

                continue;
            }

            if (!gradeDictionary.TryGetValue(
                    tenKhoiKey,
                    out var gradeId))
            {
                AddError(
                    result,
                    row.RowNumber,
                    $"Không tìm thấy khối '{row.TenKhoi}' trong hệ thống.");

                continue;
            }

            // Nếu MaHS đã tồn tại:
            // cập nhật hồ sơ danh sách trường.
            if (studentDictionary.TryGetValue(
                    maHS,
                    out var existing))
            {
                var hasChanges =
                    existing.HoTen != hoTen ||
                    existing.GradeId != gradeId ||
                    existing.IsActive != row.IsActive;

                if (!hasChanges)
                {
                    result.Unchanged++;

                    continue;
                }

                existing.HoTen = hoTen;
                existing.GradeId = gradeId;
                existing.IsActive =
                    row.IsActive;

                result.Updated++;

                continue;
            }

            // Chưa tồn tại → thêm mới.
            var schoolStudent =
                new SchoolStudent
                {
                    Id = Guid.NewGuid(),

                    MaHS = maHS,

                    HoTen = hoTen,

                    GradeId = gradeId,

                    IsActive =
                        row.IsActive
                };

            _context.SchoolStudents.Add(
                schoolStudent);

            studentDictionary.Add(
                maHS,
                schoolStudent);

            result.Inserted++;
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        return result;
    }

    private static void AddError(
        ImportSchoolStudentsResultDto result,
        int rowNumber,
        string message)
    {
        result.Failed++;

        result.Errors.Add(
            $"Dòng {rowNumber}: {message}");
    }

    private static string NormalizeMaHS(
        string? value)
    {
        return value?
            .Trim()
            .ToUpperInvariant()
            ?? string.Empty;
    }

    private static string NormalizeDisplayName(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(
                value))
        {
            return string.Empty;
        }

        return string.Join(
                " ",
                value
                    .Trim()
                    .Split(
                        ' ',
                        StringSplitOptions
                            .RemoveEmptyEntries))
            .Normalize(
                NormalizationForm.FormC);
    }

    private static string NormalizeText(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(
                value))
        {
            return string.Empty;
        }

        return string.Join(
                " ",
                value
                    .Trim()
                    .Split(
                        ' ',
                        StringSplitOptions
                            .RemoveEmptyEntries))
            .Normalize(
                NormalizationForm.FormC)
            .ToUpperInvariant();
    }
}