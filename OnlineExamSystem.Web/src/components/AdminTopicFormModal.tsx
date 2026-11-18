import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    BookOpen,
    CheckCircle2,
    Layers3,
    X,
} from "lucide-react";

import {
    chapterService,
    type ChapterDto,
} from "../services/chapterService";

import type {
    TopicDto,
    CreateTopicRequest,
    UpdateTopicRequest,
} from "../services/topicService";


type Option = {
    id: string;
    name: string;
};


interface Props {
    open: boolean;

    topic?: TopicDto | null;

    subjects: Option[];

    grades: Option[];

    loading?: boolean;

    onClose: () => void;

    onSubmit: (
        data:
            CreateTopicRequest |
            UpdateTopicRequest
    ) => Promise<void>;

    /*
     * Dùng khi mở modal từ màn:
     * Khối -> Môn -> Chương -> + Thêm Topic
     */
    presetSubjectId?: string;

    presetGradeId?: string;

    presetChapterId?: string;

    /*
     * true:
     * - Khối/Môn được lấy từ màn cha.
     * - Admin không cần chọn lại.
     */
    lockContext?: boolean;
}


export default function AdminTopicFormModal({
    open,
    topic,
    subjects,
    grades,
    loading = false,
    onClose,
    onSubmit,
    presetSubjectId = "",
    presetGradeId = "",
    presetChapterId = "",
    lockContext = false,
}: Props) {

    const [name, setName] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [subjectId, setSubjectId] =
        useState("");

    const [gradeId, setGradeId] =
        useState("");

    const [chapterId, setChapterId] =
        useState("");

    const [chapters, setChapters] =
        useState<ChapterDto[]>([]);

    const [orderNum, setOrderNum] =
        useState(1);

    const [isActive, setIsActive] =
        useState(true);

    const [error, setError] =
        useState("");

    const [loadingChapters, setLoadingChapters] =
        useState(false);


    /* =====================================================
       SELECTED INFO
    ===================================================== */

    const selectedSubject =
        useMemo(
            () =>
                subjects.find(
                    item =>
                        item.id === subjectId
                ) ?? null,
            [
                subjects,
                subjectId,
            ],
        );


    const selectedGrade =
        useMemo(
            () =>
                grades.find(
                    item =>
                        item.id === gradeId
                ) ?? null,
            [
                grades,
                gradeId,
            ],
        );


    const selectedChapter =
        useMemo(
            () =>
                chapters.find(
                    item =>
                        item.id === chapterId
                ) ?? null,
            [
                chapters,
                chapterId,
            ],
        );


    /* =====================================================
       INIT FORM
    ===================================================== */

    useEffect(() => {

        if (!open) {
            return;
        }


        setName(
            topic?.name ?? ""
        );

        setDescription(
            topic?.description ?? ""
        );


        /*
         * EDIT:
         * lấy đúng dữ liệu Topic hiện tại.
         *
         * CREATE:
         * ưu tiên context từ màn cha.
         */
        setSubjectId(
            topic?.subjectId ??
            presetSubjectId ??
            ""
        );

        setGradeId(
            topic?.gradeId ??
            presetGradeId ??
            ""
        );

        setChapterId(
            topic?.chapterId ??
            presetChapterId ??
            ""
        );

        setOrderNum(
            topic?.orderNum ?? 1
        );

        setIsActive(
            topic?.isActive ?? true
        );

        setError("");

    }, [
        open,
        topic,
        presetSubjectId,
        presetGradeId,
        presetChapterId,
    ]);


    /* =====================================================
       LOAD CHAPTERS
    ===================================================== */

    useEffect(() => {

        if (
            !open ||
            !subjectId ||
            !gradeId
        ) {

            setChapters([]);

            return;
        }


        let active = true;


        const loadChapters =
            async () => {

                try {

                    setLoadingChapters(
                        true
                    );

                    setError("");


                    const rows =
                        await chapterService.get(
                            subjectId,
                            gradeId,
                        );


                    if (!active) {
                        return;
                    }


                    const sorted =
                        [...rows].sort(
                            (
                                left,
                                right,
                            ) =>
                                left.order -
                                    right.order ||
                                left.name.localeCompare(
                                    right.name,
                                    "vi"
                                )
                        );


                    setChapters(
                        sorted
                    );


                    /*
                     * Khi bấm "+ Thêm Topic"
                     * trong một Chương cụ thể:
                     * tự chọn Chương đó.
                     */
                    if (
                        presetChapterId &&
                        sorted.some(
                            chapter =>
                                chapter.id ===
                                presetChapterId
                        )
                    ) {

                        setChapterId(
                            presetChapterId
                        );

                    } else if (
                        topic?.chapterId &&
                        sorted.some(
                            chapter =>
                                chapter.id ===
                                topic.chapterId
                        )
                    ) {

                        setChapterId(
                            topic.chapterId
                        );
                    }


                } catch (err) {

                    if (!active) {
                        return;
                    }


                    setChapters([]);

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không thể tải danh sách Chương."
                    );

                } finally {

                    if (active) {

                        setLoadingChapters(
                            false
                        );
                    }
                }
            };


        void loadChapters();


        return () => {

            active = false;
        };

    }, [
        open,
        subjectId,
        gradeId,
        presetChapterId,
        topic?.chapterId,
    ]);


    if (!open) {
        return null;
    }


    /* =====================================================
       SUBMIT
    ===================================================== */

    const submit =
        async (
            event: FormEvent
        ) => {

            event.preventDefault();

            setError("");


            if (!name.trim()) {

                setError(
                    "Vui lòng nhập tên Topic."
                );

                return;
            }


            if (
                !subjectId ||
                !gradeId
            ) {

                setError(
                    "Vui lòng chọn Khối và Môn học."
                );

                return;
            }


            if (!chapterId) {

                setError(
                    "Vui lòng chọn Chương."
                );

                return;
            }


            if (
                !Number.isInteger(
                    orderNum
                ) ||
                orderNum < 1
            ) {

                setError(
                    "Thứ tự Topic phải là số nguyên lớn hơn 0."
                );

                return;
            }


            if (
                !chapters.some(
                    chapter =>
                        chapter.id ===
                        chapterId
                )
            ) {

                setError(
                    "Chương không thuộc Khối và Môn học đang chọn."
                );

                return;
            }


            try {

                await onSubmit({
                    name:
                        name.trim(),

                    description:
                        description
                            .trim() ||
                        null,

                    subjectId,

                    gradeId,

                    chapterId,

                    orderNum,

                    isActive,
                });


                onClose();

            } catch (err) {

                setError(
                    err instanceof Error
                        ? err.message
                        : "Không thể lưu Topic."
                );
            }
        };


    const fieldClass =
        `
        w-full
        rounded-xl
        border
        border-slate-200
        bg-white
        px-4
        py-3
        text-sm
        outline-none
        transition
        focus:border-indigo-500
        focus:ring-4
        focus:ring-indigo-500/10
        disabled:cursor-not-allowed
        disabled:bg-slate-100
        disabled:text-slate-500
        `;


    const contextLocked =
        lockContext &&
        !topic;


    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-slate-950/50
                p-4
            "
        >

            <form
                onSubmit={
                    submit
                }
                className="
                    max-h-[92vh]
                    w-full
                    max-w-2xl
                    overflow-y-auto
                    rounded-3xl
                    bg-white
                    shadow-2xl
                "
            >

                {/* HEADER */}

                <div
                    className="
                        sticky
                        top-0
                        z-10
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-200
                        bg-white
                        px-6
                        py-5
                    "
                >

                    <div>

                        <h2
                            className="
                                text-xl
                                font-black
                                text-slate-900
                            "
                        >
                            {topic
                                ? "Chỉnh sửa Topic"
                                : "Thêm Topic"}
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Topic phải thuộc đúng
                            một Chương.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            loading
                        }
                        className="
                            rounded-xl
                            p-2
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            disabled:opacity-50
                        "
                    >
                        <X size={20} />
                    </button>

                </div>


                <div
                    className="
                        space-y-6
                        p-6
                    "
                >

                    {/* CONTEXT */}

                    <section
                        className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-slate-50/70
                            p-4
                        "
                    >

                        <div
                            className="
                                mb-4
                                flex
                                items-center
                                gap-2
                            "
                        >
                            <Layers3
                                size={17}
                                className="
                                    text-indigo-600
                                "
                            />

                            <h3
                                className="
                                    text-sm
                                    font-black
                                    text-slate-800
                                "
                            >
                                Phân loại Topic
                            </h3>

                        </div>


                        {contextLocked ? (

                            <>
                                {/* Khi mở từ trang đã chọn Khối + Môn */}

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        gap-3
                                        sm:grid-cols-2
                                    "
                                >

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-4
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-xs
                                                font-bold
                                                uppercase
                                                text-slate-400
                                            "
                                        >
                                            Khối
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-sm
                                                font-black
                                                text-slate-800
                                            "
                                        >
                                            {selectedGrade
                                                ?.name ??
                                                "—"}
                                        </p>
                                    </div>


                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-4
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-xs
                                                font-bold
                                                uppercase
                                                text-slate-400
                                            "
                                        >
                                            Môn học
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-sm
                                                font-black
                                                text-slate-800
                                            "
                                        >
                                            {selectedSubject
                                                ?.name ??
                                                "—"}
                                        </p>
                                    </div>

                                </div>
                            </>

                        ) : (

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    gap-4
                                    sm:grid-cols-2
                                "
                            >

                                {/* GRADE */}

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-bold
                                        text-slate-700
                                    "
                                >
                                    Khối

                                    <select
                                        className={
                                            `${fieldClass} mt-2`
                                        }
                                        value={
                                            gradeId
                                        }
                                        onChange={event => {

                                            setGradeId(
                                                event.target.value
                                            );

                                            setChapterId(
                                                ""
                                            );
                                        }}
                                        required
                                    >
                                        <option value="">
                                            Chọn Khối
                                        </option>

                                        {grades.map(
                                            item => (

                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {item.name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>


                                {/* SUBJECT */}

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-bold
                                        text-slate-700
                                    "
                                >
                                    Môn học

                                    <select
                                        className={
                                            `${fieldClass} mt-2`
                                        }
                                        value={
                                            subjectId
                                        }
                                        onChange={event => {

                                            setSubjectId(
                                                event.target.value
                                            );

                                            setChapterId(
                                                ""
                                            );
                                        }}
                                        required
                                    >
                                        <option value="">
                                            Chọn Môn học
                                        </option>

                                        {subjects.map(
                                            item => (

                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {item.name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>

                            </div>
                        )}


                        {/* CHAPTER */}

                        <label
                            className="
                                mt-4
                                block
                                text-sm
                                font-bold
                                text-slate-700
                            "
                        >
                            Chương
                            <span
                                className="
                                    ml-1
                                    text-red-500
                                "
                            >
                                *
                            </span>

                            <select
                                className={
                                    `${fieldClass} mt-2`
                                }
                                value={
                                    chapterId
                                }
                                onChange={event =>
                                    setChapterId(
                                        event.target.value
                                    )
                                }
                                required
                                disabled={
                                    !subjectId ||
                                    !gradeId ||
                                    loadingChapters ||
                                    Boolean(
                                        presetChapterId &&
                                        !topic
                                    )
                                }
                            >

                                <option value="">
                                    {loadingChapters
                                        ? "Đang tải Chương..."
                                        : chapters.length === 0
                                            ? "Chưa có Chương"
                                            : "Chọn Chương"}
                                </option>


                                {chapters.map(
                                    chapter => (

                                        <option
                                            key={
                                                chapter.id
                                            }
                                            value={
                                                chapter.id
                                            }
                                        >
                                            Chương {chapter.order}: {chapter.name}
                                        </option>
                                    )
                                )}

                            </select>

                        </label>


                        {selectedChapter && (

                            <div
                                className="
                                    mt-3
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    border
                                    border-amber-100
                                    bg-amber-50
                                    px-4
                                    py-3
                                "
                            >

                                <BookOpen
                                    size={18}
                                    className="
                                        shrink-0
                                        text-amber-600
                                    "
                                />

                                <div>

                                    <p
                                        className="
                                            text-xs
                                            font-bold
                                            uppercase
                                            text-amber-600
                                        "
                                    >
                                        Topic sẽ thuộc
                                    </p>

                                    <p
                                        className="
                                            mt-0.5
                                            text-sm
                                            font-black
                                            text-slate-800
                                        "
                                    >
                                        Chương {selectedChapter.order}
                                        {" · "}
                                        {selectedChapter.name}
                                    </p>

                                </div>

                            </div>
                        )}


                        {
                            subjectId &&
                            gradeId &&
                            !loadingChapters &&
                            chapters.length === 0
                            &&
                            (

                                <p
                                    className="
                                        mt-3
                                        text-sm
                                        font-medium
                                        text-amber-700
                                    "
                                >
                                    Chưa có Chương cho
                                    Khối và Môn học này.
                                    Hãy tạo Chương trước.
                                </p>
                            )
                        }

                    </section>


                    {/* TOPIC INFO */}

                    <section>

                        <h3
                            className="
                                mb-4
                                text-sm
                                font-black
                                text-slate-800
                            "
                        >
                            Thông tin Topic
                        </h3>


                        <div
                            className="
                                space-y-4
                            "
                        >

                            <label
                                className="
                                    block
                                    text-sm
                                    font-bold
                                    text-slate-700
                                "
                            >
                                Tên Topic
                                <span
                                    className="
                                        ml-1
                                        text-red-500
                                    "
                                >
                                    *
                                </span>

                                <input
                                    className={
                                        `${fieldClass} mt-2`
                                    }
                                    value={
                                        name
                                    }
                                    maxLength={
                                        200
                                    }
                                    onChange={event =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ví dụ: Tính đơn điệu"
                                    required
                                />
                            </label>


                            <label
                                className="
                                    block
                                    text-sm
                                    font-bold
                                    text-slate-700
                                "
                            >
                                Mô tả

                                <textarea
                                    className={
                                        `${fieldClass} mt-2 resize-none`
                                    }
                                    value={
                                        description
                                    }
                                    maxLength={
                                        1000
                                    }
                                    rows={
                                        3
                                    }
                                    onChange={event =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Mô tả ngắn về nội dung Topic..."
                                />

                                <span
                                    className="
                                        mt-1
                                        block
                                        text-right
                                        text-xs
                                        text-slate-400
                                    "
                                >
                                    {description.length}/1000
                                </span>
                            </label>


                            <label
                                className="
                                    block
                                    text-sm
                                    font-bold
                                    text-slate-700
                                "
                            >
                                Thứ tự Topic trong Chương

                                <input
                                    className={
                                        `${fieldClass} mt-2`
                                    }
                                    type="number"
                                    min={
                                        1
                                    }
                                    value={
                                        orderNum
                                    }
                                    onChange={event =>
                                        setOrderNum(
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                />
                            </label>


                            <button
                                type="button"
                                onClick={() =>
                                    setIsActive(
                                        value =>
                                            !value
                                    )
                                }
                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-between
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-4
                                    py-3
                                    text-left
                                "
                            >

                                <div>

                                    <p
                                        className="
                                            text-sm
                                            font-bold
                                            text-slate-700
                                        "
                                    >
                                        Đang sử dụng
                                    </p>

                                    <p
                                        className="
                                            mt-0.5
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        Topic được hiển thị
                                        cho người dùng khi bật.
                                    </p>

                                </div>


                                <span
                                    className={`
                                        relative
                                        h-6
                                        w-11
                                        rounded-full
                                        transition
                                        ${
                                            isActive
                                                ? "bg-indigo-600"
                                                : "bg-slate-300"
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            absolute
                                            top-1
                                            h-4
                                            w-4
                                            rounded-full
                                            bg-white
                                            shadow
                                            transition
                                            ${
                                                isActive
                                                    ? "left-6"
                                                    : "left-1"
                                            }
                                        `}
                                    />
                                </span>

                            </button>

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (

                        <div
                            className="
                                rounded-xl
                                border
                                border-red-200
                                bg-red-50
                                px-4
                                py-3
                                text-sm
                                font-medium
                                text-red-600
                            "
                        >
                            {error}
                        </div>
                    )}


                    {/* FOOTER */}

                    <div
                        className="
                            flex
                            items-center
                            justify-end
                            gap-3
                            border-t
                            border-slate-100
                            pt-5
                        "
                    >

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                loading
                            }
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-5
                                py-2.5
                                text-sm
                                font-bold
                                text-slate-700
                                transition
                                hover:bg-slate-50
                                disabled:opacity-50
                            "
                        >
                            Hủy
                        </button>


                        <button
                            type="submit"
                            disabled={
                                loading ||
                                loadingChapters ||
                                !chapterId ||
                                chapters.length === 0
                            }
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-indigo-600
                                px-5
                                py-2.5
                                text-sm
                                font-bold
                                text-white
                                shadow-sm
                                transition
                                hover:bg-indigo-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            <CheckCircle2
                                size={17}
                            />

                            {loading
                                ? "Đang lưu..."
                                : topic
                                    ? "Lưu thay đổi"
                                    : "Thêm Topic"}
                        </button>

                    </div>

                </div>

            </form>

        </div>
    );
}
