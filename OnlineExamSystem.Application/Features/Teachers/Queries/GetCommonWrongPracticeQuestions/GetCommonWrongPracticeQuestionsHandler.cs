using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.DTOs.Teachers;

namespace OnlineExamSystem.Application.Features.Teachers
    .Queries.GetCommonWrongPracticeQuestions;

public class GetCommonWrongPracticeQuestionsHandler
    : IRequestHandler<
        GetCommonWrongPracticeQuestionsQuery,
        List<CommonWrongPracticeQuestionDto>>
{
    private const int MaxStudentsPerQuestion = 100;
    private static readonly string[] OptionLetters = { "A", "B", "C", "D" };

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCommonWrongPracticeQuestionsHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<CommonWrongPracticeQuestionDto>> Handle(
        GetCommonWrongPracticeQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(
                _currentUser.UserId,
                out var userId))
        {
            throw new UnauthorizedAccessException(
                "Không xác định được giáo viên đang đăng nhập.");
        }

        var teacher = await _context.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new
            {
                x.SubjectId,
                x.GradeId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (teacher == null)
        {
            throw new UnauthorizedAccessException(
                "Không tìm thấy hồ sơ giáo viên.");
        }

        // Chỉ lấy những câu học sinh đã chọn đáp án. Câu bỏ trống
        // không được tính là câu làm sai.
        var answeredRows = await _context.PracticeAnswers
            .AsNoTracking()
            .Where(x =>
                x.StudentAnswer != null &&
                x.StudentAnswer != string.Empty &&
                x.PracticeAttempt.Topic.SubjectId == teacher.SubjectId &&
                x.PracticeAttempt.Topic.GradeId == teacher.GradeId &&
                x.PracticeAttempt.Student.GradeId == teacher.GradeId)
            .Select(x => new
            {
                AnswerId = x.Id,
                x.QuestionId,
                x.StudentAnswer,
                x.IsCorrect,
                x.PracticeAttempt.StudentId,
                x.PracticeAttempt.SubmittedAt,
                TopicId = x.PracticeAttempt.TopicId,
                TopicName = x.PracticeAttempt.Topic.Name,
                ChapterName = x.PracticeAttempt.Topic.Chapter.Name,
                ChapterOrder = x.PracticeAttempt.Topic.Chapter.Order,
                OrderNum = x.PracticeAttempt.Topic.OrderNum,
                MaHS = x.PracticeAttempt.Student.MaHS,
                Ho = x.PracticeAttempt.Student.User.Ho,
                TenDem = x.PracticeAttempt.Student.User.TenDem,
                Ten = x.PracticeAttempt.Student.User.Ten
            })
            .ToListAsync(cancellationToken);

        var limit = Math.Clamp(request.Limit, 1, 500);

        var topGroups = answeredRows
            .GroupBy(x => x.QuestionId)
            // Cần ít nhất hai lượt trả lời để số liệu có ý nghĩa.
            .Where(group => group.Count() >= 2 && group.Any(x => !x.IsCorrect))
            .Select(group => new
            {
                group.Key,
                Rows = group.ToList(),
                WrongCount = group.Count(x => !x.IsCorrect),
                AnsweredCount = group.Count(),
                WrongRate = Math.Round(
                    (decimal)group.Count(x => !x.IsCorrect) / group.Count() * 100m,
                    2)
            })
            .OrderByDescending(x => x.WrongRate)
            .ThenByDescending(x => x.WrongCount)
            .Take(limit)
            .ToList();

        if (topGroups.Count == 0)
        {
            return new List<CommonWrongPracticeQuestionDto>();
        }

        // Snapshot nội dung câu hỏi/đáp án/lời giải lấy từ lượt trả lời gần nhất.
        var latestAnswerIds = topGroups
            .Select(g => g.Rows.OrderByDescending(x => x.SubmittedAt).First().AnswerId)
            .ToList();

        var snapshots = await _context.PracticeAnswers
            .AsNoTracking()
            .Where(x => latestAnswerIds.Contains(x.Id))
            .Select(x => new
            {
                x.QuestionId,
                x.QuestionText,
                x.OptionA,
                x.OptionB,
                x.OptionC,
                x.OptionD,
                x.CorrectAnswer,
                x.Explanation,
                QuestionType = x.Question.Type
            })
            .ToDictionaryAsync(x => x.QuestionId, cancellationToken);

        var result = new List<CommonWrongPracticeQuestionDto>();

        foreach (var group in topGroups)
        {
            if (!snapshots.TryGetValue(group.Key, out var snapshot))
            {
                continue;
            }

            var latest = group.Rows
                .OrderByDescending(x => x.SubmittedAt)
                .First();

            var wrongRows = group.Rows
                .Where(x => !x.IsCorrect)
                .ToList();

            var correctSet = QuestionAnswerHelper
                .NormalizeAnswerSet(snapshot.CorrectAnswer)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var optionTexts = new Dictionary<string, string>
            {
                ["A"] = snapshot.OptionA,
                ["B"] = snapshot.OptionB,
                ["C"] = snapshot.OptionC,
                ["D"] = snapshot.OptionD
            };

            // Đếm theo từng chữ cái để áp dụng được cho cả câu nhiều đáp án ("A,C").
            var letterCounts = OptionLetters.ToDictionary(l => l, _ => 0);
            foreach (var row in group.Rows)
            {
                var normalized = QuestionAnswerHelper.NormalizeAnswerSet(row.StudentAnswer);
                if (normalized.Length == 0) continue;

                foreach (var letter in normalized.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (letterCounts.ContainsKey(letter)) letterCounts[letter]++;
                }
            }

            var topWrong = wrongRows
                .Select(x => QuestionAnswerHelper.NormalizeAnswerSet(x.StudentAnswer))
                .Where(x => x.Length > 0)
                .GroupBy(x => x)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key)
                .FirstOrDefault();

            // Mỗi học sinh chỉ hiện một dòng: lần sai gần nhất.
            var wrongStudents = wrongRows
                .GroupBy(x => x.StudentId)
                .Select(g => g.OrderByDescending(x => x.SubmittedAt).First())
                .OrderByDescending(x => x.SubmittedAt)
                .Take(MaxStudentsPerQuestion)
                .Select(x => new PracticeWrongStudentDto
                {
                    StudentId = x.StudentId,
                    MaHS = x.MaHS,
                    StudentName = string.Join(
                        " ",
                        new[] { x.Ho, x.TenDem, x.Ten }
                            .Where(v => !string.IsNullOrWhiteSpace(v))),
                    SelectedAnswer = QuestionAnswerHelper.NormalizeAnswerSet(x.StudentAnswer),
                    TopicName = x.TopicName,
                    SubmittedAt = x.SubmittedAt
                })
                .ToList();

            result.Add(new CommonWrongPracticeQuestionDto
            {
                QuestionId = group.Key,
                QuestionText = snapshot.QuestionText,
                TopicId = latest.TopicId,
                TopicName = latest.TopicName,
                ChapterName = latest.ChapterName,
                ChapterOrder = latest.ChapterOrder,
                OrderNum = latest.OrderNum,
                WrongCount = group.WrongCount,
                AnsweredCount = group.AnsweredCount,
                StudentCount = wrongRows
                    .Select(x => x.StudentId)
                    .Distinct()
                    .Count(),
                WrongRate = group.WrongRate,

                QuestionType = QuestionAnswerHelper.NormalizeType(snapshot.QuestionType),
                CorrectAnswer = QuestionAnswerHelper.NormalizeAnswerSet(snapshot.CorrectAnswer),
                Explanation = snapshot.Explanation,
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

        return result;
    }
}
