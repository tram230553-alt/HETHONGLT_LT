namespace OnlineExamSystem.Application.DTOs.Students
{
    public class SubmitExamResponseDto
    {
        public Guid ExamResultId { get; set; }

        public double Diem { get; set; }

        public int TotalQuestion { get; set; }

        public int CorrectQuestion { get; set; }

        public int AttemptNumber { get; set; }

        public bool ShowResultAfterSubmit { get; set; }
    }
}
