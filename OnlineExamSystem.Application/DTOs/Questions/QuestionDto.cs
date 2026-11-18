using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Questions
{
    public class QuestionDto
    {
        public Guid Id { get; set; }

        public Guid SubjectId { get; set; }

        public Guid GradeId { get; set; }

        public Guid TeacherId { get; set; }

        public string NoiDung { get; set; }

        public string OptionA { get; set; }

        public string OptionB { get; set; }

        public string OptionC { get; set; }

        public string OptionD { get; set; }

        public string CorrectAnswer { get; set; }

        public string Type { get; set; } = "single_choice";

        public string Difficulty { get; set; } = "medium";

        public string TenMH { get; set; } = string.Empty;

        public string TenKhoi { get; set; } = string.Empty;


        public Guid TopicId { get; set; }

        public string TopicName { get; set; } = string.Empty;

    }
}
