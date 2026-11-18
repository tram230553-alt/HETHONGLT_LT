using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Teachers
{
    public class TeacherProfileDto
    {
        public Guid Id { get; set; }

        public string HoTen { get; set; }

        public string Email { get; set; }

        public string SDT { get; set; }

        public Guid SubjectId { get; set; }

        public Guid GradeId { get; set; }

        public string TenMH { get; set; }

        public string TenKhoi { get; set; }

        public bool ReceiveAdminNotifications { get; set; }
        public bool ExamApprovalNotifications { get; set; }
        public bool StudentSubmissionNotifications { get; set; }
        public bool EmailNotifications { get; set; }
        public bool SystemNotifications { get; set; }
        public string ThemePreference { get; set; } = "light";
        public bool AutoSaveEnabled { get; set; }
        public List<TeacherAccountActivityDto> RecentAccountActivities { get; set; } = new();
    }

    public class TeacherAccountActivityDto
    {
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
