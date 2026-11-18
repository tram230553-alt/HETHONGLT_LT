/**
 * System Utilities and Shared State Handlers
 */

export interface SystemLog {
  id: number;
  user: string;
  action: string;
  time: string;
  ip: string;
}

const DEFAULT_LOGS: SystemLog[] = [
  { id: 1, user: 'Admin', action: 'Xóa đề thi tốt nghiệp thử nghiệm tháng 5', time: '17/06/2026 09:30', ip: '192.168.1.1' },
  { id: 2, user: 'Admin', action: 'Khóa tài khoản giáo viên Trần Quốc Anh do vi phạm lịch biên soạn đề', time: '17/06/2026 10:15', ip: '192.168.1.1' },
  { id: 3, user: 'Admin', action: 'Đồng bộ lại SMTP Server & Gmail API thành công', time: '16/06/2026 12:44', ip: '115.79.138.4' },
  { id: 4, user: 'Admin', action: 'Cập nhật cấu hình điểm thi tối đa lên hệ thống (10 điểm)', time: '15/06/2026 15:20', ip: '192.168.1.5' },
  { id: 5, user: 'Admin', action: 'Bật kiểm duyệt tài khoản học viên đăng ký tự do', time: '14/06/2026 08:12', ip: '192.168.1.1' }
];

export function getSystemLogs(): SystemLog[] {
  try {
    const raw = localStorage.getItem('smartexam_system_logs');
    if (!raw) {
      localStorage.setItem('smartexam_system_logs', JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_LOGS;
  }
}

export function appendSystemLog(user: string, action: string, ip: string = '192.168.1.1') {
  try {
    const current = getSystemLogs();
    
    // Format current time: DD/MM/YYYY HH:MM
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}/${month}/${year} ${hours}:${minutes}`;

    const newLog: SystemLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user,
      action,
      time: formattedTime,
      ip
    };

    const updated = [newLog, ...current];
    localStorage.setItem('smartexam_system_logs', JSON.stringify(updated));
    
    // Trigger custom events for local and multi-tab reactive updates
    window.dispatchEvent(new CustomEvent('smartexam_logs_changed', { detail: updated }));
    // Trigger generic storage event for other components to capture
    localStorage.setItem('smartexam_logs_trigger', Date.now().toString());
  } catch (e) {
    console.error('Error appending system log:', e);
  }
}

export function clearSystemLogs() {
  try {
    localStorage.setItem('smartexam_system_logs', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('smartexam_logs_changed', { detail: [] }));
    localStorage.setItem('smartexam_logs_trigger', Date.now().toString());
  } catch (e) {
    console.error('Error clearing system logs:', e);
  }
}

/**
 * Global Theme Manager
 */
export type AppTheme = 'light' | 'dark' | 'auto';

export function getAppTheme(): AppTheme {
  const t = localStorage.getItem('smartexam_theme') as AppTheme;
  return (t === 'light' || t === 'dark' || t === 'auto') ? t : 'light';
}

export function setAppTheme(theme: AppTheme) {
  localStorage.setItem('smartexam_theme', theme);
  applyThemeToDOM(theme);
  
  // Custom event to sync theme inside the current page reactive context
  window.dispatchEvent(new CustomEvent('smartexam_theme_changed', { detail: theme }));
  localStorage.setItem('smartexam_theme_trigger', Date.now().toString());
}

export function applyThemeToDOM(theme: AppTheme) {
  const root = document.documentElement;
  
  let isDark = false;
  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  if (isDark) {
    root.classList.add('dark-theme');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark-theme');
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
  }
}
