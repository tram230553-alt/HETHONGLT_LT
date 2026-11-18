using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Subjects
{
    public class SubjectDto
    {
        public Guid Id { get; set; }

        public string TenMH { get; set; }

        public int ChaptersCount { get; set; }

        public int TopicsCount { get; set; }

        public int QuestionsCount { get; set; }

        public int ExamsCount { get; set; }

        public int StudentsCount { get; set; }
    }
}
