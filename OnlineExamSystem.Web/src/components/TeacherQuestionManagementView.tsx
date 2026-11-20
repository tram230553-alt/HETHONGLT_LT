import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Eye,
    RefreshCw,
    X,
    Check,
    Filter,
    BookOpen,
    AlertCircle,
    Save,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import {
    Question,
    Topic,
    Teacher,
    QuestionDifficulty,
    QuestionType,
} from "../types";

import {
    questionService,
    QuestionDto,
    CreateQuestionRequest,
    UpdateQuestionRequest,
    QuestionUsageDto,
} from "../services/questionService";
import DeleteQuestionDialog from "./DeleteQuestionDialog";
import {
    topicService,
    TopicDto
} from "../services/topicService";
import Pagination from './Pagination';
import { usePagination } from '../hooks/usePagination';

/* =========================================================
   PROPS
========================================================= */

interface TeacherQuestionManagementViewProps {

    questions: Question[];

    topics: Topic[];

    currentTeacher: Teacher;

    onUpdateQuestions:
    React.Dispatch<
        React.SetStateAction<Question[]>
    >;

    showToast?: (
        message: string,
        type?: "success" | "info" | "error"
    ) => void;
}


/* =========================================================
   COMPONENT
========================================================= */

export default function TeacherQuestionManagementView({

    questions,

    topics,

    currentTeacher,

    onUpdateQuestions,

    showToast,

}: TeacherQuestionManagementViewProps) {


    /* =====================================================
       STATE
    ===================================================== */

    const [search, setSearch] =
        useState("");

    const [topicFilter, setTopicFilter] =
        useState("all");

    const [difficultyFilter, setDifficultyFilter] =
        useState("all");




    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [modalMode, setModalMode] =
        useState<"add" | "edit">("add");


    const [editingQuestionId, setEditingQuestionId] =
        useState<string | null>(null);


    const [isSaving, setIsSaving] =
        useState(false);

    const [isLoading, setIsLoading] =
        useState(false);

    const [teacherTopics, setTeacherTopics] =
        useState<TopicDto[]>([]);

    const [isLoadingTopics, setIsLoadingTopics] =
        useState(false);
    /* =====================================================
       FORM
    ===================================================== */

    const [editorText, setEditorText] =
        useState("");

    const [editorType, setEditorType] =
        useState<QuestionType>("single_choice");

    const [editorDifficulty, setEditorDifficulty] =
        useState<QuestionDifficulty>("medium");

    const [editorTopicId, setEditorTopicId] =
        useState("");

    const [editorOptions, setEditorOptions] =
        useState<string[]>([
            "",
            "",
            "",
            "",
        ]);

    const [editorCorrectAnswer, setEditorCorrectAnswer] =
        useState("A");

    const [editorExplanation, setEditorExplanation] =
        useState("");


    /* =====================================================
       DELETE CONFIRM
    ===================================================== */

    const [deleteId, setDeleteId] =
        useState<string | null>(null);

    // Kết quả kiểm tra câu hỏi đang được dùng ở đề thi nào.
    const [deleteUsage, setDeleteUsage] =
        useState<QuestionUsageDto | null>(null);

    const [deleteCheckError, setDeleteCheckError] =
        useState<string | null>(null);

    // Mỗi khi mở hộp thoại xóa → kiểm tra mức độ sử dụng của câu hỏi.
    useEffect(() => {

        setDeleteUsage(null);
        setDeleteCheckError(null);

        if (!deleteId) {
            return;
        }

        let cancelled = false;

        questionService
            .getQuestionUsage(deleteId)
            .then(result => {
                if (!cancelled) {
                    setDeleteUsage(result);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    setDeleteCheckError(
                        error instanceof Error
                            ? error.message
                            : "Không thể kiểm tra mức độ sử dụng của câu hỏi."
                    );
                }
            });

        return () => {
            cancelled = true;
        };

    }, [deleteId]);


    /* =====================================================
       VIEW DETAIL
    ===================================================== */

    const [viewQuestion, setViewQuestion] =
        useState<Question | null>(null);

    /*
     * Topic nào đang thu gọn trong danh sách.
     * Mặc định tất cả Topic đều mở.
     */
    const [collapsedTopicIds, setCollapsedTopicIds] =
        useState<Set<string>>(new Set());


    /* =====================================================
       TEACHER TOPICS
    ===================================================== */

   


    /* =====================================================
       QUESTION FILTER
    ===================================================== */

    const filteredQuestions = useMemo(() => {

        const keyword =
            search
                .trim()
                .toLowerCase();


        return questions.filter(question => {

            /*
             * Teacher chỉ xem câu hỏi thuộc môn
             * mình phụ trách.
             */
            if (
                question.subjectId !==
                currentTeacher.subjectId
            ) {
                return false;
            }


            /*
             * Search
             */
            if (
                keyword &&
                !question.text
                    .toLowerCase()
                    .includes(keyword)
            ) {
                return false;
            }


            /*
             * Topic
             */
            if (
                topicFilter !== "all" &&
                question.topicId !== topicFilter
            ) {
                return false;
            }


            /*
             * Difficulty
             */
            if (
                difficultyFilter !== "all" &&
                question.difficulty !==
                difficultyFilter
            ) {
                return false;
            }



            return true;

        });

    }, [
        questions,
        search,
        topicFilter,
        difficultyFilter,
        currentTeacher.subjectId,
    ]);


    /* =====================================================
       LOAD QUESTIONS FROM API
    ===================================================== */

    const reloadQuestions = async () => {

        try {

            setIsLoading(true);


            const data =
                await questionService
                    .getMyQuestions();


            const mapped =
                data.map(
                    mapQuestionDtoToQuestion
                );


            onUpdateQuestions(
                mapped
            );


        } catch (error) {

            console.error(
                "Load questions error:",
                error
            );


            showToast?.(
                error instanceof Error
                    ? error.message
                    : "Không thể tải danh sách câu hỏi.",
                "error"
            );

        } finally {

            setIsLoading(false);

        }
    };


    /* =====================================================
       LOAD WHEN COMPONENT MOUNT
    ===================================================== */

    // Mỗi lần vào ngân hàng câu hỏi đều nạp lại từ API, không dựa vào
    // dữ liệu có sẵn trong bộ nhớ của ứng dụng.
    useEffect(() => {
        void reloadQuestions();
    }, []);

    useEffect(() => {

        const loadTeacherTopics = async () => {

            const subjectId =
                currentTeacher.subjectId?.trim();

            const gradeId =
                currentTeacher.gradeId?.trim();


            console.log(
                "===== LOAD TEACHER TOPICS =====",
            );

            console.log(
                "Teacher:",
                currentTeacher,
            );

            console.log(
                "SubjectId:",
                subjectId,
            );

            console.log(
                "GradeId:",
                gradeId,
            );


            if (!subjectId) {

                console.error(
                    "Teacher chưa có SubjectId",
                );

                setTeacherTopics([]);

                return;
            }


            if (!gradeId) {

                console.error(
                    "Teacher chưa có GradeId",
                );

                setTeacherTopics([]);

                return;
            }


            try {

                setIsLoadingTopics(true);


                const data =
                    await topicService.getTopics(
                        subjectId,
                        gradeId,
                    );


                console.log(
                    "TOPICS CỦA TEACHER:",
                    data,
                );


                setTeacherTopics(
                    Array.isArray(data)
                        ? data
                        : [],
                );

            } catch (error) {

                console.error(
                    "Load teacher topics error:",
                    error,
                );

                setTeacherTopics([]);

                showToast?.(
                    error instanceof Error
                        ? error.message
                        : "Không thể tải danh sách Topic.",
                    "error",
                );

            } finally {

                setIsLoadingTopics(false);
            }
        };


        void loadTeacherTopics();

    }, [
        currentTeacher.subjectId,
        currentTeacher.gradeId,
        showToast,
    ]);

    /* =====================================================
       OPEN CREATE
    ===================================================== */

    const handleOpenCreate = () => {

        if (isLoadingTopics) {

            showToast?.(
                "Đang tải danh sách Topic, vui lòng chờ.",
                "info",
            );

            return;
        }

        if (teacherTopics.length === 0) {

            showToast?.(
                `Môn ${currentTeacher.subjectName ?? ""} chưa có Topic.`,
                "error",
            );

            return;
        }

        setModalMode("add");

        setEditingQuestionId(null);

        setEditorText("");

        setEditorType(
            "single_choice",
        );

        setEditorDifficulty(
            "medium",
        );

        // Nếu chỉ có 1 Topic thì tự chọn.
        // Nếu nhiều Topic thì bắt giáo viên chọn.
        setEditorTopicId(
            teacherTopics.length === 1
                ? teacherTopics[0].id
                : "",
        );

        setEditorOptions([
            "",
            "",
            "",
            "",
        ]);

        setEditorCorrectAnswer("A");

        setEditorExplanation("");

        setIsModalOpen(true);
    };


    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const handleOpenEdit = (
        question: Question
    ) => {

        /*
         * Chỉ được sửa câu hỏi của mình.
         */
        const isOwner =
            question.createdBy ===
            currentTeacher.id;


        if (!isOwner) {

            showToast?.(
                "Bạn chỉ được chỉnh sửa câu hỏi do mình tạo.",
                "error"
            );

            return;
        }


        setModalMode("edit");

        setEditingQuestionId(
            question.id
        );

        setEditorText(
            question.text
        );

        setEditorType(
            question.type
        );

        setEditorDifficulty(
            question.difficulty
        );

        setEditorTopicId(
            question.topicId
        );

        setEditorOptions(
            question.options?.length
                ? [
                    question.options[0] ?? "",
                    question.options[1] ?? "",
                    question.options[2] ?? "",
                    question.options[3] ?? "",
                ]
                : ["", "", "", ""]
        );


        const correct =
            Array.isArray(
                question.correctAnswer
            )
                ? question.correctAnswer.join(",")
                : question.correctAnswer;


        setEditorCorrectAnswer(
            correct || "A"
        );


        setEditorExplanation(
            question.explanation ?? ""
        );


        setIsModalOpen(true);
    };


    /* =====================================================
       SAVE QUESTION
    ===================================================== */

    const handleSave = async (
        event: React.FormEvent
    ) => {

        event.preventDefault();


        /* -----------------------------------------------
           VALIDATION
        ------------------------------------------------ */

        if (!editorText.trim()) {

            showToast?.(
                "Vui lòng nhập nội dung câu hỏi.",
                "error"
            );

            return;
        }


        if (!editorTopicId) {

            showToast?.(
                "Vui lòng chọn Topic.",
                "error"
            );

            return;
        }


        if (
            editorType ===
            "single_choice" ||
            editorType ===
            "multiple_choice"
        ) {

            const validOptions =
                editorOptions.filter(
                    option =>
                        option.trim()
                );


            if (
                validOptions.length < 4
            ) {

                showToast?.(
                    "Vui lòng nhập đủ 4 đáp án.",
                    "error"
                );

                return;
            }

            const selectedCorrectAnswers = editorCorrectAnswer
                .split(",")
                .filter(Boolean);

            if (editorType === "single_choice" && selectedCorrectAnswers.length !== 1) {
                showToast?.("Câu một đáp án phải có đúng 1 đáp án đúng.", "error");
                return;
            }

            if (editorType === "multiple_choice" && selectedCorrectAnswers.length < 2) {
                showToast?.("Câu nhiều đáp án phải có ít nhất 2 đáp án đúng.", "error");
                return;
            }
        } else if (editorType === "true_false") {
            if (!editorCorrectAnswer || (editorCorrectAnswer !== "T" && editorCorrectAnswer !== "F")) {
                showToast?.("Vui lòng chọn đáp án đúng là Đúng hoặc Sai.", "error");
                return;
            }
        } else if (editorType === "essay") {
            if (!editorCorrectAnswer.trim()) {
                showToast?.("Vui lòng nhập đáp án chuẩn hoặc từ khóa tham chiếu cho câu tự luận.", "error");
                return;
            }
        }


        try {

            setIsSaving(true);


            /* =============================================
               CREATE
            ============================================= */

            if (
                modalMode === "add"
            ) {

                const request:
                    CreateQuestionRequest = {

                    noiDung:
                        editorText.trim(),

                    optionA:
                        editorOptions[0]
                            ?.trim() ?? "",

                    optionB:
                        editorOptions[1]
                            ?.trim() ?? "",

                    optionC:
                        editorOptions[2]
                            ?.trim() ?? "",

                    optionD:
                        editorOptions[3]
                            ?.trim() ?? "",

                    correctAnswer:
                        editorCorrectAnswer,

                    type: editorType,

                    difficulty: editorDifficulty,

                    topicId:
                        editorTopicId,

                    explanation:
                        editorExplanation
                            .trim() ||
                        undefined,
                };


                console.log(
                    "POST Question:",
                    request
                );


                /*
                 * GỌI BACKEND THẬT
                 */
                await questionService
                    .createQuestion(
                        request
                    );


                showToast?.(
                    "Tạo câu hỏi thành công.",
                    "success"
                );
            }


            /* =============================================
               UPDATE
            ============================================= */

            else {

                if (
                    !editingQuestionId
                ) {

                    throw new Error(
                        "Không xác định được câu hỏi cần sửa."
                    );
                }


                const request:
                    UpdateQuestionRequest = {

                    noiDung:
                        editorText.trim(),

                    optionA:
                        editorOptions[0]
                            ?.trim() ?? "",

                    optionB:
                        editorOptions[1]
                            ?.trim() ?? "",

                    optionC:
                        editorOptions[2]
                            ?.trim() ?? "",

                    optionD:
                        editorOptions[3]
                            ?.trim() ?? "",

                    correctAnswer:
                        editorCorrectAnswer,

                    type: editorType,

                    difficulty: editorDifficulty,

                    topicId:
                        editorTopicId,

                    explanation:
                        editorExplanation
                            .trim() ||
                        undefined,
                };


                /*
                 * GỌI BACKEND THẬT
                 */
                await questionService
                    .updateQuestion(
                        editingQuestionId,
                        request
                    );


                showToast?.(
                    "Cập nhật câu hỏi thành công.",
                    "success"
                );
            }


            /*
             * ĐÓNG MODAL
             */
            setIsModalOpen(false);


            /*
             * QUAN TRỌNG:
             *
             * Không tự thêm object vào state.
             *
             * Load lại DB.
             */
            await reloadQuestions();


        } catch (error) {

            console.error(
                "Save question error:",
                error
            );


            showToast?.(
                error instanceof Error
                    ? error.message
                    : "Không thể lưu câu hỏi.",
                "error"
            );

        } finally {

            setIsSaving(false);

        }
    };


    /* =====================================================
       DELETE QUESTION
    ===================================================== */

    const handleDelete = async (
        id: string
    ) => {

        const question =
            questions.find(
                q => q.id === id
            );


        if (!question) {
            return;
        }


        /*
         * Chỉ Owner được xóa.
         */
        if (
            question.createdBy !==
            currentTeacher.id
        ) {

            showToast?.(
                "Bạn không có quyền xóa câu hỏi của giáo viên khác.",
                "error"
            );

            return;
        }


        try {

            setIsLoading(true);


            // Đề chưa công bố đang dùng câu hỏi → giáo viên đã xác nhận trong hộp thoại.
            await questionService
                .deleteQuestion(
                    id,
                    deleteUsage?.requiresConfirmation === true
                );


            showToast?.(
                "Đã xóa câu hỏi.",
                "success"
            );


            setDeleteId(null);


            await reloadQuestions();


        } catch (error) {

            console.error(
                "Delete question error:",
                error
            );


            showToast?.(
                error instanceof Error
                    ? error.message
                    : "Không thể xóa câu hỏi.",
                "error"
            );

        } finally {

            setIsLoading(false);

        }
    };


    /* =====================================================
       TOPIC NAME
    ===================================================== */

    const getTopicName = (
        topicId: string
    ) => {

        return (
            teacherTopics.find(
                topic =>
                    topic.id === topicId
            )?.name ??
            "Chưa phân Topic"
        );
    };



    /* =====================================================
       GROUP QUESTIONS: CHƯƠNG -> TOPIC -> CÂU HỎI
    ===================================================== */

    const fullGroupedQuestions = useMemo(() => {

        const chapterMap = new Map<
            string,
            {
                key: string;
                chapterOrder: number;
                chapterName: string;
                topics: Map<
                    string,
                    {
                        topicId: string;
                        topicName: string;
                        orderNum: number;
                        questions: Question[];
                    }
                >;
            }
        >();

        filteredQuestions.forEach((question) => {

            const topic = teacherTopics.find(
                item => item.id === question.topicId
            );

            const chapterOrder =
                topic?.chapterOrder ?? 9999;

            const chapterName =
                topic?.chapterName?.trim() ||
                "Chưa phân chương";

            const topicName =
                topic?.name?.trim() ||
                "Chưa phân Topic";

            const orderNum =
                topic?.orderNum ?? 9999;

            const chapterKey =
                `${chapterOrder}::${chapterName}`;

            if (!chapterMap.has(chapterKey)) {
                chapterMap.set(chapterKey, {
                    key: chapterKey,
                    chapterOrder,
                    chapterName,
                    topics: new Map(),
                });
            }

            const chapter =
                chapterMap.get(chapterKey)!;

            if (!chapter.topics.has(question.topicId)) {
                chapter.topics.set(
                    question.topicId,
                    {
                        topicId:
                            question.topicId,

                        topicName,

                        orderNum,

                        questions: [],
                    }
                );
            }

            chapter.topics
                .get(question.topicId)!
                .questions
                .push(question);
        });

        return Array.from(chapterMap.values())
            .sort(
                (left, right) =>
                    left.chapterOrder -
                        right.chapterOrder ||
                    left.chapterName.localeCompare(
                        right.chapterName,
                        "vi"
                    )
            )
            .map(chapter => ({
                ...chapter,

                topics:
                    Array.from(
                        chapter.topics.values()
                    )
                        .sort(
                            (left, right) =>
                                left.orderNum -
                                    right.orderNum ||
                                left.topicName.localeCompare(
                                    right.topicName,
                                    "vi"
                                )
                        ),
            }));

    }, [
        filteredQuestions,
        teacherTopics,
    ]);


    /* =====================================================
       PHÂN TRANG: giữ nguyên bố cục Chương -> Topic -> Câu hỏi,
       chỉ hiển thị 20 câu hỏi mỗi trang theo đúng thứ tự nhóm.
    ===================================================== */

    const orderedQuestions = useMemo(
        () =>
            fullGroupedQuestions.flatMap(chapter =>
                chapter.topics.flatMap(topic => topic.questions)
            ),
        [fullGroupedQuestions]
    );

    const questionPagination = usePagination(
        orderedQuestions,
        20,
        `${search}|${topicFilter}|${difficultyFilter}|${currentTeacher.subjectId}`
    );

    const groupedQuestions = useMemo(() => {

        const pageQuestionIds = new Set(
            questionPagination.pageItems.map(question => question.id)
        );

        return fullGroupedQuestions
            .map(chapter => ({
                ...chapter,

                // Tổng số câu của chương (không phụ thuộc trang hiện tại).
                totalQuestions: chapter.topics.reduce(
                    (total, topic) => total + topic.questions.length,
                    0
                ),

                topics: chapter.topics
                    .map(topic => ({
                        ...topic,

                        // Tổng số câu của topic (không phụ thuộc trang hiện tại).
                        totalQuestions: topic.questions.length,

                        questions: topic.questions.filter(question =>
                            pageQuestionIds.has(question.id)
                        ),
                    }))
                    .filter(topic => topic.questions.length > 0),
            }))
            .filter(chapter => chapter.topics.length > 0);

    }, [fullGroupedQuestions, questionPagination.pageItems]);


    const toggleTopicGroup = (
        topicId: string
    ) => {

        setCollapsedTopicIds(previous => {

            const next =
                new Set(previous);

            if (next.has(topicId)) {
                next.delete(topicId);
            } else {
                next.add(topicId);
            }

            return next;
        });
    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="
            min-h-full
            bg-slate-50
            p-6
        ">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="
                mb-6
                flex
                items-center
                justify-between
                gap-4
            ">

                <div>

                    <h1 className="
                        text-2xl
                        font-black
                        text-slate-900
                    ">
                        Ngân hàng câu hỏi
                    </h1>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-500
                    ">
                        Quản lý câu hỏi theo Chương và Topic.
                        Các câu cùng Topic được gom vào một nhóm.
                    </p>

                </div>


                <div className="
                    flex
                    items-center
                    gap-2
                ">

                    <button
                        type="button"
                        onClick={() =>
                            void reloadQuestions()
                        }
                        disabled={isLoading}
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-slate-700
                            hover:bg-slate-100
                            disabled:opacity-50
                        "
                    >

                        <RefreshCw
                            size={17}
                            className={
                                isLoading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Làm mới

                    </button>


                    <button
                        type="button"
                        onClick={
                            handleOpenCreate
                        }
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                            shadow-sm
                            hover:bg-blue-700
                        "
                    >

                        <Plus
                            size={18}
                        />

                        Tạo câu hỏi

                    </button>

                </div>

            </div>


            {/* =========================================
                FILTER
            ========================================= */}

            <div className="
                mb-6
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-4
            ">

                <div className="
                    grid
                    grid-cols-1
                    gap-3
                    md:grid-cols-3
                ">

                    {/* Search */}

                    <div className="
                        relative
                        md:col-span-1
                    ">

                        <Search
                            size={18}
                            className="
                                absolute
                                left-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                            "
                        />

                        <input
                            value={search}
                            onChange={e =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="
                                Tìm câu hỏi...
                            "
                            className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                py-2.5
                                pl-10
                                pr-3
                                text-sm
                                outline-none
                                focus:border-blue-500
                            "
                        />

                    </div>


                    {/* Topic */}

                    <select
                        value={topicFilter}
                        onChange={e =>
                            setTopicFilter(
                                e.target.value
                            )
                        }
                        className="
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                        "
                    >

                        <option value="all">
                            Tất cả Topic
                        </option>

                        {teacherTopics.map((topic) => (
                            <option
                                key={topic.id}
                                value={topic.id}
                            >
                                {topic.name}
                            </option>
                        ))}

                    </select>


                    {/* Difficulty */}

                    <select
                        value={
                            difficultyFilter
                        }
                        onChange={e =>
                            setDifficultyFilter(
                                e.target.value
                            )
                        }
                        className="
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2.5
                            text-sm
                            outline-none
                        "
                    >

                        <option value="all">
                            Tất cả độ khó
                        </option>

                        <option value="easy">
                            Dễ
                        </option>

                        <option value="medium">
                            Trung bình
                        </option>

                        <option value="hard">
                            Khó
                        </option>

                    </select>


            

             

                </div>

            </div>


            {/* =========================================
                TOPIC INFO
            ========================================= */}

            <div className="
                mb-6
                rounded-2xl
                border
                border-blue-100
                bg-blue-50
                p-4
            ">

                <div className="
                    flex
                    items-start
                    gap-3
                ">

                    <div className="
                        rounded-xl
                        bg-blue-100
                        p-2
                        text-blue-600
                    ">

                        <BookOpen
                            size={20}
                        />

                    </div>


                    <div>

                        <p className="
                            font-bold
                            text-slate-800
                        ">
                            Môn phụ trách
                        </p>

                        <p className="
                            text-sm
                            text-slate-600
                        ">
                            {currentTeacher.subjectName}
                        </p>

                        <p className="
                            mt-1
                            text-xs
                            text-slate-500
                        ">
                            Có{" "}
                            <b>
                                {teacherTopics.length}
                            </b>{" "}
                            Topic đang được sử dụng.
                        </p>

                    </div>

                </div>

            </div>


            {/* =========================================
                GROUPED QUESTION LIST
                CHƯƠNG -> TOPIC -> CÂU HỎI
            ========================================= */}

            <div className="space-y-6">

                {!filteredQuestions.length && (

                    <div
                        className="
                            rounded-2xl
                            border
                            border-dashed
                            border-slate-300
                            bg-white
                            px-6
                            py-16
                            text-center
                        "
                    >

                        <BookOpen
                            size={40}
                            className="
                                mx-auto
                                text-slate-300
                            "
                        />

                        <p
                            className="
                                mt-3
                                font-bold
                                text-slate-600
                            "
                        >
                            Chưa có câu hỏi
                        </p>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-400
                            "
                        >
                            Hãy tạo câu hỏi đầu tiên
                            cho Topic.
                        </p>

                    </div>
                )}


                {groupedQuestions.map(chapter => {

                    const chapterQuestionCount =
                        chapter.totalQuestions;

                    return (

                        <section
                            key={chapter.key}
                            className="
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-sm
                            "
                        >

                            {/* CHAPTER HEADER */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-3
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                    px-5
                                    py-4
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            h-10
                                            w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-amber-50
                                            text-amber-600
                                        "
                                    >
                                        <BookOpen
                                            size={19}
                                        />
                                    </div>

                                    <div>

                                        <div
                                            className="
                                                text-xs
                                                font-black
                                                uppercase
                                                tracking-wide
                                                text-amber-600
                                            "
                                        >
                                            Chương {
                                                chapter.chapterOrder === 9999
                                                    ? "-"
                                                    : chapter.chapterOrder
                                            }
                                        </div>

                                        <h2
                                            className="
                                                mt-0.5
                                                text-base
                                                font-black
                                                text-slate-900
                                            "
                                        >
                                            {chapter.chapterName}
                                        </h2>

                                    </div>

                                </div>

                                <span
                                    className="
                                        inline-flex
                                        w-fit
                                        rounded-full
                                        bg-white
                                        px-3
                                        py-1.5
                                        text-xs
                                        font-bold
                                        text-slate-500
                                        ring-1
                                        ring-slate-200
                                    "
                                >
                                    {chapterQuestionCount} câu hỏi
                                </span>

                            </div>


                            {/* TOPICS IN CHAPTER */}

                            <div
                                className="
                                    space-y-3
                                    p-4
                                "
                            >

                                {chapter.topics.map(topicGroup => {

                                    const isCollapsed =
                                        collapsedTopicIds.has(
                                            topicGroup.topicId
                                        );

                                    return (

                                        <div
                                            key={topicGroup.topicId}
                                            className="
                                                overflow-hidden
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                            "
                                        >

                                            {/* TOPIC HEADER */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleTopicGroup(
                                                        topicGroup.topicId
                                                    )
                                                }
                                                className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-between
                                                    gap-4
                                                    bg-indigo-50/50
                                                    px-4
                                                    py-3.5
                                                    text-left
                                                    transition
                                                    hover:bg-indigo-50
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        min-w-0
                                                        items-center
                                                        gap-3
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            h-8
                                                            min-w-8
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            bg-indigo-600
                                                            px-2
                                                            text-xs
                                                            font-black
                                                            text-white
                                                        "
                                                    >
                                                        {
                                                            topicGroup.orderNum === 9999
                                                                ? "--"
                                                                : String(
                                                                    topicGroup.orderNum
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )
                                                        }
                                                    </div>

                                                    <div className="min-w-0">

                                                        <p
                                                            className="
                                                                text-[11px]
                                                                font-black
                                                                uppercase
                                                                tracking-wide
                                                                text-indigo-500
                                                            "
                                                        >
                                                            Topic
                                                        </p>

                                                        <p
                                                            className="
                                                                truncate
                                                                text-sm
                                                                font-black
                                                                text-slate-800
                                                            "
                                                        >
                                                            {topicGroup.topicName}
                                                        </p>

                                                    </div>

                                                </div>


                                                <div
                                                    className="
                                                        flex
                                                        shrink-0
                                                        items-center
                                                        gap-3
                                                    "
                                                >

                                                    <span
                                                        className="
                                                            rounded-full
                                                            bg-white
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-bold
                                                            text-indigo-600
                                                            ring-1
                                                            ring-indigo-100
                                                        "
                                                    >
                                                        {topicGroup.totalQuestions} câu
                                                    </span>

                                                    {isCollapsed
                                                        ? (
                                                            <ChevronRight
                                                                size={18}
                                                                className="
                                                                    text-slate-400
                                                                "
                                                            />
                                                        )
                                                        : (
                                                            <ChevronDown
                                                                size={18}
                                                                className="
                                                                    text-slate-400
                                                                "
                                                            />
                                                        )
                                                    }

                                                </div>

                                            </button>


                                            {/* QUESTIONS */}

                                            {!isCollapsed && (

                                                <div
                                                    className="
                                                        divide-y
                                                        divide-slate-100
                                                    "
                                                >

                                                    {topicGroup.questions.map(
                                                        (
                                                            question,
                                                            questionIndex,
                                                        ) => {

                                                            const isOwner =
                                                                question.createdBy ===
                                                                currentTeacher.id;

                                                            return (

                                                                <div
                                                                    key={
                                                                        question.id
                                                                    }
                                                                    className="
                                                                        group
                                                                        grid
                                                                        grid-cols-1
                                                                        gap-4
                                                                        px-4
                                                                        py-4
                                                                        transition
                                                                        hover:bg-slate-50/70
                                                                        lg:grid-cols-[minmax(0,1fr)_150px_170px_auto]
                                                                        lg:items-center
                                                                    "
                                                                >

                                                                    {/* QUESTION */}

                                                                    <div
                                                                        className="
                                                                            flex
                                                                            min-w-0
                                                                            items-start
                                                                            gap-3
                                                                        "
                                                                    >

                                                                        <div
                                                                            className="
                                                                                flex
                                                                                h-8
                                                                                w-8
                                                                                shrink-0
                                                                                items-center
                                                                                justify-center
                                                                                rounded-lg
                                                                                bg-slate-100
                                                                                text-xs
                                                                                font-black
                                                                                text-slate-500
                                                                            "
                                                                        >
                                                                            {questionIndex + 1}
                                                                        </div>

                                                                        <div className="min-w-0">

                                                                            <p
                                                                                className="
                                                                                    line-clamp-2
                                                                                    text-sm
                                                                                    font-semibold
                                                                                    leading-6
                                                                                    text-slate-800
                                                                                "
                                                                            >
                                                                                {question.text}
                                                                            </p>


                                                                        </div>

                                                                    </div>


                                                                    {/* DIFFICULTY */}

                                                                    <div>
                                                                        <DifficultyBadge
                                                                            difficulty={
                                                                                question.difficulty
                                                                            }
                                                                        />
                                                                    </div>


                                                                    {/* CREATOR */}

                                                                    <div
                                                                        className="
                                                                            text-sm
                                                                            text-slate-600
                                                                        "
                                                                    >

                                                                        <p
                                                                            className="
                                                                                truncate
                                                                                font-semibold
                                                                            "
                                                                        >
                                                                            {
                                                                                question.creatorName ||
                                                                                "Không xác định"
                                                                            }
                                                                        </p>

                                                                        {isOwner && (

                                                                            <span
                                                                                className="
                                                                                    mt-0.5
                                                                                    inline-block
                                                                                    text-xs
                                                                                    font-bold
                                                                                    text-emerald-600
                                                                                "
                                                                            >
                                                                                Của tôi
                                                                            </span>
                                                                        )}

                                                                    </div>


                                                                    {/* ACTIONS */}

                                                                    <div
                                                                        className="
                                                                            flex
                                                                            items-center
                                                                            gap-2
                                                                            lg:justify-end
                                                                        "
                                                                    >

                                                                        <button
                                                                            type="button"
                                                                            title="Xem"
                                                                            onClick={() =>
                                                                                setViewQuestion(
                                                                                    question
                                                                                )
                                                                            }
                                                                            className="
                                                                                rounded-lg
                                                                                border
                                                                                border-slate-200
                                                                                p-2
                                                                                text-slate-600
                                                                                transition
                                                                                hover:bg-slate-100
                                                                            "
                                                                        >
                                                                            <Eye
                                                                                size={16}
                                                                            />
                                                                        </button>


                                                                        {isOwner && (

                                                                            <button
                                                                                type="button"
                                                                                title="Sửa"
                                                                                onClick={() =>
                                                                                    handleOpenEdit(
                                                                                        question
                                                                                    )
                                                                                }
                                                                                className="
                                                                                    rounded-lg
                                                                                    border
                                                                                    border-slate-200
                                                                                    p-2
                                                                                    text-blue-600
                                                                                    transition
                                                                                    hover:bg-blue-50
                                                                                "
                                                                            >
                                                                                <Edit2
                                                                                    size={16}
                                                                                />
                                                                            </button>
                                                                        )}


                                                                        {isOwner && (

                                                                            <button
                                                                                type="button"
                                                                                title="Xóa"
                                                                                onClick={() =>
                                                                                    setDeleteId(
                                                                                        question.id
                                                                                    )
                                                                                }
                                                                                className="
                                                                                    rounded-lg
                                                                                    border
                                                                                    border-red-100
                                                                                    p-2
                                                                                    text-red-500
                                                                                    transition
                                                                                    hover:bg-red-50
                                                                                "
                                                                            >
                                                                                <Trash2
                                                                                    size={16}
                                                                                />
                                                                            </button>
                                                                        )}

                                                                    </div>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>
                                            )}

                                        </div>
                                    );
                                })}

                            </div>

                        </section>
                    );
                })}

                <Pagination
                    page={questionPagination.page}
                    pageSize={questionPagination.pageSize}
                    total={questionPagination.total}
                    onPageChange={questionPagination.setPage}
                    itemLabel="câu hỏi"
                />

            </div>


            {/* =========================================
                CREATE / EDIT MODAL
            ========================================= */}

            {isModalOpen && (

                <QuestionFormModal
                    mode={
                        modalMode
                    }

                    topics={
                        teacherTopics
                    }

                    topicId={
                        editorTopicId
                    }

                    setTopicId={
                        setEditorTopicId
                    }

                    text={
                        editorText
                    }

                    setText={
                        setEditorText
                    }

                    type={
                        editorType
                    }

                    setType={
                        setEditorType
                    }

                    difficulty={
                        editorDifficulty
                    }

                    setDifficulty={
                        setEditorDifficulty
                    }

                    options={
                        editorOptions
                    }

                    setOptions={
                        setEditorOptions
                    }

                    correctAnswer={
                        editorCorrectAnswer
                    }

                    setCorrectAnswer={
                        setEditorCorrectAnswer
                    }

                    explanation={
                        editorExplanation
                    }

                    setExplanation={
                        setEditorExplanation
                    }

                    isSaving={
                        isSaving
                    }

                    onClose={() =>
                        setIsModalOpen(
                            false
                        )
                    }

                    onSubmit={
                        handleSave
                    }

                    isLoadingTopics={
                        isLoadingTopics
                    }
                />

            )}


            {/* =========================================
                VIEW MODAL
            ========================================= */}

            {viewQuestion && (

                <QuestionPreviewModal
                    question={
                        viewQuestion
                    }

                    topicName={
                        getTopicName(
                            viewQuestion.topicId
                        )
                    }

                    onClose={() =>
                        setViewQuestion(
                            null
                        )
                    }
                />

            )}


            {/* =========================================
                DELETE MODAL
            ========================================= */}

            {deleteId && (

                <DeleteQuestionDialog

                    usage={deleteUsage}

                    checkError={deleteCheckError}

                    deleting={isLoading}

                    onCancel={() =>
                        setDeleteId(
                            null
                        )
                    }

                    onConfirm={() =>
                        void handleDelete(
                            deleteId
                        )
                    }

                />

            )}

        </div>

    );
}


/* =========================================================
   MAP DTO → FRONTEND QUESTION
========================================================= */

export function mapQuestionDtoToQuestion(
    item: QuestionDto
): Question {

    return {

        id:
            item.id,

        text:
            item.noiDung,

        type:
            item.type ?? "single_choice",

        options: [
            item.optionA,
            item.optionB,
            item.optionC,
            item.optionD,
        ],

        correctAnswer:
            item.correctAnswer,

        difficulty:
            item.difficulty ?? "medium",

        subjectId:
            item.subjectId,

        topicId:
            item.topicId,

        createdBy:
            item.createdBy,

        creatorName:
            item.creatorName ?? "",

        status:
            item.status,

        createdAt:
            item.createdAt,

        explanation:
            item.explanation,

    };
}


/* =========================================================
   DIFFICULTY BADGE
========================================================= */

function DifficultyBadge({
    difficulty,
}: {
    difficulty: QuestionDifficulty;
}) {

    const label =
        difficulty === "easy"
            ? "Dễ"
            : difficulty === "hard"
                ? "Khó"
                : "Trung bình";


    return (

        <span className="
            inline-flex
            rounded-lg
            bg-slate-100
            px-2.5
            py-1
            text-xs
            font-bold
            text-slate-600
        ">
            {label}
        </span>

    );
}


/* =========================================================
   FORM MODAL
========================================================= */

interface QuestionFormModalProps {
    mode: "add" | "edit";

    topics: TopicDto[];

    topicId: string;

    setTopicId:
    React.Dispatch<
        React.SetStateAction<string>
    >;

    text: string;

    setText:
    React.Dispatch<
        React.SetStateAction<string>
    >;

    type: QuestionType;

    setType:
    React.Dispatch<
        React.SetStateAction<QuestionType>
    >;

    difficulty: QuestionDifficulty;

    setDifficulty:
    React.Dispatch<
        React.SetStateAction<QuestionDifficulty>
    >;

    options: string[];

    setOptions:
    React.Dispatch<
        React.SetStateAction<string[]>
    >;

    correctAnswer: string;

    setCorrectAnswer:
    React.Dispatch<
        React.SetStateAction<string>
    >;

    explanation: string;

    setExplanation:
    React.Dispatch<
        React.SetStateAction<string>
    >;

    isSaving: boolean;

    isLoadingTopics: boolean;

    onClose: () => void;

    onSubmit:
    (
        e: React.FormEvent
    ) => void;
}


function QuestionFormModal({
    mode,
    topics,
    topicId,
    setTopicId,
    text,
    setText,
    type,
    setType,
    difficulty,
    setDifficulty,
    options,
    setOptions,
    correctAnswer,
    setCorrectAnswer,
    explanation,
    setExplanation,
    isSaving,
    isLoadingTopics,
    onClose,
    onSubmit,
}: QuestionFormModalProps) {

    /*
     * UX: chọn Topic trước.
     * Chương được suy ra trực tiếp từ Topic để tránh chọn lệch dữ liệu.
     */
    const sortedTopics = useMemo(
        () =>
            [...topics].sort(
                (left, right) =>
                    left.chapterOrder -
                        right.chapterOrder ||
                    left.orderNum -
                        right.orderNum ||
                    left.name.localeCompare(
                        right.name,
                        "vi"
                    )
            ),
        [topics],
    );

    const selectedTopic = useMemo(
        () =>
            topics.find(
                topic =>
                    topic.id === topicId
            ) ?? null,
        [
            topics,
            topicId,
        ],
    );

    const selectedCorrectAnswers = useMemo(
        () => new Set(correctAnswer.split(",").filter(Boolean)),
        [correctAnswer],
    );

    const selectCorrectAnswer = (label: string) => {
        if (type === "single_choice") {
            setCorrectAnswer(label);
            return;
        }

        const next = new Set(selectedCorrectAnswers);
        if (next.has(label)) next.delete(label);
        else next.add(label);

        setCorrectAnswer(["A", "B", "C", "D"].filter((item) => next.has(item)).join(","));
    };

    const updateOption = (
        index: number,
        value: string,
    ) => {

        setOptions(prev => {

            const next = [...prev];

            next[index] = value;

            return next;
        });
    };

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

            <div
                className="
                    max-h-[92vh]
                    w-full
                    max-w-3xl
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
                            {mode === "add"
                                ? "Tạo câu hỏi"
                                : "Chỉnh sửa câu hỏi"}
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Câu hỏi sẽ thuộc môn học của bạn.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            rounded-xl
                            p-2
                            text-slate-500
                            hover:bg-slate-100
                        "
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* FORM */}

                <form
                    onSubmit={onSubmit}
                    className="space-y-6 p-6"
                >

                    {/* TOPIC FIRST - CHAPTER AUTO */}

                    <div
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
                                mb-3
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >

                            <div>
                                <p
                                    className="
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-slate-400
                                    "
                                >
                                    1. Phân loại
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-slate-500
                                    "
                                >
                                    Chọn Topic, hệ thống tự xác định Chương tương ứng.
                                </p>
                            </div>

                        </div>


                        <label
                            className="
                                mb-2
                                block
                                text-sm
                                font-black
                                text-slate-700
                            "
                        >
                            Topic
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>


                        <select
                            value={topicId}
                            onChange={(e) =>
                                setTopicId(
                                    e.target.value
                                )
                            }
                            disabled={
                                isLoadingTopics ||
                                topics.length === 0
                            }
                            className="
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
                                focus:border-blue-500
                                focus:ring-4
                                focus:ring-blue-500/10
                                disabled:bg-slate-100
                            "
                        >

                            <option value="">
                                {isLoadingTopics
                                    ? "Đang tải Topic..."
                                    : topics.length === 0
                                        ? "Môn học chưa có Topic"
                                        : "Chọn Topic"}
                            </option>

                            {sortedTopics.map(topic => (

                                <option
                                    key={topic.id}
                                    value={topic.id}
                                >
                                    {String(
                                        topic.orderNum
                                    ).padStart(
                                        2,
                                        "0"
                                    )}. {topic.name} — Chương {topic.chapterOrder}
                                </option>
                            ))}

                        </select>


                        {selectedTopic && (

                            <div
                                className="
                                    mt-3
                                    flex
                                    flex-col
                                    gap-2
                                    rounded-xl
                                    border
                                    border-indigo-100
                                    bg-white
                                    px-4
                                    py-3
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            h-9
                                            min-w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-indigo-600
                                            px-2
                                            text-xs
                                            font-black
                                            text-white
                                        "
                                    >
                                        {String(
                                            selectedTopic.orderNum
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </div>

                                    <div>
                                        <p
                                            className="
                                                text-xs
                                                font-black
                                                uppercase
                                                tracking-wide
                                                text-indigo-500
                                            "
                                        >
                                            Topic đã chọn
                                        </p>

                                        <p
                                            className="
                                                text-sm
                                                font-black
                                                text-slate-800
                                            "
                                        >
                                            {selectedTopic.name}
                                        </p>
                                    </div>

                                </div>


                                <div
                                    className="
                                        rounded-lg
                                        bg-amber-50
                                        px-3
                                        py-2
                                        text-xs
                                        font-bold
                                        text-amber-700
                                    "
                                >
                                    Chương {selectedTopic.chapterOrder}
                                    {" · "}
                                    {selectedTopic.chapterName}
                                </div>

                            </div>
                        )}


                        {topics.length === 0 &&
                            !isLoadingTopics && (

                                <p
                                    className="
                                        mt-2
                                        text-xs
                                        font-semibold
                                        text-red-500
                                    "
                                >
                                    Môn học của bạn hiện chưa có Topic.
                                    Vui lòng liên hệ Admin tạo Topic.
                                </p>
                            )}

                    </div>


                    {/* QUESTION */}

                    <div>

                        <label
                            className="
                                mb-2
                                block
                                text-sm
                                font-black
                                text-slate-700
                            "
                        >
                            Nội dung câu hỏi
                            <span className="ml-1 text-red-500">
                                *
                            </span>
                        </label>

                        <textarea
                            value={text}
                            onChange={(e) =>
                                setText(
                                    e.target.value,
                                )
                            }
                            rows={5}
                            placeholder="Nhập nội dung câu hỏi..."
                            className="
                                w-full
                                resize-none
                                rounded-xl
                                border
                                border-slate-200
                                px-4
                                py-3
                                text-sm
                                outline-none
                                focus:border-blue-500
                            "
                        />

                    </div>


                    {/* TYPE + DIFFICULTY */}

                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-4
                            md:grid-cols-2
                        "
                    >

                        <div>

                            <label
                                className="
                                    mb-2
                                    block
                                    text-sm
                                    font-black
                                    text-slate-700
                                "
                            >
                                Loại câu hỏi
                            </label>

                            <select
                                value={type}
                                onChange={(e) => {
                                    const nextType = e.target.value as QuestionType;
                                    setType(nextType);
                                    if (nextType === "single_choice") {
                                        setCorrectAnswer(correctAnswer.split(",")[0] || "A");
                                    }
                                }}
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    text-sm
                                    outline-none
                                    focus:border-blue-500
                                "
                            >

                                <option value="single_choice">
                                    Một đáp án (A,B,C,D)
                                </option>

                                <option value="multiple_choice">
                                    Nhiều đáp án (chọn nhiều ý)
                                </option>

                                <option value="true_false">
                                    Đúng / Sai
                                </option>

                                <option value="essay">
                                    Tự luận / Điền câu trả lời ngắn
                                </option>

                            </select>

                        </div>


                        <div>

                            <label
                                className="
                                    mb-2
                                    block
                                    text-sm
                                    font-black
                                    text-slate-700
                                "
                            >
                                Độ khó
                            </label>

                            <select
                                value={difficulty}
                                onChange={(e) =>
                                    setDifficulty(
                                        e.target.value as QuestionDifficulty,
                                    )
                                }
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    text-sm
                                    outline-none
                                    focus:border-blue-500
                                "
                            >

                                <option value="easy">
                                    Dễ
                                </option>

                                <option value="medium">
                                    Trung bình
                                </option>

                                <option value="hard">
                                    Khó
                                </option>

                            </select>

                        </div>

                    </div>


                    {/* OPTIONS */}

                    {type === "true_false" ? (
                        <div>
                            <label className="mb-3 block text-sm font-black text-slate-700">
                                Đáp án đúng
                                <span className="ml-2 text-xs font-semibold text-slate-400">
                                    (chọn Đúng hoặc Sai cho mệnh đề này)
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCorrectAnswer("T")}
                                    className={`py-3.5 px-4 rounded-xl border text-sm font-black transition flex items-center justify-center gap-2 ${
                                        correctAnswer === "T"
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    ✓ ĐÚNG (T)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCorrectAnswer("F")}
                                    className={`py-3.5 px-4 rounded-xl border text-sm font-black transition flex items-center justify-center gap-2 ${
                                        correctAnswer === "F"
                                            ? "border-rose-600 bg-rose-50 text-rose-700 shadow-sm"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    ✗ SAI (F)
                                </button>
                            </div>
                        </div>
                    ) : type === "essay" ? (
                        <div className="space-y-3">
                            <div>
                                <label className="mb-2 block text-sm font-black text-slate-700">
                                    Đáp án chuẩn / Từ khóa chính xác
                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                        (dùng để chấm tự động nếu câu ngắn/từ khóa, có thể nhập nhiều đáp án ngăn cách bởi dấu /)
                                    </span>
                                </label>
                                <input
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    placeholder="Ví dụ: 12.5 hoặc Hà Nội/TP.HCM hoặc câu trả lời mẫu"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold text-slate-500">
                                    Các ý phụ (nếu là dạng câu hỏi theo ý a, b, c, d hoặc các câu hỏi nhỏ):
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {["a", "b", "c", "d"].map((subLabel, idx) => (
                                        <input
                                            key={subLabel}
                                            value={options[idx] ?? ""}
                                            onChange={(e) => updateOption(idx, e.target.value)}
                                            placeholder={`Ý ${subLabel}) (tùy chọn)`}
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>

                        <label
                            className="
                                mb-3
                                block
                                text-sm
                                font-black
                                text-slate-700
                            "
                        >
                            Đáp án
                            <span className="ml-2 text-xs font-semibold text-slate-400">
                                {type === "multiple_choice"
                                    ? "(chọn ít nhất 2 đáp án đúng)"
                                    : "(chọn đúng 1 đáp án)"}
                            </span>
                        </label>

                        <div className="space-y-3">

                            {[
                                "A",
                                "B",
                                "C",
                                "D",
                            ].map((label, index) => (

                                <div
                                    key={label}
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

                                    <button
                                        type="button"
                                        onClick={() => selectCorrectAnswer(label)}
                                        className={`
                                            flex
                                            h-10
                                            w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            text-sm
                                            font-black
                                            ${selectedCorrectAnswers.has(label)
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-600"
                                            }
                                        `}
                                    >
                                        {label}
                                    </button>

                                    <input
                                        value={
                                            options[index] ?? ""
                                        }
                                        onChange={(e) =>
                                            updateOption(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        placeholder={`Đáp án ${label}`}
                                        className="
                                            flex-1
                                            rounded-xl
                                            border
                                            border-slate-200
                                            px-4
                                            py-3
                                            text-sm
                                            outline-none
                                            focus:border-blue-500
                                        "
                                    />

                                </div>

                            ))}

                        </div>

                        </div>
                    )}


                    {/* EXPLANATION */}

                    <div>

                        <label
                            className="
                                mb-2
                                block
                                text-sm
                                font-black
                                text-slate-700
                            "
                        >
                            Giải thích
                        </label>

                        <textarea
                            value={explanation}
                            onChange={(e) =>
                                setExplanation(
                                    e.target.value,
                                )
                            }
                            rows={3}
                            placeholder="Giải thích đáp án (không bắt buộc)..."
                            className="
                                w-full
                                resize-none
                                rounded-xl
                                border
                                border-slate-200
                                px-4
                                py-3
                                text-sm
                                outline-none
                                focus:border-blue-500
                            "
                        />

                    </div>


                    {/* FOOTER */}

                    <div
                        className="
                            flex
                            justify-end
                            gap-3
                            border-t
                            border-slate-100
                            pt-5
                        "
                    >

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-slate-700
                                hover:bg-slate-50
                            "
                        >
                            Hủy
                        </button>


                        <button
                            type="submit"
                            disabled={
                                isSaving ||
                                isLoadingTopics ||
                                topics.length === 0
                            }
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-3
                                text-sm
                                font-black
                                text-white
                                shadow-sm
                                hover:bg-blue-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            {isSaving ? (
                                <>
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                    />

                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save size={17} />

                                    {mode === "add"
                                        ? "Tạo câu hỏi"
                                        : "Lưu thay đổi"}
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


    /* =========================================================
       PREVIEW MODAL
    ========================================================= */

    function QuestionPreviewModal({
        question,
        topicName,
        onClose,
    }: {
        question: Question;
        topicName: string;
        onClose: () => void;
    }) {

        return (

            <div className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/40
            p-4
        ">

                <div className="
                max-h-[90vh]
                w-full
                max-w-2xl
                overflow-y-auto
                rounded-3xl
                bg-white
                p-6
                shadow-2xl
            ">

                    <div className="
                    flex
                    items-center
                    justify-between
                ">

                        <h2 className="
                        text-xl
                        font-black
                        text-slate-900
                    ">
                            Chi tiết câu hỏi
                        </h2>

                        <button
                            onClick={
                                onClose
                            }
                            className="
                            rounded-xl
                            p-2
                            hover:bg-slate-100
                        "
                        >

                            <X
                                size={20}
                            />

                        </button>

                    </div>


                    <div className="
                    mt-5
                    space-y-5
                ">

                        <div>

                            <p className="
                            text-xs
                            font-bold
                            uppercase
                            text-slate-400
                        ">
                                Topic
                            </p>

                            <p className="
                            mt-1
                            font-bold
                            text-blue-600
                        ">
                                {topicName}
                            </p>

                        </div>


                        <div>

                            <p className="
                            text-xs
                            font-bold
                            uppercase
                            text-slate-400
                        ">
                                Nội dung
                            </p>

                            <p className="
                            mt-2
                            whitespace-pre-wrap
                            text-base
                            font-semibold
                            leading-7
                            text-slate-800
                        ">
                                {
                                    question.text
                                }
                            </p>

                        </div>


                        {question.options?.map(
                            (option, index) => {

                                const label =
                                    String.fromCharCode(
                                        65 + index
                                    );

                                const correct =
                                    Array.isArray(
                                        question.correctAnswer
                                    )
                                        ? question.correctAnswer.includes(
                                            label
                                        )
                                        : question.correctAnswer
                                            .split(",")
                                            .includes(label);


                                return (

                                    <div
                                        key={
                                            index
                                        }
                                        className={`
                                        rounded-xl
                                        border
                                        p-4
                                        ${correct
                                                ? "border-emerald-300 bg-emerald-50"
                                                : "border-slate-200"
                                            }
                                    `}
                                    >

                                        <div className="
                                        flex
                                        items-center
                                        gap-3
                                    ">

                                            <span className="
                                            font-black
                                            text-slate-700
                                        ">
                                                {label}.
                                            </span>

                                            <span className="
                                            text-sm
                                            text-slate-700
                                        ">
                                                {option}
                                            </span>

                                            {correct && (

                                                <Check
                                                    size={17}
                                                    className="
                                                    ml-auto
                                                    text-emerald-600
                                                "
                                                />

                                            )}

                                        </div>

                                    </div>

                                );

                            }
                        )}


                        {question.explanation && (

                            <div className="
                            rounded-xl
                            bg-slate-50
                            p-4
                        ">

                                <p className="
                                text-xs
                                font-black
                                uppercase
                                text-slate-400
                            ">
                                    Giải thích
                                </p>

                                <p className="
                                mt-2
                                text-sm
                                leading-6
                                text-slate-700
                            ">
                                    {
                                        question.explanation
                                    }
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            </div>
        );
    }
