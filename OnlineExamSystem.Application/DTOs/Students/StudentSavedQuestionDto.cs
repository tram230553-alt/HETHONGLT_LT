namespace OnlineExamSystem.Application.DTOs.Students;

public class StudentSavedQuestionDto
{
    public Guid Id { get; set; }

    public Guid QuestionId { get; set; }


    // Môn học
    public Guid SubjectId { get; set; }

    public string MonHoc { get; set; }
        = string.Empty;


    // Khối
    public Guid GradeId { get; set; }

    public string Khoi { get; set; }
        = string.Empty;


    // Câu hỏi
    public string NoiDung { get; set; }
        = string.Empty;

    public string OptionA { get; set; }
        = string.Empty;

    public string OptionB { get; set; }
        = string.Empty;

    public string OptionC { get; set; }
        = string.Empty;

    public string OptionD { get; set; }
        = string.Empty;


    // Học sinh chỉ được lưu câu đã từng làm,
    // nên có thể xem lại đáp án đúng.
    public string CorrectAnswer { get; set; }
        = string.Empty;


    public DateTime CreatedAt { get; set; }
}