using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace OnlineExamSystem.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string Ho { get; set; }
        public string TenDem { get; set; } 
        public string Ten { get; set; }

        public string Email { get; set; } 

        public string MatKhau { get; set; }

        public string Role { get; set; }
        public bool IsLocked { get; set; }
        public DateTime CreatedAt { get; set; }
        [JsonIgnore]
        public Teacher Teacher { get; set; }
        [JsonIgnore]

        public Student Student { get; set; }

    }
}
