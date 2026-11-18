import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, FileText, GraduationCap, HelpCircle, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAdminAnalyticsReport, type AdminAnalyticsReportDto } from '../services/adminReportService';
import { getRecentExamSubmissions, type AdminExamSubmissionLogDto } from '../services/adminDashboardService';

interface DashboardViewProps { onNavigateToView: (view: string) => void; }
const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e'];

export default function DashboardView({ onNavigateToView }: DashboardViewProps) {
  const [report, setReport] = useState<AdminAnalyticsReportDto | null>(null);
  const [submissions, setSubmissions] = useState<AdminExamSubmissionLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [analytics, logs] = await Promise.all([getAdminAnalyticsReport(), getRecentExamSubmissions(10)]);
      setReport(analytics);
      setSubmissions(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu tổng quan.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const timer = window.setInterval(() => void loadDashboard(false), 30000);
    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  const topTeachers = useMemo(() => [...(report?.teachers ?? [])]
    .sort((a, b) => (b.questionCount + b.publishedExamCount) - (a.questionCount + a.publishedExamCount))
    .slice(0, 5), [report]);

  if (loading) return <DashboardState text="Đang tải dữ liệu..." spinning />;
  if (error || !report) return <DashboardState text={error || 'Không có dữ liệu tổng quan.'} onRetry={() => void loadDashboard()} />;

  const cards = [
    { label: 'Giáo viên', value: report.totalTeachers, sub: `${report.totalUsers} tài khoản toàn hệ thống`, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Học sinh', value: report.totalStudents, sub: `${report.lockedUsers} tài khoản đang khóa`, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Môn học', value: report.subjects.length, sub: 'Đang được quản lý', icon: BookOpen, color: 'text-violet-600 bg-violet-50' },
    { label: 'Câu hỏi', value: report.totalQuestions, sub: 'Tổng câu hỏi đã lưu', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Đề thi', value: report.totalExams, sub: `${report.publishedExams} đề đã phát hành`, icon: FileText, color: 'text-rose-600 bg-rose-50' },
    { label: 'Lượt thi', value: report.examAttemptCount, sub: `Điểm TB ${report.averageExamScore}/10`, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Lượt luyện tập', value: report.practiceAttemptCount, sub: `Điểm TB ${report.averagePracticeScore}/10`, icon: RefreshCw, color: 'text-teal-600 bg-teal-50' },
    { label: 'Tỷ lệ đạt', value: `${report.examPassRate}%`, sub: 'Bài thi đạt từ 5 điểm', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50' },
  ];
  const subjectData = report.subjects.filter(x => x.questionCount > 0).map((x, index) => ({ name: x.subjectName, value: x.questionCount, color: COLORS[index % COLORS.length] }));

  return <div className="space-y-6" id="dashboard-view-main">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div><h1 className="mt-2 text-2xl font-bold text-slate-800">Tổng quan hệ thống</h1></div>
      <button onClick={() => void loadDashboard()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Cập nhật</button>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-800">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{sub}</p></div>)}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <ChartCard title="Phân bố câu hỏi" subtitle="Số câu hỏi thực tế theo môn học">{subjectData.length === 0 ? <Empty text="Chưa có câu hỏi." /> : <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={subjectData} innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value">{subjectData.map(x => <Cell key={x.name} fill={x.color} />)}</Pie><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer>}</ChartCard>
      <ChartCard title="Lượt làm bài" subtitle="Bài thi và luyện tập trong 6 tháng gần nhất"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.monthlyActivity} margin={{ left: -25, right: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 9 }} /><YAxis allowDecimals={false} tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="examAttempts" name="Lượt thi" fill="#6366f1" radius={[4,4,0,0]} /><Bar dataKey="practiceAttempts" name="Luyện tập" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Kết quả học tập" subtitle="Điểm trung bình thật theo tháng (thang 10)"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.monthlyActivity} margin={{ left: -25, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 9 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="averageExamScore" name="Điểm thi TB" stroke="#ec4899" strokeWidth={2} /><Line type="monotone" dataKey="averagePracticeScore" name="Điểm luyện tập TB" stroke="#3b82f6" strokeWidth={2} /></LineChart></ResponsiveContainer></ChartCard>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-slate-800">Nhật ký nộp bài thi</h3><p className="text-xs text-slate-400">10 bài nộp mới nhất trong hệ thống</p></div><button onClick={() => onNavigateToView('Student Management')} className="flex items-center text-xs font-bold text-indigo-600">Quản lý học sinh <ChevronRight className="h-4 w-4" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-160 text-left text-xs"><thead className="border-b border-slate-100 text-[10px] uppercase text-slate-400"><tr><th className="p-3">Học sinh</th><th className="p-3">Đề thi</th><th className="p-3">Thời gian</th><th className="p-3 text-center">Điểm</th><th className="p-3 text-right">Kết quả</th></tr></thead><tbody className="divide-y divide-slate-50">{submissions.map(x => <tr key={x.examResultId}><td className="p-3 font-bold text-slate-700">{x.studentName}<span className="block text-[10px] font-medium text-slate-400">{x.studentCode} · {x.gradeName}</span></td><td className="p-3 font-semibold text-slate-600">{x.examName}<span className="block text-[10px] font-medium text-slate-400">{x.subjectName}</span></td><td className="p-3 whitespace-nowrap text-slate-500">{new Date(x.submittedAt).toLocaleString('vi-VN')}</td><td className="p-3 text-center font-black">{x.score}/10</td><td className="p-3 text-right"><span className={`rounded-lg px-2 py-1 text-[10px] font-black ${x.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{x.isPassed ? 'Đạt' : 'Chưa đạt'}</span></td></tr>)}{submissions.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">Chưa có học sinh nộp bài thi.</td></tr>}</tbody></table></div></div>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h3 className="font-bold text-slate-800">Giáo viên nổi bật</h3><p className="mb-3 text-xs text-slate-400">Xếp theo câu hỏi và đề đã phát hành</p><div className="divide-y divide-slate-100">{topTeachers.map((x, i) => <div key={x.teacherId} className="flex items-center justify-between py-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-700">#{i + 1} {x.teacherName}</p><p className="text-[10px] text-slate-400">{x.subjectName} · {x.gradeName}</p></div><div className="text-right text-[10px] font-bold text-slate-500"><p>{x.questionCount} câu</p><p>{x.publishedExamCount}/{x.examCount} đề</p></div></div>)}{topTeachers.length === 0 && <Empty text="Chưa có giáo viên." />}</div></div>
    </div>
  </div>;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h3 className="font-bold text-slate-800">{title}</h3><p className="text-xs text-slate-400">{subtitle}</p><div className="mt-4 h-64">{children}</div></div>; }
function Empty({ text }: { text: string }) { return <div className="flex h-full items-center justify-center text-xs text-slate-400">{text}</div>; }
function DashboardState({ text, spinning, onRetry }: { text: string; spinning?: boolean; onRetry?: () => void }) { return <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white text-sm font-bold text-slate-500">{spinning && <RefreshCw className="mb-3 h-6 w-6 animate-spin text-indigo-500" />}<p>{text}</p>{onRetry && <button onClick={onRetry} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs text-white">Tải lại</button>}</div>; }
