using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Domain.Entities
{
    public class Teacher
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public Guid SubjectId { get; set; }

        public Guid GradeId { get; set; }

        public string SDT { get; set; }

        public bool ReceiveAdminNotifications { get; set; } = true;
        public bool ExamApprovalNotifications { get; set; } = true;
        public bool StudentSubmissionNotifications { get; set; } = true;
        public bool EmailNotifications { get; set; } = true;
        public bool SystemNotifications { get; set; } = true;
        public string ThemePreference { get; set; } = "light";
        public bool AutoSaveEnabled { get; set; } = true;

        public User User { get; set; }

        public Subject Subject { get; set; }

        public Grade Grade { get; set; }
    }
}
