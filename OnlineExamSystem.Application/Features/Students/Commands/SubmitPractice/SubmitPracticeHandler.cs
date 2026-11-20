using MediatR;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Application.Common.Interfaces;
using OnlineExamSystem.Application.Common;

namespace OnlineExamSystem.Application.Features.Students.Commands.SubmitPractice
{
    public class SubmitPracticeHandler : IRequestHandler<
        SubmitPracticeCommand,
        SubmitPracticeResult>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public SubmitPracticeHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        public async Task<SubmitPracticeResult> Handle(
            SubmitPracticeCommand request,
            CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(_currentUser.UserId, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Không xác định được học sinh đang đăng nhập.");
            }

            var student = await _context.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (student == null)
            {
                throw new KeyNotFoundException(
                    "Không tìm thấy hồ sơ học sinh.");
            }

            var topic = await _context.Topics
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    t =>
                        t.Id == request.TopicId &&
                        t.IsActive &&
                        t.GradeId == student.GradeId,
                    cancellationToken);

            if (topic == null)
            {
                throw new KeyNotFoundException(
                    "Topic không tồn tại, đã bị khóa hoặc không thuộc khối của học sinh.");
            }

            var settings = await _context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == 1, cancellationToken);

            if (settings?.AllowPracticeRetake == false)
            {
                var alreadySubmitted = await _context.PracticeAttempts
                    .AnyAsync(
                        x => x.StudentId == student.Id && x.TopicId == request.TopicId,
                        cancellationToken);

                if (alreadySubmitted)
                    throw new InvalidOperationException("Chủ đề này chỉ được luyện tập một lần.");
            }

            var questionCount = Math.Clamp(
                settings?.DefaultPracticeQuestionCount ?? 20,
                1,
                200);

            // Giữ cùng thứ tự với API lấy câu hỏi Practice.
            var questions = await _context.Questions
                .AsNoTracking()
                .Where(q => q.TopicId == request.TopicId)
                .OrderBy(q => q.CreatedAt)
                .ThenBy(q => q.Id)
                .Take(questionCount)
                .ToListAsync(cancellationToken);

            if (questions.Count == 0)
            {
                throw new InvalidOperationException(
                    "Topic chưa có câu hỏi luyện tập.");
            }

            // Một QuestionId chỉ có một đáp án cuối cùng.
            // Các QuestionId không thuộc Topic sẽ bị bỏ qua.
            var questionDict = questions.ToDictionary(q => q.Id);
            foreach (var item in request.Answers)
            {
                if (questionDict.TryGetValue(item.QuestionId, out var q))
                {
                    if (!QuestionAnswerHelper.IsValidSubmittedAnswer(q.Type, item.Answer))
                    {
                        var nType = QuestionAnswerHelper.NormalizeType(q.Type);
                        throw new InvalidOperationException(
                            nType == "true_false"
                                ? "Đáp án Đúng/Sai chỉ nhận Đúng (T) hoặc Sai (F)."
                                : nType == "essay"
                                    ? "Đáp án tự luận không hợp lệ."
                                    : "Đáp án chỉ được gồm các giá trị A, B, C, D và không được lặp.");
                    }
                }
            }

            var answerMap = request.Answers
                .GroupBy(x => x.QuestionId)
                .ToDictionary(
                    x => x.Key,
                    x => x.Last().Answer);

            var attemptId = Guid.NewGuid();
            var resultItems = new List<QuestionAnswerResultDto>();
            var practiceAnswers = new List<PracticeAnswer>();

            var answeredQuestions = 0;
            var correctAnswers = 0;

            for (var index = 0; index < questions.Count; index++)
            {
                var question = questions[index];
                var normalizedType = QuestionAnswerHelper.NormalizeType(question.Type);

                answerMap.TryGetValue(
                    question.Id,
                    out var rawUserAnswer);

                string? userAnswer = null;
                if (!string.IsNullOrWhiteSpace(rawUserAnswer))
                {
                    if (normalizedType == "true_false")
                    {
                        userAnswer = QuestionAnswerHelper.NormalizeTrueFalseAnswer(rawUserAnswer);
                    }
                    else if (normalizedType == "essay")
                    {
                        userAnswer = QuestionAnswerHelper.NormalizeEssayText(rawUserAnswer);
                    }
                    else
                    {
                        userAnswer = QuestionAnswerHelper.NormalizeAnswerSet(rawUserAnswer);
                        if (normalizedType == "single_choice" && userAnswer.Contains(','))
                        {
                            throw new InvalidOperationException("Câu hỏi một đáp án chỉ được chọn một phương án.");
                        }
                    }
                }

                var answered = !string.IsNullOrWhiteSpace(userAnswer);
                var isCorrect = answered && QuestionAnswerHelper.CompareAnswers(question.Type, userAnswer, question.CorrectAnswer);

                if (answered)
                {
                    answeredQuestions++;
                }

                if (isCorrect)
                {
                    correctAnswers++;
                }

                practiceAnswers.Add(
                    new PracticeAnswer
                    {
                        Id = Guid.NewGuid(),
                        PracticeAttemptId = attemptId,
                        QuestionId = question.Id,
                        QuestionOrder = index + 1,
                        QuestionText = question.NoiDung,
                        OptionA = question.OptionA,
                        OptionB = question.OptionB,
                        OptionC = question.OptionC,
                        OptionD = question.OptionD,
                        StudentAnswer = answered
                            ? userAnswer
                            : null,
                        CorrectAnswer = question.CorrectAnswer,
                        IsCorrect = isCorrect,
                        Explanation = question.Explanation
                    });

                resultItems.Add(
                    new QuestionAnswerResultDto
                    {
                        QuestionId = question.Id,
                        UserAnswer = userAnswer ?? string.Empty,
                        CorrectAnswer = question.CorrectAnswer,
                        IsCorrect = isCorrect,
                        Explanation = question.Explanation
                    });
            }

            var totalQuestions = questions.Count;
            var wrongAnswers = answeredQuestions - correctAnswers;

            var score = totalQuestions > 0
                ? Math.Round(
                    (decimal)correctAnswers / totalQuestions * 10m,
                    2)
                : 0m;

            var attempt = new PracticeAttempt
            {
                Id = attemptId,
                StudentId = student.Id,
                TopicId = topic.Id,
                Score = score,
                TotalQuestions = totalQuestions,
                AnsweredQuestions = answeredQuestions,
                CorrectAnswers = correctAnswers,
                WrongAnswers = wrongAnswers,
                SubmittedAt = DateTime.UtcNow,
                Answers = practiceAnswers
            };

            _context.PracticeAttempts.Add(attempt);

            await _context.SaveChangesAsync(
                cancellationToken);

            return new SubmitPracticeResult
            {
                AttemptId = attempt.Id,
                TopicId = topic.Id,
                TopicName = topic.Name,
                TotalQuestions = totalQuestions,
                AnsweredQuestions = answeredQuestions,
                CorrectAnswers = correctAnswers,
                WrongAnswers = wrongAnswers,
                Score = score,
                Results = resultItems
            };
        }

    }
}
