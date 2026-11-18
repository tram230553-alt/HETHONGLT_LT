using MediatR;

namespace OnlineExamSystem.Application
    .Features.Admin.TeacherManagement
    .Commands.UpdateTeacher;

public class UpdateTeacherCommand
    : IRequest<string>
{
    public Guid TeacherId { get; set; }

    public string Email { get; set; }
        = string.Empty;

    public Guid SubjectId { get; set; }

    public Guid GradeId { get; set; }
}