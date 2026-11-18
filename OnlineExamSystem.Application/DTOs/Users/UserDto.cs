using System;
using System.Collections.Generic;
using System.Text;

namespace OnlineExamSystem.Application.DTOs.Users
{
    public class UserDto
    {
        public Guid Id { get; set; }

        public string Ho { get; set; }

        public string TenDem { get; set; }

        public string Ten { get; set; }

        public string Email { get; set; }

        public string Role { get; set; }

        public bool IsLocked { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
