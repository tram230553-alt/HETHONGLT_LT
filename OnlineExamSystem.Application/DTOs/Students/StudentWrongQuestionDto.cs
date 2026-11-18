namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentWrongQuestionDto
{
    public Guid QuestionId { get; set; }

    // Đề thi gần nhất mà học sinh làm sai câu này
    public Guid ExamId { get; set; }

    public string TenBaiKT { get; set; } = string.Empty;


    // Môn học
    public Guid SubjectId { get; set; }

    public string MonHoc { get; set; } = string.Empty;


    // Khối
    public Guid GradeId { get; set; }

    public string Khoi { get; set; } = string.Empty;


    // Nội dung câu hỏi
    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;


    // Đáp án ở lần sai gần nhất
    public string SelectedAnswer { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;


    // true nếu học sinh bỏ câu
    public bool IsUnanswered { get; set; }


    // Tổng số lần từng làm sai câu này
    public int WrongCount { get; set; }


    // Thời điểm làm sai gần nhất
    public DateTime LastWrongAt { get; set; }
}