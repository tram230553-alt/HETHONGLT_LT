using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string UserId { get; }

    string Role { get; }
}
