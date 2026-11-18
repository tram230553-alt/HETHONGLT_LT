using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Commands.UpdateTopic
{
    public record UpdateTopicCommand(
    Guid Id,
    string Name,
    string? Description,
    Guid SubjectId,
    Guid GradeId,
    Guid ChapterId,
    int OrderNum,
    bool IsActive
) : IRequest;
}
