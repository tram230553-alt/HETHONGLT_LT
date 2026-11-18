using OnlineExamSystem.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }

    public string NoiDung { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Type { get; set; } = "single_choice";

    public string Difficulty { get; set; } = string.Empty;
    public string? Explanation { get; set; }


    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Subject
    public Guid SubjectId { get; set; }

    public Subject Subject { get; set; } = null!;


    // Grade
    public Guid GradeId { get; set; }

    public Grade Grade { get; set; } = null!;


    // Topic
    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }


    // Teacher
    public Guid TeacherId { get; set; }

    public Teacher Teacher { get; set; } = null!;

    public ICollection<ExamQuestion> ExamQuestions
    = new List<ExamQuestion>();
    public ICollection<StudentAnswer> StudentAnswers
        = new List<StudentAnswer>();

}







































































