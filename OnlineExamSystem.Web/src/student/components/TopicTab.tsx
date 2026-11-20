import React from "react";

import {
    ArrowLeft,
    Atom,
    BookOpen,
    ChevronDown,
    ChevronRight,
    CircleAlert,
    FlaskConical,
    Gamepad2,
    GraduationCap,
    Landmark,
    Medal,
    RefreshCw,
    Search,
    Sigma,
    Sparkles,
} from "lucide-react";

import {
    topicService,
    type TopicDto,
} from "../../services/topicService";

import {
    getSubjects,
} from "../../services/subjectService";

/* =========================================================
   PROPS
========================================================= */

interface TopicTabProps {
    onSelectTopic?: (topic: TopicDto) => void;
    onSelectWordGameTopic?: (topic: TopicDto) => void;
}

/* =========================================================
   TYPES
========================================================= */

interface SubjectOption {
    id: string;
    name: string;
}

interface ChapterGroup {
    key: string;

    subjectId: string;
    subjectName: string;

    chapterName: string;
    chapterOrder: number;

    topics: TopicDto[];
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (
    value?: string | null,
) =>
    (value ?? "")
        .trim()
        .toLowerCase();

/* =========================================================
   ICON MÔN HỌC
========================================================= */

const getSubjectIcon = (
    subjectName: string,
) => {
    const name =
        normalizeText(
            subjectName,
        );

    if (
        name.includes("toán") ||
        name.includes("math")
    ) {
        return Sigma;
    }

    if (
        name.includes("khoa học") ||
        name.includes("hóa") ||
        name.includes("hoá") ||
        name.includes("sinh")
    ) {
        return FlaskConical;
    }

    if (
        name.includes("lịch sử") ||
        name.includes("địa")
    ) {
        return Landmark;
    }

    if (
        name.includes("vật lý") ||
        name.includes("vật lí")
    ) {
        return Atom;
    }

    return GraduationCap;
};

/* =========================================================
   MÀU CARD MÔN
========================================================= */

const getSubjectTheme = (
    index: number,
) => {
    const themes = [
        {
            wrapper:
                "from-orange-50 via-white to-amber-50",

            icon:
                "bg-orange-100 text-orange-600",

            active:
                "border-orange-300",
        },

        {
            wrapper:
                "from-emerald-50 via-white to-teal-50",

            icon:
                "bg-emerald-100 text-emerald-600",

            active:
                "border-emerald-300",
        },

        {
            wrapper:
                "from-sky-50 via-white to-blue-50",

            icon:
                "bg-sky-100 text-sky-600",

            active:
                "border-sky-300",
        },

        {
            wrapper:
                "from-violet-50 via-white to-purple-50",

            icon:
                "bg-violet-100 text-violet-600",

            active:
                "border-violet-300",
        },

        {
            wrapper:
                "from-rose-50 via-white to-pink-50",

            icon:
                "bg-rose-100 text-rose-600",

            active:
                "border-rose-300",
        },

        {
            wrapper:
                "from-cyan-50 via-white to-slate-50",

            icon:
                "bg-cyan-100 text-cyan-600",

            active:
                "border-cyan-300",
        },
    ];

    return themes[
        index %
        themes.length
    ];
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TopicTab({
    onSelectTopic,
    onSelectWordGameTopic,
}: TopicTabProps) {
    /* =====================================================
       DATA
    ===================================================== */

    const [
        topics,
        setTopics,
    ] =
        React.useState<
            TopicDto[]
        >([]);

    const [
        subjects,
        setSubjects,
    ] =
        React.useState<
            SubjectOption[]
        >([]);

    /* =====================================================
       UI STATE
    ===================================================== */

    const [
        loading,
        setLoading,
    ] =
        React.useState(
            true,
        );

    const [
        error,
        setError,
    ] =
        React.useState<
            string | null
        >(null);

    /*
       null
       =
       đang ở trang danh sách môn
    */

    const [
        selectedSubjectId,
        setSelectedSubjectId,
    ] =
        React.useState<
            string | null
        >(null);

    const [
        search,
        setSearch,
    ] =
        React.useState(
            "",
        );

    const [
        expandedChapters,
        setExpandedChapters,
    ] =
        React.useState<
            Record<
                string,
                boolean
            >
        >({});

    /* =====================================================
       LOAD DATA
    ===================================================== */

    const loadData =
        React.useCallback(
            async () => {
                try {
                    setLoading(
                        true,
                    );

                    setError(
                        null,
                    );

                    const [
                        topicData,
                        subjectData,
                    ] =
                        await Promise.all([
                            topicService
                                .getStudentTopics(),

                            getSubjects()
                                .catch(
                                    (
                                        subjectError,
                                    ) => {
                                        console.warn(
                                            "LOAD SUBJECT ERROR:",
                                            subjectError,
                                        );

                                        return [];
                                    },
                                ),
                        ]);

                    /* =====================================
                       ACTIVE TOPICS
                    ===================================== */

                    const activeTopics =
                        topicData.filter(
                            (
                                topic,
                            ) =>
                                topic.isActive,
                        );

                    setTopics(
                        activeTopics,
                    );

                    /* =====================================
                       SUBJECT API
                    ===================================== */

                    const apiSubjects:
                        SubjectOption[] =
                        (
                            subjectData as any[]
                        )
                            .map(
                                (
                                    item,
                                ) => ({
                                    id: String(
                                        item.id ??
                                        "",
                                    ),

                                    name: String(
                                        item.tenMH ??
                                        item.name ??
                                        "",
                                    ).trim(),
                                }),
                            )
                            .filter(
                                (
                                    item,
                                ) =>
                                    item.id &&
                                    item.name,
                            );

                    /* =====================================
                       MERGE SUBJECT FROM TOPICS
                    ===================================== */

                    const subjectMap =
                        new Map<
                            string,
                            string
                        >();

                    apiSubjects.forEach(
                        (
                            subject,
                        ) => {
                            subjectMap.set(
                                subject.id,
                                subject.name,
                            );
                        },
                    );

                    activeTopics.forEach(
                        (
                            topic,
                        ) => {
                            if (
                                !subjectMap.has(
                                    topic.subjectId,
                                )
                            ) {
                                subjectMap.set(
                                    topic.subjectId,
                                    topic.subjectName,
                                );
                            }
                        },
                    );

                    const mergedSubjects =
                        Array.from(
                            subjectMap.entries(),
                        )
                            .map(
                                ([
                                    id,
                                    name,
                                ]) => ({
                                    id,
                                    name,
                                }),
                            )
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    a.name.localeCompare(
                                        b.name,
                                        "vi",
                                    ),
                            );

                    setSubjects(
                        mergedSubjects,
                    );
                } catch (
                err
                ) {
                    console.error(
                        "LOAD STUDENT TOPICS ERROR:",
                        err,
                    );

                    setError(
                        err instanceof
                            Error
                            ? err.message
                            : "Không thể tải danh sách chủ đề.",
                    );
                } finally {
                    setLoading(
                        false,
                    );
                }
            },
            [],
        );

    React.useEffect(
        () => {
            void loadData();
        },
        [loadData],
    );

    /* =====================================================
       CURRENT SUBJECT
    ===================================================== */

    const selectedSubject =
        React.useMemo(
            () =>
                subjects.find(
                    (
                        subject,
                    ) =>
                        subject.id ===
                        selectedSubjectId,
                ) ??
                null,
            [
                subjects,
                selectedSubjectId,
            ],
        );

    /* =====================================================
       TOPICS OF CURRENT SUBJECT
    ===================================================== */

    const selectedSubjectTopics =
        React.useMemo(
            () => {
                if (
                    !selectedSubjectId
                ) {
                    return [];
                }

                return topics.filter(
                    (
                        topic,
                    ) =>
                        topic.subjectId ===
                        selectedSubjectId,
                );
            },
            [
                topics,
                selectedSubjectId,
            ],
        );

    /* =====================================================
       SEARCH
    ===================================================== */

    const filteredTopics =
        React.useMemo(
            () => {
                const keyword =
                    normalizeText(
                        search,
                    );

                if (
                    !keyword
                ) {
                    return selectedSubjectTopics;
                }

                return selectedSubjectTopics.filter(
                    (
                        topic,
                    ) =>
                        normalizeText(
                            topic.name,
                        ).includes(
                            keyword,
                        ) ||
                        normalizeText(
                            topic.description,
                        ).includes(
                            keyword,
                        ) ||
                        normalizeText(
                            topic.chapterName,
                        ).includes(
                            keyword,
                        ),
                );
            },
            [
                selectedSubjectTopics,
                search,
            ],
        );

    /* =====================================================
       GROUP BY CHAPTER
    ===================================================== */

    const groupedTopics =
        React.useMemo<
            ChapterGroup[]
        >(() => {
            const map =
                new Map<
                    string,
                    ChapterGroup
                >();

            filteredTopics.forEach(
                (
                    topic,
                ) => {
                    const chapterName =
                        topic.chapterName?.trim() ||
                        "Chưa phân chương";

                    const key =
                        `${topic.subjectId}-${topic.chapterOrder}-${chapterName}`;

                    if (
                        !map.has(
                            key,
                        )
                    ) {
                        map.set(
                            key,
                            {
                                key,

                                subjectId:
                                    topic.subjectId,

                                subjectName:
                                    topic.subjectName,

                                chapterName,

                                chapterOrder:
                                    topic.chapterOrder,

                                topics: [],
                            },
                        );
                    }

                    map.get(
                        key,
                    )!.topics.push(
                        topic,
                    );
                },
            );

            return Array.from(
                map.values(),
            )
                .sort(
                    (
                        a,
                        b,
                    ) =>
                        a.chapterOrder -
                        b.chapterOrder,
                )
                .map(
                    (
                        group,
                    ) => ({
                        ...group,

                        topics: [
                            ...group.topics,
                        ].sort(
                            (
                                a,
                                b,
                            ) =>
                                a.orderNum -
                                b.orderNum,
                        ),
                    }),
                );
        }, [filteredTopics]);

    /* =====================================================
       AUTO OPEN CHAPTER
    ===================================================== */

    React.useEffect(
        () => {
            if (
                groupedTopics.length ===
                0
            ) {
                return;
            }

            setExpandedChapters(
                (
                    current,
                ) => {
                    const next = {
                        ...current,
                    };

                    groupedTopics.forEach(
                        (
                            group,
                        ) => {
                            if (
                                next[
                                group.key
                                ] ===
                                undefined
                            ) {
                                next[
                                    group.key
                                ] =
                                    true;
                            }
                        },
                    );

                    return next;
                },
            );
        },
        [groupedTopics],
    );

    /* =====================================================
       ACTION
    ===================================================== */

    const openSubject = (
        subjectId: string,
    ) => {
        setSelectedSubjectId(
            subjectId,
        );

        setSearch("");

        setExpandedChapters(
            {},
        );
    };

    const goBackToSubjects =
        () => {
            setSelectedSubjectId(
                null,
            );

            setSearch("");

            setExpandedChapters(
                {},
            );
        };

    const toggleChapter = (
        chapterKey: string,
    ) => {
        setExpandedChapters(
            (
                current,
            ) => ({
                ...current,

                [chapterKey]:
                    !current[
                    chapterKey
                    ],
            }),
        );
    };

    const handleSelectTopic = (
        topic: TopicDto,
    ) => {
        if (
            onSelectTopic
        ) {
            onSelectTopic(
                topic,
            );

            return;
        }

        console.log(
            "SELECT TOPIC:",
            topic,
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="h-full overflow-y-auto bg-[#fafafa] px-4 pb-12">
                <div className="mx-auto max-w-[1450px] animate-pulse">
                    <div className="mb-6 h-8 w-56 rounded-xl bg-slate-200" />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from(
                            {
                                length: 8,
                            },
                        ).map(
                            (
                                _,
                                index,
                            ) => (
                                <div
                                    key={
                                        index
                                    }
                                    className="h-[240px] rounded-[24px] bg-slate-100"
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {
        return (
            <div className="h-full overflow-y-auto bg-[#fafafa] px-4 pb-12">
                <div className="mx-auto mt-10 max-w-xl rounded-[24px] border border-red-100 bg-red-50 p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                            <CircleAlert className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-extrabold text-red-800">
                                Không thể tải dữ liệu
                            </h3>

                            <p className="mt-1 text-sm text-red-600">
                                {
                                    error
                                }
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    void loadData()
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                            >
                                <RefreshCw className="h-4 w-4" />

                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       PAGE 1
       SUBJECT LIST
    ===================================================== */

    if (
        !selectedSubjectId
    ) {
        return (
            <div
                className="
                    h-full
                    min-h-0
                    overflow-y-auto
                    bg-[#fafafa]
                    px-4
                    pb-14
                    md:px-6
                "
            >
                <div className="mx-auto max-w-[1450px]">

                    {/* HEADER */}

                    <div className="mb-7 pt-2">
                        <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                            Luyện tập
                        </h1>

                        <p className="mt-2 text-sm font-medium text-slate-500">
                            Chọn môn học để xem các chương và bài luyện tập.
                        </p>
                    </div>

                    {/* SUBJECT GRID */}

                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-6
                            sm:grid-cols-2
                            lg:grid-cols-3
                            xl:grid-cols-4
                        "
                    >
                        {subjects.map(
                            (
                                subject,
                                index,
                            ) => {
                                const Icon =
                                    getSubjectIcon(
                                        subject.name,
                                    );

                                const theme =
                                    getSubjectTheme(
                                        index,
                                    );

                                const subjectTopicsCount =
                                    topics.filter(
                                        (
                                            topic,
                                        ) =>
                                            topic.subjectId ===
                                            subject.id,
                                    ).length;

                                return (
                                    <button
                                        key={
                                            subject.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            openSubject(
                                                subject.id,
                                            )
                                        }
                                        className="
                                            group
                                            overflow-hidden
                                            rounded-[26px]
                                            border
                                            border-slate-100
                                            bg-white
                                            text-left
                                            shadow-[0_6px_24px_rgba(15,23,42,0.06)]
                                            transition
                                            duration-200
                                            hover:-translate-y-1
                                            hover:shadow-[0_14px_35px_rgba(15,23,42,0.10)]
                                        "
                                    >
                                        {/* IMAGE-LIKE AREA */}

                                        <div
                                            className={`
                                                relative
                                                flex
                                                h-[160px]
                                                items-center
                                                justify-center
                                                overflow-hidden
                                                bg-gradient-to-br
                                                ${theme.wrapper}
                                            `}
                                        >
                                            <div className="absolute -left-9 -top-9 h-28 w-28 rounded-full bg-white/70" />

                                            <div className="absolute -bottom-14 -right-10 h-40 w-40 rounded-full bg-white/60" />

                                            <div
                                                className={`
                                                    relative
                                                    flex
                                                    h-24
                                                    w-24
                                                    items-center
                                                    justify-center
                                                    rounded-[30px]
                                                    ${theme.icon}
                                                    shadow-sm
                                                    transition
                                                    duration-300
                                                    group-hover:scale-110
                                                    group-hover:rotate-3
                                                `}
                                            >
                                                <Icon className="h-12 w-12" />
                                            </div>
                                        </div>

                                        {/* CONTENT */}

                                        <div className="p-5">
                                            <h2 className="text-xl font-black text-[#202026]">
                                                {
                                                    subject.name
                                                }
                                            </h2>

                                            <p className="mt-3 min-h-[44px] text-sm leading-6 text-slate-500">
                                                {
                                                    subjectTopicsCount
                                                }{" "}
                                                bài luyện tập theo chương
                                            </p>

                                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                                <span className="text-sm font-bold text-orange-500">
                                                    Xem bài tập
                                                </span>

                                                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {/* NO SUBJECT */}

                    {subjects.length ===
                        0 && (
                            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white py-14 text-center">
                                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                                <p className="mt-4 font-bold text-slate-600">
                                    Chưa có môn học.
                                </p>
                            </div>
                        )}
                </div>
            </div>
        );
    }

    /* =====================================================
       PAGE 2
       SUBJECT DETAIL
    ===================================================== */

    return (
        <div
            className="
                h-full
                min-h-0
                overflow-y-auto
                bg-[#fafafa]
                px-4
                pb-14
                md:px-6
            "
        >
            <div className="mx-auto max-w-[1100px]">

                {/* =================================================
                    BACK
                ================================================= */}

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={
                            goBackToSubjects
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-2
                            py-2
                            text-sm
                            font-bold
                            text-slate-600
                            transition
                            hover:bg-white
                            hover:text-orange-600
                        "
                    >
                        <ArrowLeft className="h-5 w-5" />

                        Quay lại môn học
                    </button>
                </div>

                {/* =================================================
                    SUBJECT HEADER
                ================================================= */}

                <div
                    className="
                        mb-6
                        mt-4
                        rounded-[26px]
                        border
                        border-orange-100
                        bg-gradient-to-br
                        from-orange-50
                        via-white
                        to-amber-50
                        px-6
                        py-6
                        md:px-8
                    "
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                            {selectedSubject &&
                                React.createElement(
                                    getSubjectIcon(
                                        selectedSubject.name,
                                    ),
                                    {
                                        className:
                                            "h-7 w-7",
                                    },
                                )}
                        </div>

                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-orange-500">
                                Môn học
                            </p>

                            <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
                                {
                                    selectedSubject?.name
                                }
                            </h1>

                            <p className="mt-2 text-sm font-medium text-slate-500">
                                Chọn bài tập bạn muốn luyện.
                            </p>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={
                                search
                            }
                            onChange={(
                                event,
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Tìm bài luyện tập..."
                            className="
                                h-12
                                w-full
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                pl-12
                                pr-4
                                text-sm
                                font-medium
                                text-slate-800
                                shadow-sm
                                outline-none
                                transition
                                focus:border-orange-300
                                focus:ring-4
                                focus:ring-orange-100
                            "
                        />
                    </div>
                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}

                {groupedTopics.length ===
                    0 && (
                        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                            <BookOpen className="mx-auto h-11 w-11 text-slate-300" />

                            <h3 className="mt-4 text-lg font-extrabold text-slate-800">
                                Không có bài luyện tập
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Môn học này chưa có Topic phù hợp.
                            </p>
                        </div>
                    )}

                {/* =================================================
                    CHAPTERS
                ================================================= */}

                <div className="space-y-7">
                    {groupedTopics.map(
                        (
                            group,
                        ) => {
                            const expanded =
                                expandedChapters[
                                group
                                    .key
                                ] ??
                                true;

                            return (
                                <section
                                    key={
                                        group.key
                                    }
                                    className="
                                        overflow-hidden
                                        rounded-[24px]
                                        border
                                        border-slate-200
                                        bg-white
                                        shadow-sm
                                    "
                                >
                                    {/* CHAPTER HEADER */}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleChapter(
                                                group.key,
                                            )
                                        }
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-4
                                            border-b
                                            border-slate-200
                                            bg-[#fff8f1]
                                            px-5
                                            py-4
                                            text-left
                                            transition
                                            hover:bg-[#fff3e5]
                                            md:px-7
                                        "
                                    >
                                        {expanded ? (
                                            <ChevronDown className="h-6 w-6 shrink-0 text-slate-800" />
                                        ) : (
                                            <ChevronRight className="h-6 w-6 shrink-0 text-slate-800" />
                                        )}

                                        <div>
                                            <h2 className="text-xl font-black text-[#25252b] md:text-2xl">
                                                {
                                                    group.chapterName
                                                }
                                            </h2>

                                            <p className="mt-1 text-sm font-medium text-slate-600">
                                                {
                                                    group
                                                        .topics
                                                        .length
                                                }{" "}
                                                bài tập
                                            </p>
                                        </div>
                                    </button>

                                    {/* TOPICS */}

                                    {expanded && (
                                        <div>
                                            {group.topics.map(
                                                (
                                                    topic,
                                                    index,
                                                ) => {
                                                    const number =
                                                        String(
                                                            topic.orderNum ||
                                                            index +
                                                            1,
                                                        ).padStart(
                                                            2,
                                                            "0",
                                                        );

                                                    const isLast =
                                                        index ===
                                                        group
                                                            .topics
                                                            .length -
                                                        1;

                                                    return (
                                                        <button
                                                            key={
                                                                topic.id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectTopic(
                                                                    topic,
                                                                )
                                                            }
                                                            className="
                                                                group
                                                                flex
                                                                w-full
                                                                items-stretch
                                                                text-left
                                                                transition
                                                                hover:bg-orange-50/40
                                                            "
                                                        >
                                                            {/* TIMELINE */}

                                                            <div className="relative flex w-[88px] shrink-0 justify-center md:w-[110px]">
                                                                <div
                                                                    className={`
                                                                        absolute
                                                                        left-1/2
                                                                        top-0
                                                                        w-[2px]
                                                                        -translate-x-1/2
                                                                        bg-orange-500
                                                                        ${isLast
                                                                            ? "bottom-1/2"
                                                                            : "bottom-0"
                                                                        }
                                                                    `}
                                                                />

                                                                <div
                                                                    className="
                                                                        relative
                                                                        z-10
                                                                        my-auto
                                                                        flex
                                                                        h-10
                                                                        w-10
                                                                        items-center
                                                                        justify-center
                                                                        rounded-full
                                                                        bg-[#ff7200]
                                                                        text-sm
                                                                        font-black
                                                                        text-white
                                                                        shadow-sm
                                                                    "
                                                                >
                                                                    {
                                                                        number
                                                                    }
                                                                </div>
                                                            </div>

                                                            {/* CONTENT */}

                                                            <div
                                                                className={`
                                                                    flex
                                                                    min-w-0
                                                                    flex-1
                                                                    items-center
                                                                    gap-4
                                                                    py-4
                                                                    pr-5
                                                                    md:pr-7
                                                                    ${!isLast
                                                                        ? "border-b border-slate-200"
                                                                        : ""
                                                                    }
                                                                `}
                                                            >
                                                                <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:flex">
                                                                    <BookOpen className="h-4 w-4" />
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <h3 className="truncate text-base font-extrabold text-slate-900 transition group-hover:text-orange-600 md:text-lg">
                                                                        {
                                                                            topic.name
                                                                        }
                                                                    </h3>

                                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                        <span className="text-sm font-medium text-slate-600">
                                                                            {
                                                                                topic.questionCount
                                                                            }{" "}
                                                                            câu hỏi luyện tập
                                                                        </span>

                                                                        {onSelectWordGameTopic && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onSelectWordGameTopic(topic);
                                                                                }}
                                                                                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-xs font-black text-slate-950 shadow-sm transition hover:scale-105 hover:from-amber-400 hover:to-yellow-400 active:scale-95"
                                                                                title="Chơi Game Nối Chữ (AlphaBetty Saga) ôn tập câu hỏi tự luận chủ đề này"
                                                                            >
                                                                                <Gamepad2 className="h-3.5 w-3.5 text-slate-950" />
                                                                                Game Nối Chữ
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300 transition group-hover:bg-orange-50 group-hover:text-orange-400 sm:flex">
                                                                    <Medal className="h-7 w-7" />
                                                                </div>

                                                                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                                                            </div>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </section>
                            );
                        },
                    )}
                </div>

                <div className="h-8" />
            </div>
        </div>
    );
}