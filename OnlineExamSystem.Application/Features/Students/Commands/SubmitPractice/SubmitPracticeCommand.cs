using MediatR;

public record SubmitPracticeCommand(
    Guid TopicId,
    List<SubmitPracticeAnswerDto> Answers
) : IRequest<SubmitPracticeResult>;