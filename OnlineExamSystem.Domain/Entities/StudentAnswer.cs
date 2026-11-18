using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Domain.Entities
{
    public class StudentAnswer
    {
        public Guid Id { get; set; }

        public Guid ExamResultId { get; set; }

        public Guid QuestionId { get; set; }

        public string SelectedAnswer { get; set; }

        public bool IsCorrect { get; set; }

        public ExamResult ExamResult { get; set; }

        public Question Question { get; set; }
    }
}
