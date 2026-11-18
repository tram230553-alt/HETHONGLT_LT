using System;
using System.Collections.Generic;

namespace OnlineExamSystem.Application.DTOs.Subjects
{
    // Dữ liệu chi tiết của một môn học cho Admin (drawer "Xem chi tiết").
    // Toàn bộ số liệu được tính trực tiếp từ SQL Server.
    public class SubjectDetailDto
    {
        public Guid Id { get; set; }

        public string TenMH { get; set; } = string.Empty;

        public int ChaptersCount { get; set; }

        public int TopicsCount { get; set; }

        public int TeachersCount { get; set; }

        public int QuestionsCount { get; set; }

        public int ExamsCount { get; set; }

        public int StudentsCount { get; set; }

        public List<SubjectChapterItemDto> Chapters { get; set; } = new();

        public List<SubjectTopicItemDto> Topics { get; set; } = new();

        public List<SubjectTeacherItemDto> Teachers { get; set; } = new();

        // Các câu hỏi mới nhất của môn (giới hạn số lượng để drawer nhẹ).
        public List<SubjectQuestionItemDto> RecentQuestions { get; set; } = new();

        public SubjectDifficultyStatsDto QuestionsByDifficulty { get; set; } = new();

        public List<SubjectExamItemDto> Exams { get; set; } = new();

        public SubjectExamStatusStatsDto ExamsByStatus { get; set; } = new();

        // Số lượt học sinh đã nộp bài thi của môn này.
        public int ExamResultsCount { get; set; }

        // Điểm trung bình các lượt nộp bài; null khi chưa có lượt nào.
        public double? AverageScore { get; set; }
    }

    public class SubjectChapterItemDto
    {
        public string Name { get; set; } = string.Empty;

        public int Order { get; set; }

        public string GradeName { get; set; } = string.Empty;

        public int TopicsCount { get; set; }

        public int QuestionsCount { get; set; }
    }

    public class SubjectTopicItemDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string ChapterName { get; set; } = string.Empty;

        public string GradeName { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public int QuestionsCount { get; set; }
    }

    public class SubjectTeacherItemDto
    {
        public Guid Id { get; set; }

        public string HoTen { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string GradeName { get; set; } = string.Empty;

        public bool IsLocked { get; set; }
    }

    public class SubjectQuestionItemDto
    {
        public Guid Id { get; set; }

        public string NoiDung { get; set; } = string.Empty;

        public string Difficulty { get; set; } = string.Empty;

        public string TopicName { get; set; } = string.Empty;

        public string CreatorName { get; set; } = string.Empty;
    }

    public class SubjectDifficultyStatsDto
    {
        public int Easy { get; set; }

        public int Medium { get; set; }

        public int Hard { get; set; }

        // Câu hỏi có mức độ khó không thuộc ba nhóm trên.
        public int Other { get; set; }
    }

    public class SubjectExamItemDto
    {
        public Guid Id { get; set; }

        public string TenBaiKT { get; set; } = string.Empty;

        public int ThoiLuong { get; set; }

        public int TotalQuestions { get; set; }

        public string GradeName { get; set; } = string.Empty;

        public string CreatorName { get; set; } = string.Empty;

        // published | pending | rejected | draft
        public string Status { get; set; } = "draft";
    }

    public class SubjectExamStatusStatsDto
    {
        public int Published { get; set; }

        public int Pending { get; set; }

        public int Rejected { get; set; }

        public int Draft { get; set; }
    }
}
