using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Commands.UpdateExam
{
    public class UpdateExamCommand
    : IRequest<string>
    {
        public Guid Id { get; set; }

        public string TenBaiKT { get; set; }

        public int ThoiLuong { get; set; }

        // Danh sách câu hỏi mới của đề (đồng bộ nguyên tử). Bỏ trống = giữ nguyên câu hỏi hiện có.
        public List<Guid>? QuestionIds { get; set; }
    }
}
