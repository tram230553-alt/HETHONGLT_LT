import { useNotifications } from '../services/notificationStore';

// Không hiển thị gì; giữ cho việc kiểm tra thông báo mới chạy ở mọi màn hình
// để người dùng luôn nhận được thông báo Admin vừa gửi.
export default function NotificationWatcher() {
  useNotifications();
  return null;
}
