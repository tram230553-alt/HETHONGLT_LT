using MediatR;
using OnlineExamSystem.Application.DTOs.Questions;
using OnlineExamSystem.Application.DTOs.Teachers;
using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Features.Teachers.Queries.GetMyQuestions
{
    public class GetMyQuestionsQuery
    : IRequest<List<TeacherQuestionDto>>
    {
    }
}
