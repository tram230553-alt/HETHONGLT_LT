using MediatR;

namespace OnlineExamSystem.Application.Features.Teachers.Commands.UpdateProfile;

public class UpdateProfileCommand
    : IRequest<string>
{
    // Teacher chỉ được tự cập nhật SĐT.
    // Không thêm Ho/TenDem/Ten/Email/SubjectId/GradeId vào command này.
    public string SDT { get; set; } = string.Empty;
}
