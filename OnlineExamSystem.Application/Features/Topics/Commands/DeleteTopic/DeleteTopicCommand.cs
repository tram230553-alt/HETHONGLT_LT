using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Commands.DeleteTopic
{
    public record DeleteTopicCommand(Guid Id)
    : IRequest;
}
