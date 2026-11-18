using OnlineExamSystem.Application.Common.Interfaces;
using System.Security.Claims;

namespace OnlineExamSystem.API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string UserId =>
            _httpContextAccessor.HttpContext?.User
                ?.FindFirst(ClaimTypes.NameIdentifier)
                ?.Value ?? string.Empty;

        public string Role =>
            _httpContextAccessor.HttpContext?.User
                ?.FindFirst(ClaimTypes.Role)
                ?.Value ?? string.Empty;
    }
}
