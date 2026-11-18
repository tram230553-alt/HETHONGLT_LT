using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Questions.Commands.DeleteQuestion
{
    public class DeleteQuestionCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }

        // Giáo viên đã xác nhận gỡ câu hỏi khỏi các đề CHƯA công bố đang chứa nó.
        public bool ConfirmRemoveFromExams { get; set; }
    }
}
