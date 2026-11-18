namespace OnlineExamSystem.Application.DTOs.Students;

public class ResultDetailDto
{
    public Guid ExamId { get; set; }

    public string TenBaiKT { get; set; } = string.Empty;

    public double Diem { get; set; }

    public int TotalQuestion { get; set; }

    public int CorrectQuestion { get; set; }

    public DateTime SubmittedAt { get; set; }

    // Chỉ được trả về sau khi đã tồn tại ExamResult của chính học sinh.
    // Nhờ vậy CorrectAnswer không bị lộ ở API mở đề thi trước khi nộp bài.
    public List<ResultQuestionDetailDto> Questions { get; set; } = new();
}
