using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetExamWrongQuestions;

public class GetExamWrongQuestionsHandler
    : IRequestHandler<GetExamWrongQuestionsQuery, ExamWrongQuestionStatsDto>
{
    private const int MaxStudentsPerQuestion = 100;
    private static readonly string[] OptionLetters = { "A", "B", "C", "D" };

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetExamWrongQuestionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ExamWrongQuestionStatsDto> Handle(
        GetExamWrongQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(_currentUser.UserId, out var userId))
            throw new UnauthorizedAccessException("Không xác định được giáo viên đang đăng nhập.");

        var teacherId = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy hồ sơ giáo viên.");

        // Chỉ thống kê trên các đề do chính giáo viên này tạo (cùng quy tắc với màn "Kết quả bài thi").
        var exams = await _context.Exams
            .AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderBy(x => x.TenBaiKT)
            .Select(x => new ExamWrongQuestionExamDto
            {
                ExamId = x.Id,
                ExamName = x.TenBaiKT,
                TotalQuestions = x.ExamQuestions.Count,
                SubmissionCount = x.ExamResults.Count
            })
            .ToListAsync(cancellationToken);

        var result = new ExamWrongQuestionStatsDto { Exams = exams };

        if (request.ExamId.HasValue)
        {
            var selected = exams.FirstOrDefault(x => x.ExamId == request.ExamId.Value)
                ?? throw new KeyNotFoundException("Không tìm thấy đề thi của bạn.");
            result.ExamId = selected.ExamId;
            result.ExamName = selected.ExamName;
        }

        var examIds = request.ExamId.HasValue
            ? new List<Guid> { request.ExamId.Value }
            : exams.Select(x => x.ExamId).ToList();

        if (examIds.Count == 0) return result;

        var rows = await _context.StudentAnswers
            .AsNoTracking()
            .Where(a => examIds.Contains(a.ExamResult.ExamId))
            .Select(a => new
            {
                a.QuestionId,
                a.SelectedAnswer,
                a.IsCorrect,
                a.ExamResultId,
                a.ExamResult.StudentId,
                a.ExamResult.SubmittedAt,
                ExamName = a.ExamResult.Exam.TenBaiKT
            })
            .ToListAsync(cancellationToken);

        result.SubmissionCount = rows.Select(x => x.ExamResultId).Distinct().Count();
        result.StudentCount = rows.Select(x => x.StudentId).Distinct().Count();

        var wrongQuestionIds = rows
            .Where(x => !x.IsCorrect)
            .Select(x => x.QuestionId)
            .Distinct()
            .ToList();

        if (wrongQuestionIds.Count == 0) return result;

        var questions = await _context.Questions
            .AsNoTracking()
            .Where(q => wrongQuestionIds.Contains(q.Id))
            .Select(q => new
            {
                q.Id,
                q.NoiDung,
                q.Type,
                q.Difficulty,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.CorrectAnswer,
                q.Explanation,
                TopicName = q.Topic != null ? q.Topic.Name : string.Empty,
                ChapterName = q.Topic != null ? q.Topic.Chapter.Name : string.Empty
            })
            .ToDictionaryAsync(q => q.Id, cancellationToken);

        var wrongStudentIds = rows
            .Where(x => !x.IsCorrect)
            .Select(x => x.StudentId)
            .Distinct()
            .ToList();

        var students = await _context.Students
            .AsNoTracking()
            .Where(s => wrongStudentIds.Contains(s.Id))
            .Select(s => new
            {
                s.Id,
                s.MaHS,
                FullName = s.User.Ho + " " + s.User.TenDem + " " + s.User.Ten
            })
            .ToDictionaryAsync(s => s.Id, cancellationToken);

        var stats = new List<ExamWrongQuestionDto>();

        foreach (var group in rows.Where(x => wrongQuestionIds.Contains(x.QuestionId)).GroupBy(x => x.QuestionId))
        {
            if (!questions.TryGetValue(group.Key, out var q)) continue;

            var attempts = group.ToList();
            var wrong = attempts.Where(x => !x.IsCorrect).ToList();
            var blank = wrong.Count(x => string.IsNullOrWhiteSpace(x.SelectedAnswer));

            var correctSet = QuestionAnswerHelper.NormalizeAnswerSet(q.CorrectAnswer)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var optionTexts = new Dictionary<string, string>
            {
                ["A"] = q.OptionA,
                ["B"] = q.OptionB,
                ["C"] = q.OptionC,
                ["D"] = q.OptionD
            };

            // Đếm theo từng chữ cái để áp dụng được cho cả câu nhiều đáp án ("A,C").
            var letterCounts = OptionLetters.ToDictionary(l => l, _ => 0);
            foreach (var attempt in attempts)
            {
                var normalized = QuestionAnswerHelper.NormalizeAnswerSet(attempt.SelectedAnswer);
                if (normalized.Length == 0) continue;
                foreach (var letter in normalized.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (letterCounts.ContainsKey(letter)) letterCounts[letter]++;
                }
            }

            var topWrong = wrong
                .Select(x => QuestionAnswerHelper.NormalizeAnswerSet(x.SelectedAnswer))
                .Where(x => x.Length > 0)
                .GroupBy(x => x)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .FirstOrDefault();

            // Mỗi học sinh chỉ hiện một dòng: lần nộp sai gần nhất.
            var wrongStudents = wrong
                .GroupBy(x => x.StudentId)
                .Select(g => g.OrderByDescending(x => x.SubmittedAt).First())
                .OrderByDescending(x => x.SubmittedAt)
                .Take(MaxStudentsPerQuestion)
                .Select(x =>
                {
                    students.TryGetValue(x.StudentId, out var student);
                    return new ExamWrongStudentDto
                    {
                        StudentId = x.StudentId,
                        MaHS = student?.MaHS ?? string.Empty,
                        StudentName = student == null
                            ? string.Empty
                            : string.Join(" ", student.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries)),
                        SelectedAnswer = QuestionAnswerHelper.NormalizeAnswerSet(x.SelectedAnswer),
                        ExamName = x.ExamName,
                        SubmittedAt = x.SubmittedAt
                    };
                })
                .ToList();

            stats.Add(new ExamWrongQuestionDto
            {
                QuestionId = group.Key,
                QuestionText = q.NoiDung,
                QuestionType = QuestionAnswerHelper.NormalizeType(q.Type),
                Difficulty = q.Difficulty,
                TopicName = q.TopicName,
                ChapterName = q.ChapterName,
                CorrectAnswer = QuestionAnswerHelper.NormalizeAnswerSet(q.CorrectAnswer),
                Explanation = q.Explanation,
                TotalAttempts = attempts.Count,
                WrongCount = wrong.Count,
                BlankCount = blank,
                StudentCount = wrong.Select(x => x.StudentId).Distinct().Count(),
                WrongRate = Math.Round((decimal)wrong.Count / attempts.Count * 100m, 2),
                MostChosenWrongAnswer = topWrong?.Key,
                MostChosenWrongAnswerCount = topWrong?.Count() ?? 0,
                Options = OptionLetters.Select(l => new ExamQuestionOptionStatDto
                {
                    Option = l,
                    Text = optionTexts[l],
                    IsCorrect = correctSet.Contains(l),
                    SelectedCount = letterCounts[l]
                }).ToList(),
                WrongStudents = wrongStudents
            });
        }

        var limit = Math.Clamp(request.Limit, 1, 500);

        result.QuestionsWithWrongAnswers = stats.Count;
        result.Questions = stats
            .OrderByDescending(x => x.WrongRate)
            .ThenByDescending(x => x.WrongCount)
            .ThenBy(x => x.QuestionText)
            .Take(limit)
            .ToList();

        return result;
    }
}
