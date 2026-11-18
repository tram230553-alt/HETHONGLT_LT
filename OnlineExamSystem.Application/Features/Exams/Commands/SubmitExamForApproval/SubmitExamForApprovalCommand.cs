using MediatR;

namespace OnlineExamSystem.Application.Features.Exams.Commands.SubmitExamForApproval;

public class SubmitExamForApprovalCommand : IRequest<string>
{
    public Guid Id { get; set; }
}
