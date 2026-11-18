using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Topics.Commands.UpdateTopic
{
    public class UpdateTopicRequest
    {
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid SubjectId { get; set; }

        public Guid GradeId { get; set; }

        public Guid ChapterId { get; set; }

        public int OrderNum { get; set; }

        public bool IsActive { get; set; }
    }
}
