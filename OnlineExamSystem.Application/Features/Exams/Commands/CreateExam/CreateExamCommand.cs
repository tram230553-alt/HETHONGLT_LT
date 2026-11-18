using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Exams.Commands.CreateExam
{
    public class CreateExamCommand
    : IRequest<Guid>
    {

        public string TenBaiKT { get; set; }

        public int ThoiLuong { get; set; }

        // Danh sách câu hỏi của đề. Bắt buộc và phải đúng số câu theo cấu hình của Admin.
        public List<Guid>? QuestionIds { get; set; }
    }
}
