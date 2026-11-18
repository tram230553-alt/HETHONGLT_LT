namespace OnlineExamSystem.Application.DTOs.Students
{
    public class StudentResultDto
    {
        public Guid ExamResultId { get; set; }

        public Guid ExamId { get; set; }

        public string TenBaiKT { get; set; } = string.Empty;

        public double Diem { get; set; }

        public int CorrectQuestion { get; set; }

        public int TotalQuestion { get; set; }

        public int AttemptNumber { get; set; }

        public DateTime SubmittedAt { get; set; }
    }
}
