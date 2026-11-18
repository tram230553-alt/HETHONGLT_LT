import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, BarChart3, BookOpen, CheckCircle2, FileText, GraduationCap, RefreshCw, Search, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminAnalyticsReportDto, getAdminAnalyticsReport } from '../services/adminReportService';

type ReportTab = 'subject' | 'teacher' | 'student' | 'exam';

export default function AnalyticsReportsView() {
  const [report, setReport] = useState<AdminAnalyticsReportDto | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('subject');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await getAdminAnalyticsReport());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReport(); }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    const match = (value: string) => value.toLocaleLowerCase('vi').includes(keyword);
    if (!report) return { subjects: [], teachers: [], students: [], exams: [] };
    return {
      subjects: report.subjects.filter(x => match(x.subjectName)),
      teachers: report.teachers.filter(x => match(`${x.teacherName} ${x.subjectName} ${x.gradeName}`)),
      students: report.students.filter(x => match(`${x.studentName} ${x.studentCode} ${x.gradeName}`)),
      exams: report.exams.filter(x => match(`${x.examName} ${x.subjectName} ${x.teacherName}`)),
    };
  }, [report, search]);

  if (loading) return <Status icon={<RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />} text="Đang tổng hợp dữ liệu toàn hệ thống..." />;
  if (error || !report) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" /><p className="text-sm font-bold text-rose-700">{error || 'Không có dữ liệu báo cáo.'}</p><button onClick={() => void loadReport()} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Tải lại</button></div>;
  }

  const cards = [
    { label: 'Học sinh', value: report.totalStudents, detail: `${report.totalUsers} tài khoản`, icon: GraduationCap, style: 'bg-blue-50 text-blue-600' },
    { label: 'Giáo viên', value: report.totalTeachers, detail: `${report.lockedUsers} tài khoản bị khóa`, icon: Users, style: 'bg-violet-50 text-violet-600' },
    { label: 'Lượt làm bài', value: report.examAttemptCount + report.practiceAttemptCount, detail: `${report.examAttemptCount} thi · ${report.practiceAttemptCount} luyện tập`, icon: CheckCircle2, style: 'bg-emerald-50 text-emerald-600' },
    { label: 'Điểm thi trung bình', value: `${report.averageExamScore}/10`, detail: `Tỷ lệ đạt: ${report.examPassRate}%`, icon: BarChart3, style: 'bg-amber-50 text-amber-600' },
  ];

  return <div className="space-y-6 pb-12" id="analytics-reports-view">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div><h1 className="text-xl font-black tracking-tight text-slate-800">Báo cáo & Phân tích</h1><p className="mt-1 text-xs font-medium text-slate-500">Số liệu theo môn học, giáo viên, học sinh và đề thi.</p></div>
      <button onClick={() => void loadReport()} className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"><RefreshCw className="h-4 w-4" /> Cập nhật dữ liệu</button>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, detail, icon: Icon, style }) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${style}`}><Icon className="h-5 w-5" /></div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-800">{value}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{detail}</p></div>)}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 xl:col-span-2"><h2 className="text-sm font-black text-slate-800">Hoạt động 6 tháng gần nhất</h2><p className="mb-5 text-[11px] text-slate-400">Tài khoản mới và các bài đã nộp theo tháng.</p><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.monthlyActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="newUsers" name="Tài khoản mới" fill="#8b5cf6" radius={[5, 5, 0, 0]} /><Bar dataKey="examAttempts" name="Lượt thi" fill="#6366f1" radius={[5, 5, 0, 0]} /><Bar dataKey="practiceAttempts" name="Lượt luyện tập" fill="#10b981" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6"><h2 className="text-sm font-black text-slate-800">Tình trạng nội dung</h2><div className="mt-5 space-y-4"><Summary label="Tổng câu hỏi" value={`${report.totalQuestions} câu`} /><Summary label="Tổng đề thi" value={`${report.totalExams} đề`} /><Summary label="Đề đã phát hành" value={`${report.publishedExams}/${report.totalExams}`} /><Summary label="Điểm luyện tập TB" value={`${report.averagePracticeScore}/10`} /></div>{report.examAttemptCount === 0 && report.practiceAttemptCount === 0 && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-700">Chưa có bài nộp; hệ thống hiển thị 0 và không chèn dữ liệu mẫu.</p>}</div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
      <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50 p-1"><Tab active={activeTab === 'subject'} onClick={() => setActiveTab('subject')} icon={<BookOpen className="h-4 w-4" />} label={`Môn học (${report.subjects.length})`} /><Tab active={activeTab === 'teacher'} onClick={() => setActiveTab('teacher')} icon={<Users className="h-4 w-4" />} label={`Giáo viên (${report.teachers.length})`} /><Tab active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<GraduationCap className="h-4 w-4" />} label={`Học sinh (${report.students.length})`} /><Tab active={activeTab === 'exam'} onClick={() => setActiveTab('exam')} icon={<FileText className="h-4 w-4" />} label={`Đề thi (${report.exams.length})`} /></div>
      <div className="border-b border-slate-100 p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, mã, môn hoặc khối..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-400" /></div></div>
      <div className="overflow-x-auto">{activeTab === 'subject' && <SubjectTable rows={filtered.subjects} />}{activeTab === 'teacher' && <TeacherTable rows={filtered.teachers} />}{activeTab === 'student' && <StudentTable rows={filtered.students} />}{activeTab === 'exam' && <ExamTable rows={filtered.exams} />}</div>
    </div>
  </div>;
}

function Status({ icon, text }: { icon: ReactNode; text: string }) { return <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-100 bg-white">{icon}<span className="ml-2 text-sm font-bold text-slate-500">{text}</span></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs"><span className="font-semibold text-slate-500">{label}</span><strong className="text-slate-800">{value}</strong></div>; }
function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) { return <button onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${active ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>{icon}{label}</button>; }
const Empty = ({ columns }: { columns: number }) => <tr><td colSpan={columns} className="p-10 text-center text-xs text-slate-400">Không có dữ liệu phù hợp.</td></tr>;

function SubjectTable({ rows }: { rows: AdminAnalyticsReportDto['subjects'] }) { return <table className="w-full min-w-190 text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Môn học</th><th className="p-3 text-center">Câu hỏi</th><th className="p-3 text-center">Đề phát hành</th><th className="p-3 text-center">Thi / luyện tập</th><th className="p-3 text-right">Điểm thi TB</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(x => <tr key={x.subjectId} className="hover:bg-slate-50/70"><td className="p-3 font-bold text-slate-800">{x.subjectName}</td><td className="p-3 text-center">{x.questionCount}</td><td className="p-3 text-center">{x.publishedExamCount}/{x.examCount}</td><td className="p-3 text-center">{x.examAttemptCount} / {x.practiceAttemptCount}</td><td className="p-3 text-right font-black text-indigo-600">{x.examAttemptCount === 0 ? 'Chưa có dữ liệu' : `${x.averageExamScore}/10`}</td></tr>)}{rows.length === 0 && <Empty columns={5} />}</tbody></table>; }
function TeacherTable({ rows }: { rows: AdminAnalyticsReportDto['teachers'] }) { return <table className="w-full min-w-190 text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Giáo viên</th><th className="p-3 text-center">Câu hỏi</th><th className="p-3 text-center">Đề phát hành</th><th className="p-3 text-center">Lượt thi</th><th className="p-3 text-right">Điểm HS TB</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(x => <tr key={x.teacherId} className="hover:bg-slate-50/70"><td className="p-3"><p className="font-bold text-slate-800">{x.teacherName}</p><span className="text-[10px] text-slate-400">{x.subjectName} · {x.gradeName}</span></td><td className="p-3 text-center">{x.questionCount}</td><td className="p-3 text-center">{x.publishedExamCount}/{x.examCount}</td><td className="p-3 text-center">{x.examAttemptCount}</td><td className="p-3 text-right font-black text-indigo-600">{x.examAttemptCount === 0 ? 'Chưa có dữ liệu' : `${x.averageStudentScore}/10`}</td></tr>)}{rows.length === 0 && <Empty columns={5} />}</tbody></table>; }
function StudentTable({ rows }: { rows: AdminAnalyticsReportDto['students'] }) { return <table className="w-full min-w-210 text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Học sinh</th><th className="p-3 text-center">Lượt thi</th><th className="p-3 text-center">Luyện tập</th><th className="p-3 text-center">Điểm thi / luyện tập</th><th className="p-3 text-right">Hoạt động cuối</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(x => <tr key={x.studentId} className="hover:bg-slate-50/70"><td className="p-3"><p className="font-bold text-slate-800">{x.studentName}</p><span className="text-[10px] text-slate-400">{x.studentCode} · {x.gradeName}</span></td><td className="p-3 text-center">{x.examAttemptCount}</td><td className="p-3 text-center">{x.practiceAttemptCount}</td><td className="p-3 text-center font-black text-indigo-600">{x.averageExamScore}/10 · {x.averagePracticeScore}/10</td><td className="p-3 text-right text-slate-500">{x.lastActivityAt ? new Date(x.lastActivityAt).toLocaleString('vi-VN') : 'Chưa hoạt động'}</td></tr>)}{rows.length === 0 && <Empty columns={5} />}</tbody></table>; }
function ExamTable({ rows }: { rows: AdminAnalyticsReportDto['exams'] }) { return <table className="w-full min-w-220 text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Đề thi</th><th className="p-3 text-center">Trạng thái</th><th className="p-3 text-center">Lượt / HS</th><th className="p-3 text-center">TB · cao · thấp</th><th className="p-3 text-right">Tỷ lệ đạt</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(x => <tr key={x.examId} className="hover:bg-slate-50/70"><td className="p-3"><p className="font-bold text-slate-800">{x.examName}</p><span className="text-[10px] text-slate-400">{x.subjectName} · {x.teacherName} · {x.totalQuestions} câu</span></td><td className="p-3 text-center"><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${x.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{x.isPublished ? 'Đã phát hành' : 'Chưa phát hành'}</span></td><td className="p-3 text-center">{x.attemptCount} / {x.studentCount}</td><td className="p-3 text-center font-bold text-slate-700">{x.attemptCount === 0 ? 'Chưa có dữ liệu' : `${x.averageScore} · ${x.highestScore} · ${x.lowestScore}`}</td><td className="p-3 text-right font-black text-indigo-600">{x.attemptCount === 0 ? '—' : `${x.passRate}%`}</td></tr>)}{rows.length === 0 && <Empty columns={5} />}</tbody></table>; }
