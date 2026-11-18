# SmartExam - Một ứng dụng, ba giao diện theo role

## Tài khoản demo

| Role | Email | Mật khẩu | Giao diện |
|---|---|---|---|
| Admin | `admin@smartexam.edu.vn` | `123456` | Quản trị hệ thống |
| Teacher | `teacher@smartexam.edu.vn` | `123456` | Cổng giáo viên |
| Student | `student@smartexam.edu.vn` | `123456` | Cổng học sinh desktop |

## Luồng phân quyền

1. Người dùng đăng nhập tại một màn hình chung.
2. Role được lưu tại `smartexam_session_role`.
3. `App.tsx` đọc role và render một trong ba portal:
   - `admin` → Admin workspace.
   - `teacher` → `TeacherPortalView`.
   - `student` → `StudentPortalApp`.
4. Khi tích hợp ASP.NET Core Web API, lưu JWT vào `smartexam_access_token`. Hàm `getStoredRole()` trong `src/auth.ts` ưu tiên đọc role claim từ JWT.

## Role claim JWT được hỗ trợ

- `role`
- `roles`
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`

## Chạy project

```bash
npm install
npm run dev
```

Mặc định server chạy tại `http://localhost:3000`.

## Kết nối ASP.NET Core Web API

Tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Frontend gửi:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "matKhau": "123456"
}
```

Đến `POST /api/auth/login`. Phản hồi có thể là chuỗi JWT trực tiếp hoặc object chứa `token` / `accessToken`. Frontend đọc role trong JWT và tự chuyển portal.
