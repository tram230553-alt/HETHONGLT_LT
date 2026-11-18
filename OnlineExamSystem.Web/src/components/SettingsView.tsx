import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { toast } from '../services/toast';
import { BookOpen, Clock3, Loader2, Save, School, ShieldCheck } from 'lucide-react';
import {
  getSystemSettings,
  SystemSettings,
  updateSystemSettings,
} from '../services/systemSettingsService';

interface SettingsViewProps {
  platformTitle: string;
  onUpdatePlatformTitle: (title: string) => void;
}

type Tab = 'system' | 'learning' | 'exam' | 'security';

const defaultSettings: SystemSettings = {
  systemName: 'SmartExam',
  schoolName: 'Trường học',
  logoUrl: '',
  academicYear: '2026-2027',
  gradeCount: 0,
  subjectCount: 0,
  defaultPracticeQuestionCount: 20,
  allowPracticeRetake: true,
  defaultExamDurationMinutes: 60,
  defaultExamQuestionCount: 40,
  showExamResultAfterSubmit: true,
  sessionTimeoutMinutes: 60,
  minimumPasswordLength: 6,
  requireUppercasePassword: false,
  requireDigitPassword: false,
  updatedAt: '',
};

const tabs: Array<{ id: Tab; label: string; icon: typeof School }> = [
  { id: 'system', label: 'Thông tin hệ thống', icon: School },
  { id: 'learning', label: 'Cấu hình học tập', icon: BookOpen },
  { id: 'exam', label: 'Cấu hình đề thi', icon: Clock3 },
  { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
];

export default function SettingsView({ platformTitle, onUpdatePlatformTitle }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const [settings, setSettings] = useState<SystemSettings>({
    ...defaultSettings,
    systemName: platformTitle || defaultSettings.systemName,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    getSystemSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
        onUpdatePlatformTitle(data.systemName);
      })
      .catch((error: Error) => active && setMessage({ text: error.message, error: true }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [onUpdatePlatformTitle]);

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { gradeCount: _gradeCount, subjectCount: _subjectCount, updatedAt: _updatedAt, ...payload } = settings;
      const saved = await updateSystemSettings(payload);
      setSettings(saved);
      onUpdatePlatformTitle(saved.systemName);
      setMessage(null);
      toast.success('Đã lưu cấu hình. Cấu hình đề thi được áp dụng ngay cho toàn hệ thống.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể lưu cấu hình.';
      setMessage({ text, error: true });
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Đang tải cấu hình...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Cấu hình hệ thống</h1>
        <p className="mt-1 text-sm text-slate-500">Các thiết lập được áp dụng cho toàn hệ thống.</p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${message.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <nav className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {activeTab === 'system' && (
            <Section title="Thông tin hệ thống" description="Tên và nhận diện chính thức hiển thị cho người dùng.">
              <Field label="Tên hệ thống"><input value={settings.systemName} onChange={(e) => set('systemName', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></Field>
              <Field label="Tên trường"><input value={settings.schoolName} onChange={(e) => set('schoolName', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></Field>
              <Field label="Đường dẫn logo (URL)"><input value={settings.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="https://.../logo.png" /></Field>
              {settings.logoUrl && <div className="rounded-xl border border-slate-200 p-4"><img src={settings.logoUrl} alt="Logo hệ thống" className="h-20 max-w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>}
            </Section>
          )}

          {activeTab === 'learning' && (
            <Section title="Cấu hình học tập" description="Khối và môn học lấy từ dữ liệu quản lý hiện có; các thiết lập dưới đây điều khiển luyện tập.">
              <Field label="Năm học"><input value={settings.academicYear} onChange={(e) => set('academicYear', e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="2026-2027" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Khối đang quản lý" value={settings.gradeCount} />
                <Stat label="Môn học đang quản lý" value={settings.subjectCount} />
              </div>
              <Field label="Số câu luyện tập mặc định"><NumberInput value={settings.defaultPracticeQuestionCount} min={1} max={200} onChange={(value) => set('defaultPracticeQuestionCount', value)} /></Field>
              <Toggle label="Cho phép học sinh luyện tập lại" checked={settings.allowPracticeRetake} onChange={(value) => set('allowPracticeRetake', value)} />
            </Section>
          )}

          {activeTab === 'exam' && (
            <Section title="Cấu hình đề thi" description="Áp dụng bắt buộc cho toàn hệ thống. Giáo viên chỉ được tạo, sửa và gửi duyệt đề đúng thời gian và đúng số câu dưới đây.">
              <Field label="Thời gian mỗi đề thi (phút)"><NumberInput value={settings.defaultExamDurationMinutes} min={1} max={300} onChange={(value) => set('defaultExamDurationMinutes', value)} /></Field>
              <Field label="Số câu mỗi đề thi"><NumberInput value={settings.defaultExamQuestionCount} min={1} max={200} onChange={(value) => set('defaultExamQuestionCount', value)} /></Field>
              <Toggle label="Hiển thị kết quả ngay sau khi nộp bài" checked={settings.showExamResultAfterSubmit} onChange={(value) => set('showExamResultAfterSubmit', value)} />
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                Đề thi không đúng cấu hình sẽ bị hệ thống từ chối khi giáo viên lưu hoặc gửi duyệt, và Admin không thể phát hành đề đó.
                Đề đã tạo trước khi bạn đổi cấu hình cần được giáo viên chỉnh lại cho đúng.
              </div>
            </Section>
          )}

          {activeTab === 'security' && (
            <Section title="Bảo mật" description="Chính sách này áp dụng cho phiên đăng nhập mới và các lần đặt/đổi mật khẩu tiếp theo.">
              <Field label="Thời gian hết hạn phiên (phút)"><NumberInput value={settings.sessionTimeoutMinutes} min={5} max={1440} onChange={(value) => set('sessionTimeoutMinutes', value)} /></Field>
              <Field label="Độ dài mật khẩu tối thiểu"><NumberInput value={settings.minimumPasswordLength} min={6} max={64} onChange={(value) => set('minimumPasswordLength', value)} /></Field>
              <Toggle label="Bắt buộc có chữ in hoa" checked={settings.requireUppercasePassword} onChange={(value) => set('requireUppercasePassword', value)} />
              <Toggle label="Bắt buộc có chữ số" checked={settings.requireDigitPassword} onChange={(value) => set('requireDigitPassword', value)} />
            </Section>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="text-xs text-slate-400">Cập nhật: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('vi-VN') : 'Chưa có'}</span>
            <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="space-y-5"><div className="border-b border-slate-100 pb-4"><h2 className="text-lg font-black text-slate-800">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function NumberInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" />;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4"><span className="text-sm font-bold text-slate-700">{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-indigo-600" /></label>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"><div className="text-2xl font-black text-indigo-700">{value}</div><div className="text-xs font-bold text-slate-500">{label}</div></div>;
}
