import React from "react";

import {
    Upload,
    FileSpreadsheet,
} from "lucide-react";

import {
    importSchoolStudents,
    type ImportSchoolStudentsResult,
} from "../services/schoolStudentService";

export default function SchoolStudentImportCard() {
    const [
        file,
        setFile,
    ] = React.useState<File | null>(
        null,
    );

    const [
        loading,
        setLoading,
    ] = React.useState(false);

    const [
        error,
        setError,
    ] = React.useState<string | null>(
        null,
    );

    const [
        result,
        setResult,
    ] =
        React.useState<
            ImportSchoolStudentsResult | null
        >(null);

    const handleImport =
        async () => {
            if (!file) {
                setError(
                    "Vui lòng chọn file Excel hoặc CSV.",
                );

                return;
            }

            try {
                setLoading(true);
                setError(null);
                setResult(null);

                const response =
                    await importSchoolStudents(
                        file,
                    );

                setResult(response);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Import thất bại.",
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <div
            className="
                bg-white
                rounded-2xl
                border
                border-slate-200
                p-5
            "
        >
            <div
                className="
                    flex
                    items-center
                    gap-3
                    mb-4
                "
            >
                <div
                    className="
                        w-10
                        h-10
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                        flex
                        items-center
                        justify-center
                    "
                >
                    <FileSpreadsheet
                        className="w-5 h-5"
                    />
                </div>

                <div>
                    <h3
                        className="
                            font-bold
                            text-slate-800
                        "
                    >
                        Import danh sách học sinh trường
                    </h3>

                    <p
                        className="
                            text-sm
                            text-slate-500
                        "
                    >
                        Hỗ trợ CSV và Excel (.xlsx)
                    </p>
                </div>
            </div>

            <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => {
                    const selected =
                        event.target
                            .files?.[0]
                        ?? null;

                    setFile(selected);
                    setError(null);
                    setResult(null);
                }}
                className="
                    block
                    w-full
                    text-sm
                    mb-4
                "
            />

            <button
                type="button"
                disabled={
                    !file ||
                    loading
                }
                onClick={
                    handleImport
                }
                className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-blue-600
                    text-white
                    font-bold
                    text-sm
                    flex
                    items-center
                    gap-2
                    disabled:opacity-50
                "
            >
                <Upload
                    className="
                        w-4
                        h-4
                    "
                />

                {loading
                    ? "Đang import..."
                    : "Import danh sách"}
            </button>

            {error && (
                <div
                    className="
                        mt-4
                        rounded-xl
                        bg-red-50
                        p-3
                        text-sm
                        text-red-600
                    "
                >
                    {error}
                </div>
            )}

            {result && (
                <div
                    className="
                        mt-4
                        rounded-xl
                        bg-slate-50
                        p-4
                    "
                >
                    <p className="font-bold">
                        Kết quả import
                    </p>

                    <div
                        className="
                            mt-2
                            text-sm
                            space-y-1
                        "
                    >
                        <p>
                            Tổng dòng:{" "}
                            {result.totalRows}
                        </p>

                        <p>
                            Thêm mới:{" "}
                            {result.inserted}
                        </p>

                        <p>
                            Cập nhật:{" "}
                            {result.updated}
                        </p>

                        <p>
                            Không thay đổi:{" "}
                            {result.unchanged}
                        </p>

                        <p>
                            Lỗi:{" "}
                            {result.failed}
                        </p>
                    </div>

                    {result.errors.length >
                        0 && (
                            <div
                                className="
                                mt-3
                                text-sm
                                text-red-600
                                space-y-1
                            "
                            >
                                {result.errors.map(
                                    (
                                        message,
                                        index,
                                    ) => (
                                        <p
                                            key={
                                                index
                                            }
                                        >
                                            {
                                                message
                                            }
                                        </p>
                                    ),
                                )}
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}