using MediatR;
using OnlineExamSystem.Application.DTOs.Students;
using System.Text.Json.Serialization;

namespace OnlineExamSystem.Application.Features.Students.Commands.SubmitExam
{
    public class SubmitExamCommand
        : IRequest<SubmitExamResponseDto>
    {
        public Guid ExamId { get; set; }

        public List<StudentAnswerDto> Answers { get; set; }
            = new();

        // Chỉ Controller được phép bật cờ này cho endpoint làm lại.
        // Client không thể tự gửi isRetake=true trong JSON để vượt quy tắc nộp lần đầu.
        [JsonIgnore]
        public bool IsRetake { get; set; }
    }
}
