using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Domain.Entities;
    public class ExamQuestion
    {
        public Guid ExamId { get; set; }

        public Guid QuestionId { get; set; }
        public Exam Exam { get; set; } = null!;

        public Question Question { get; set; } = null!;
    }
