import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getTeacherReport,
  TeacherReportDto,
} from '../services/teacherReportService';
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

interface TeacherReportsViewProps {
  subjectName: string;
  gradeName: string;
}

type ReportTab = 'overview' | 'questions' | 'exams';

const difficultyLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'dễ') return 'Dễ';
  if (normalized === 'hard' || normalized === 'khó') return 'Khó';
  return 'Trung bình';
};

const difficultyClass = (value: string) => {
  const label = difficultyLabel(value);
  if (label === 'Dễ') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (label === 'Khó') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export default function TeacherReportsView({
  subjectName,
  gradeName,
}: TeacherReportsViewProps) {
  const [report, setReport] = useState<TeacherReportDto | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await getTeacherReport());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const filteredQuestions = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    if (!report || !keyword) return report?.questions ?? [];
    return report.questions.filter((question) =>
      `${question.questionText} ${question.topicName} ${question.chapterName}`
        .toLocaleLowerCase('vi')
        .includes(keyword),
    );
  }, [report, search]);

  // Phân trang (đặt trước các return sớm bên dưới).
  const questionPagination = usePagination(filteredQuestions, 10, search);
  const examPagination = usePagination(report?.exams ?? [], 5);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-100 bg-white">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
        <span className="text-sm font-bold text-slate-500">Đang tải báo cáo...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-rose-700">{error || 'Không có dữ liệu báo cáo.'}</p>
        <button onClick={() => void loadReport()} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">
          Tải lại
        </button>
      </div>
    );
  }

  const cards = [
    { label: 'Câu hỏi đã tạo', value: report.totalQuestions, suffix: 'câu', icon: BookOpenCheck, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Đề đã phát hành', value: report.publishedExams, suffix: `/ ${report.totalExams} đề`, icon: FileText, color: 'text-violet-600 bg-violet-50' },
    { label: 'Học sinh tham gia', value: report.participatingStudentCount, suffix: 'học sinh', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Điểm thi trung bình', value: report.averageExamScore, suffix: '/ 10', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
                        <h2 className="mt-2 flex items-center gap-2 text-base font-black text-slate-800">
              <BarChart3 className="h-5 w-5 text-indigo-500" /> Báo cáo kết quả giảng dạy
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{subjectName} · {gradeName}. Điểm và lượt làm được lấy từ bài học sinh đã nộp.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1">
            {([
              ['overview', 'Tổng quan'],
              ['questions', `Câu hỏi (${report.questions.length})`],
              ['exams', `Đề thi (${report.exams.length})`],
            ] as [ReportTab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`rounded-xl px-3.5 py-2 text-xs font-bold ${activeTab === key ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
            <button onClick={() => void loadReport()} title="Cập nhật dữ liệu" className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-indigo-600">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, suffix, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-3xs">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                <p className="mt-1 text-2xl font-black text-slate-800">{value} <span className="text-xs font-bold text-slate-400">{suffix}</span></p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 lg:col-span-2">
              <h3 className="text-sm font-black text-slate-800">Hoạt động 6 tháng gần nhất</h3>
              <p className="mb-5 text-[11px] text-slate-400">Tháng không có hoạt động được hiển thị bằng 0.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.monthlyActivity} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="examAttempts" name="Lượt thi" fill="#7c9cf5" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="practiceAttempts" name="Lượt luyện tập" fill="#34d399" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="questionsCreated" name="Câu hỏi mới" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6">
              <h3 className="text-sm font-black text-slate-800">Kết quả thực tế</h3>
              <div className="mt-5 space-y-4 text-xs">
                <Metric label="Lượt nộp bài thi" value={`${report.examAttemptCount} lượt`} />
                <Metric label="Lượt luyện tập" value={`${report.practiceAttemptCount} lượt`} />
                <Metric label="Tỷ lệ đạt từ 5 điểm" value={`${report.examPassRate}%`} />
                <Metric label="Đề đã phát hành" value={`${report.publishedExams}/${report.totalExams}`} />
              </div>
              {report.examAttemptCount === 0 && (
                <p className="mt-5 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-700">Chưa có học sinh nộp bài thi nên điểm trung bình và tỷ lệ đạt đang là 0.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="rounded-3xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800">Hiệu quả từng câu hỏi</h3>
              <p className="text-[11px] text-slate-400">Gộp câu trả lời thật từ đề thi và luyện tập.</p>
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm câu hỏi, chương, chủ đề..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-180 text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Câu hỏi</th><th className="p-3">Chương / chủ đề</th><th className="p-3 text-center">Độ khó</th><th className="p-3 text-center">Lượt trả lời</th><th className="p-3 text-center">Tỷ lệ đúng</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {questionPagination.pageItems.map((question) => (
                  <tr key={question.questionId} className="hover:bg-slate-50/70">
                    <td className="max-w-md p-3 font-semibold text-slate-800"><p className="line-clamp-2">{question.questionText}</p></td>
                    <td className="p-3 text-slate-600"><p className="font-bold">{question.chapterName || 'Chưa phân chương'}</p><span className="text-[10px] text-slate-400">{question.topicName || 'Chưa phân chủ đề'}</span></td>
                    <td className="p-3 text-center"><span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${difficultyClass(question.difficulty)}`}>{difficultyLabel(question.difficulty)}</span></td>
                    <td className="p-3 text-center font-bold text-slate-700">{question.answeredCount}</td>
                    <td className="p-3 text-center font-black text-indigo-600">{question.answeredCount === 0 ? 'Chưa có dữ liệu' : `${question.correctRate}%`}</td>
                  </tr>
                ))}
                {filteredQuestions.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">Không có câu hỏi phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination
            page={questionPagination.page}
            pageSize={questionPagination.pageSize}
            total={questionPagination.total}
            onPageChange={questionPagination.setPage}
            itemLabel="câu hỏi"
          />
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-4">
          {examPagination.pageItems.map((exam) => (
            <div key={exam.examId} className="rounded-3xl border border-slate-100 bg-white p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center">
                <div><h3 className="text-sm font-black text-slate-800">{exam.examName}</h3><p className="mt-1 text-[10px] font-semibold text-slate-400">{exam.totalQuestions} câu · {exam.durationMinutes} phút · {exam.participatingStudentCount} học sinh</p></div>
                <span className={`self-start rounded-lg px-2.5 py-1 text-[10px] font-black ${exam.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{exam.isPublished ? 'Đã phát hành' : 'Chưa phát hành'}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <ExamMetric label="Lượt làm" value={`${exam.attemptCount}`} />
                <ExamMetric label="Điểm TB" value={`${exam.averageScore}/10`} />
                <ExamMetric label="Cao nhất" value={`${exam.highestScore}/10`} />
                <ExamMetric label="Thấp nhất" value={`${exam.lowestScore}/10`} />
                <ExamMetric label="Tỷ lệ đạt" value={`${exam.passRate}%`} />
              </div>
              {exam.attemptCount === 0 && <p className="mt-3 text-[10px] italic text-slate-400">Chưa có bài nộp; các chỉ số điểm đang là 0.</p>}
            </div>
          ))}
          <Pagination
            page={examPagination.page}
            pageSize={examPagination.pageSize}
            total={examPagination.total}
            onPageChange={examPagination.setPage}
            itemLabel="đề thi"
          />
          {report.exams.length === 0 && <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">Giáo viên chưa tạo đề thi.</div>}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="font-semibold text-slate-500">{label}</span><strong className="text-slate-800">{value}</strong></div>;
}

function ExamMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 text-center"><span className="block text-[9px] font-black uppercase text-slate-400">{label}</span><strong className="mt-1 block text-base text-slate-800">{value}</strong></div>;
}
