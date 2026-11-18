namespace OnlineExamSystem.Application.DTOs.Students
{
    public class StudentTopicDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid SubjectId { get; set; }

        public string SubjectName { get; set; } = string.Empty;

        public Guid GradeId { get; set; }

        public string GradeName { get; set; } = string.Empty;

        // =========================
        // CHAPTER
        // =========================

        public string ChapterName { get; set; } = string.Empty;

        public int ChapterOrder { get; set; }

        public int OrderNum { get; set; }

        // =========================
        // OTHER
        // =========================

        public int QuestionCount { get; set; }

        public bool IsActive { get; set; }
    }
}