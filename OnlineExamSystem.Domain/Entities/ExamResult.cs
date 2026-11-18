using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Domain.Entities
{
    public class ExamResult
    {
        public Guid Id { get; set; }

        public Guid StudentId { get; set; }

        public Guid ExamId { get; set; }

        public double Diem { get; set; }

        public DateTime SubmittedAt { get; set; }
        public Student Student { get; set; }

        public Exam Exam { get; set; }
        public ICollection<StudentAnswer> StudentAnswers { get; set; }

    }
}
