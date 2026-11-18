using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Students
{
    public class StudentExamDto
    {
        public Guid Id { get; set; }

        public string TenBaiKT { get; set; }

        public int ThoiLuong { get; set; }

        public List<StudentQuestionDto> Questions { get; set; }
            = new();
    }
}
