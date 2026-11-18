namespace OnlineExamSystem.Application.DTOs.Teachers;

// Chi tiết một giáo viên dành cho Admin (drawer "Hồ sơ giáo viên").
// Mọi số liệu đều tính trực tiếp từ SQL Server.
public class AdminTeacherDetailDto
{
    public Guid Id { get; set; }

    public string HoTen { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string SDT { get; set; } = string.Empty;

    public string? TenMH { get; set; }

    public string? TenKhoi { get; set; }

    public bool IsLocked { get; set; }

    public DateTime CreatedAt { get; set; }

    public int QuestionsCount { get; set; }

    public int ExamsCount { get; set; }

    // Số học sinh thuộc khối mà giáo viên phụ trách.
    public int StudentsCount { get; set; }

    // Tổng số lượt học sinh nộp bài thi của các đề do giáo viên tạo.
    public int ExamSubmissionsCount { get; set; }

    public AdminTeacherDifficultyStatsDto QuestionsByDifficulty { get; set; } = new();

    // Các câu hỏi mới nhất (giới hạn số lượng để drawer nhẹ).
    public List<AdminTeacherQuestionItemDto> RecentQuestions { get; set; } = new();

    public AdminTeacherExamStatusStatsDto ExamsByStatus { get; set; } = new();

    public List<AdminTeacherExamItemDto> Exams { get; set; } = new();

    public AdminTeacherPracticeSummaryDto Practice { get; set; } = new();
}

public class AdminTeacherDifficultyStatsDto
{
    public int Easy { get; set; }

    public int Medium { get; set; }

    public int Hard { get; set; }

    public int Other { get; set; }
}

public class AdminTeacherExamStatusStatsDto
{
    public int Published { get; set; }

    public int Pending { get; set; }

    public int Rejected { get; set; }

    public int Draft { get; set; }
}

public class AdminTeacherQuestionItemDto
{
    public Guid Id { get; set; }

    public string NoiDung { get; set; } = string.Empty;

    public string Difficulty { get; set; } = string.Empty;

    public string TopicName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public class AdminTeacherExamItemDto
{
    public Guid Id { get; set; }

    public string TenBaiKT { get; set; } = string.Empty;

    public int ThoiLuong { get; set; }

    public int TotalQuestions { get; set; }

    // published | pending | rejected | draft
    public string Status { get; set; } = "draft";

    // Số lượt học sinh đã nộp bài của đề này.
    public int SubmissionsCount { get; set; }

    // Điểm trung bình các lượt nộp; null khi chưa có lượt nào.
    public double? AverageScore { get; set; }

    public string? RejectionNote { get; set; }
}

// Luyện tập theo chuyên đề: các lượt học sinh cùng khối luyện trên chuyên đề
// thuộc đúng môn + khối của giáo viên (cùng định nghĩa với cổng giáo viên).
public class AdminTeacherPracticeSummaryDto
{
    public int AttemptsCount { get; set; }

    public int StudentsCount { get; set; }

    public int PracticedTopicsCount { get; set; }

    public int TotalTopicsCount { get; set; }

    public double? AverageScore { get; set; }

    public List<AdminTeacherPracticeStudentDto> Students { get; set; } = new();

    public List<AdminTeacherPracticeAttemptItemDto> RecentAttempts { get; set; } = new();
}

public class AdminTeacherPracticeStudentDto
{
    public Guid StudentId { get; set; }

    public string MaHS { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public int AttemptsCount { get; set; }

    public int PracticedTopicsCount { get; set; }

    public double AverageScore { get; set; }

    public DateTime? LastSubmittedAt { get; set; }
}

public class AdminTeacherPracticeAttemptItemDto
{
    public Guid AttemptId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public string TopicName { get; set; } = string.Empty;

    public double Score { get; set; }

    public int CorrectAnswers { get; set; }

    public int TotalQuestions { get; set; }

    public DateTime SubmittedAt { get; set; }
}
