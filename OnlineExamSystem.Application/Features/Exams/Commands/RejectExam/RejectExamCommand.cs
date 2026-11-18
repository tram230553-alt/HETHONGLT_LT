using MediatR;

namespace OnlineExamSystem.Application.Features.Exams.Commands.RejectExam;

public class RejectExamCommand : IRequest<string>
{
    public Guid Id { get; set; }

    // Một hoặc nhiều mã lý do (xem ExamRejectionReasons).
    public List<string> ReasonCodes { get; set; } = new();

    // Ghi chú chi tiết; bắt buộc khi chọn "Lý do khác".
    public string? Note { get; set; }
}
