using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Students
{
    public class StudentAnswerDto
    {
        public Guid QuestionId { get; set; }

        public string SelectedAnswer { get; set; }
    }
}
