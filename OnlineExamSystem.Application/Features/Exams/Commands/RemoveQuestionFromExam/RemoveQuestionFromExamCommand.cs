using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Commands.RemoveQuestionFromExam
{
    public class RemoveQuestionFromExamCommand
    : IRequest<string>
    {
        public Guid ExamId { get; set; }

        public Guid QuestionId { get; set; }
    }
}
