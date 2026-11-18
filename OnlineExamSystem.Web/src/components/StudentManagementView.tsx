import { toast } from "../services/toast";
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Eye,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  RefreshCw,
  Search,
  School,
  Unlock,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import type { Student } from "../types";
import SchoolStudentImportCard from "./SchoolStudentImportCard";
import Pagination from "./Pagination";
import { usePagination } from "../hooks/usePagination";
interface StudentManagementViewProps {
  students: Student[];
  // Danh sách khối lấy từ hệ thống, dùng để lọc và thống kê số học sinh theo khối.
  grades?: { id: string; name: string }[];
  onUpdateStudentStatus: (
    id: string,
    status: "active" | "inactive",
  ) => void | Promise<void>;
  onReload?: () => void | Promise<void>;
}

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const datePart = value.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function csvValue(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function StudentManagementView({
  students,
  grades = [],
  onUpdateStudentStatus,
  onReload,
}: StudentManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [changingStudentId, setChangingStudentId] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Kết quả thao tác hiển thị dạng toast cố định phía trên.
  useEffect(() => {
    if (!message) return;
    if (message.type === "success") toast.success(message.text);
    else toast.error(message.text);
  }, [message]);

  // Danh sách khối kèm số học sinh. Khối chưa có học sinh vẫn hiển thị (0 học sinh).
  const gradeStats = useMemo(() => {
    const counts = new Map<string, number>();

    students.forEach((student) => {
      if (student.grade) {
        counts.set(student.grade, (counts.get(student.grade) ?? 0) + 1);
      }
    });

    const names = new Set<string>([...grades.map((grade) => grade.name), ...counts.keys()]);

    return Array.from(names)
      .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }))
      .map((name) => ({ name, count: counts.get(name) ?? 0 }));
  }, [students, grades]);

  const uniqueClasses = useMemo(
    () =>
      Array.from(
        new Set(students.map((student) => student.className).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("vi");

    return students.filter((student) => {
      const searchable = [
        student.studentCode ?? "",
        student.name,
        student.email,
        student.className,
        student.grade,
      ]
        .join(" ")
        .toLocaleLowerCase("vi");

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesGrade = filterGrade === "all" || student.grade === filterGrade;
      const matchesClass = filterClass === "all" || student.className === filterClass;
      const matchesStatus = filterStatus === "all" || student.status === filterStatus;

      return matchesSearch && matchesGrade && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, filterGrade, filterClass, filterStatus]);

  // Phân trang danh sách học sinh (về trang 1 khi đổi từ khóa/bộ lọc).
  const studentPagination = usePagination(
    filteredStudents,
    10,
    `${searchTerm}|${filterGrade}|${filterClass}|${filterStatus}`,
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const totalStudents = students.length;
  const activeStudents = students.filter((student) => student.status === "active").length;
  const lockedStudents = totalStudents - activeStudents;

  const handleToggleStatus = async (student: Student) => {
    const nextStatus = student.status === "active" ? "inactive" : "active";

    try {
      setMessage(null);
      setChangingStudentId(student.id);
      await onUpdateStudentStatus(student.id, nextStatus);
      setMessage({
        type: "success",
        text:
          nextStatus === "inactive"
            ? `Đã khóa tài khoản ${student.name}.`
            : `Đã mở khóa tài khoản ${student.name}.`,
      });
    } catch (error) {
      console.error("Không cập nhật được trạng thái học sinh:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Không cập nhật được trạng thái học sinh.",
      });
    } finally {
      setChangingStudentId(null);
    }
  };

  const handleReload = async () => {
    if (!onReload) return;

    try {
      setMessage(null);
      setReloading(true);
      await onReload();
      setMessage({ type: "success", text: "Đã tải lại danh sách học sinh." });
    } catch (error) {
      console.error("Không tải lại được danh sách học sinh:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Không tải lại được danh sách học sinh.",
      });
    } finally {
      setReloading(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Mã học sinh",
        "Họ tên",
        "Email",
        "Ngày sinh",
        "Lớp",
        "Khối",
        "Trạng thái",
        "Ngày tạo tài khoản",
      ],
      ...filteredStudents.map((student) => [
        student.studentCode ?? "",
        student.name,
        student.email,
        student.birthDate ?? "",
        student.className,
        student.grade,
        student.status === "active" ? "Hoạt động" : "Đã khóa",
        student.joinedDate,
      ]),
    ];

    const content = rows.map((row) => row.map(csvValue).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `danh-sach-hoc-sinh-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý học sinh</h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách tài khoản học sinh đã tự đăng ký và được lưu trong hệ thống.
          </p>
        </div>
           
        <div className="flex flex-wrap gap-2">
          {onReload && (
            <button
              type="button"
              onClick={handleReload}
              disabled={reloading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
              Tải lại
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
        </div>
      </div>

          <SchoolStudentImportCard />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng học sinh</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{totalStudents}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Đang hoạt động</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{activeStudents}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Đã khóa</p>
              <p className="mt-2 text-3xl font-black text-rose-600">{lockedStudents}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <UserX className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-black uppercase tracking-wider text-slate-400">
            Khối
          </span>

          {[{ name: "all", label: "Tất cả", count: totalStudents },
            ...gradeStats.map((grade) => ({ name: grade.name, label: grade.name, count: grade.count })),
          ].map((grade) => {
            const active = filterGrade === grade.name;

            return (
              <button
                key={grade.name}
                type="button"
                onClick={() => setFilterGrade(grade.name)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                }`}
              >
                {grade.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {grade.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm mã HS, họ tên, email, lớp..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select
            value={filterClass}
            onChange={(event) => setFilterClass(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="all">Tất cả lớp</option>
            {uniqueClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Mã HS</th>
                <th className="px-5 py-4">Học sinh</th>
                <th className="px-5 py-4">Lớp</th>
                <th className="px-5 py-4">Khối</th>
                <th className="px-5 py-4">Ngày sinh</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {studentPagination.pageItems.map((student) => {
                const isChanging = changingStudentId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-sm font-black text-indigo-600">
                      {student.studentCode || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {student.className || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {student.grade || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(student.birthDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          student.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {student.status === "active" ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Xem hồ sơ"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isChanging}
                          onClick={() => void handleToggleStatus(student)}
                          className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black disabled:opacity-60 ${
                            student.status === "active"
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {isChanging ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : student.status === "active" ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                          {student.status === "active" ? "Khóa" : "Mở khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="px-6 py-14 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-bold text-slate-600">Không tìm thấy học sinh phù hợp.</p>
            <p className="mt-1 text-sm text-slate-400">
              Hãy thay đổi từ khóa hoặc bộ lọc hiện tại.
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
          Hiển thị {filteredStudents.length} / {students.length} học sinh
        </div>

        <Pagination
          page={studentPagination.page}
          pageSize={studentPagination.pageSize}
          total={studentPagination.total}
          onPageChange={studentPagination.setPage}
          itemLabel="học sinh"
          className="border-t border-slate-100 px-5 pb-3"
        />
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">Hồ sơ học sinh</h2>
                <p className="mt-1 text-sm text-slate-500">Dữ liệu lấy từ tài khoản đã đăng ký.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xl font-black text-slate-900">{selectedStudent.name}</p>
                <p className="mt-1 text-sm font-bold text-indigo-600">
                  {selectedStudent.studentCode || "Chưa có mã học sinh"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem icon={Hash} label="Mã học sinh" value={selectedStudent.studentCode || "—"} />
                <InfoItem icon={Mail} label="Email" value={selectedStudent.email || "—"} />
                <InfoItem icon={CalendarDays} label="Ngày sinh" value={formatDate(selectedStudent.birthDate)} />
                <InfoItem icon={School} label="Lớp" value={selectedStudent.className || "—"} />
                <InfoItem icon={GraduationCap} label="Khối" value={selectedStudent.grade || "—"} />
                <InfoItem icon={CalendarDays} label="Ngày đăng ký" value={formatDate(selectedStudent.joinedDate)} />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black ${
                    selectedStudent.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {selectedStudent.status === "active" ? "Tài khoản hoạt động" : "Tài khoản đã khóa"}
                </span>

                <button
                  type="button"
                  disabled={changingStudentId === selectedStudent.id}
                  onClick={() => void handleToggleStatus(selectedStudent)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-60 ${
                    selectedStudent.status === "active"
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {selectedStudent.status === "active" ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  {selectedStudent.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
