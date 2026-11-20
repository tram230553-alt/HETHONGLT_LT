/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject, ExamPaper, Flashcard, UserStats } from "./types";

// Danh sách các Môn Học
export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Toán Học",
    icon: "Calculator",
    color: "var(--theme-primary)", // Pastel Primary Blue
    progress: 45,
    countTopics: 12,
  },
  {
    id: "english",
    name: "Tiếng Anh",
    icon: "Languages",
    color: "#B5EAD7", // Pastel Success Mint
    progress: 70,
    countTopics: 15,
  },
  {
    id: "physics",
    name: "Vật Lý",
    icon: "Atom",
    color: "#FFD6A5", // Pastel Warning Orange
    progress: 25,
    countTopics: 10,
  },
  {
    id: "chemistry",
    name: "Hóa Học",
    icon: "Beaker",
    color: "var(--theme-secondary)", // Pastel Soft Blue
    progress: 10,
    countTopics: 8,
  },
];

// Danh sách đề thi thử kiểm tra (Exam Papers)
export const EXAM_PAPERS: ExamPaper[] = [
  {
    id: "exam_math_calc",
    title: "Đề Khảo Sát & Giải Tích Hàm Số 12",
    subjectId: "math",
    durationMinutes: 15,
    difficulty: "Trung bình",
    participantsCount: 1450,
    questions: [
      {
        id: "m_q1",
        subjectId: "math",
        text: "Cho hàm số f(x) có đạo hàm f'(x) = x(x-1)²(x+2)³. Hàm số f(x) có bao nhiêu điểm cực trị?",
        options: ["1 cực trị", "2 cực trị", "3 cực trị", "4 cực trị"],
        correctIndex: 1,
        explanation: "Ta có f'(x) đổi dấu khi đi qua x = 0 (bậc lẻ - bậc 1) và x = -2 (bậc lẻ - bậc 3). Tại x = 1, bậc của thừa số là 2 (bậc chẵn) nên f'(x) không đổi dấu khi đi qua x = 1. Vậy hàm số có đúng 2 cực trị."
      },
      {
        id: "m_q2",
        subjectId: "math",
        text: "Hàm số y = (x - 1) / (x + 2) đồng biến trên khoảng nào dưới đây?",
        options: [
          "(-∞; -2) và (-2; +∞)",
          "(-∞; +∞)",
          "(-2; +∞) chỉ duy nhất",
          "R \\ {-2}"
        ],
        correctIndex: 0,
        explanation: "Ta tính đạo hàm y' = [1*(2) - 1*(-1)] / (x+2)² = 3 / (x+2)² > 0 với mọi x thuộc tập xác định. Vậy hàm số đồng biến trên từng khoảng xác định (-∞; -2) và (-2; +∞). Chú ý không viết gộp bằng ký hiệu 'U' hoặc 'R \\ {-2}'."
      },
      {
        id: "m_q3",
        subjectId: "math",
        text: "Tìm giá trị cực đại y_CD của hàm số y = x³ - 3x + 2?",
        options: ["y_CD = 4", "y_CD = 0", "y_CD = 2", "y_CD = 1"],
        correctIndex: 0,
        explanation: "Ta có y' = 3x² - 3 = 0 <=> x = 1 hoặc x = -1. Lập bảng biến thiên: y'' = 6x. Với x = -1 => y''(-1) = -6 < 0 => x = -1 là điểm cực đại. Giá trị cực đại tương ứng là y(-1) = (-1)³ - 3(-1) + 2 = 4."
      },
      {
        id: "m_q4",
        subjectId: "math",
        text: "Đồ thị của hàm số y = (2x - 1) / (x + 1) có tiệm cận đứng là đường thẳng nào?",
        options: ["x = -1", "x = 2", "y = 2", "y = -1"],
        correctIndex: 0,
        explanation: "Tiệm cận đứng là giá trị làm cho mẫu số bằng 0 nhưng tử số khác 0. Ở đây, x + 1 = 0 <=> x = -1. Giới hạn khi x tiến dần tới -1 là vô cực. Vậy tiệm cận đứng là x = -1."
      },
      {
        id: "m_q5",
        subjectId: "math",
        text: "Công thức tính thể tích V của khối chóp có diện tích đáy B và chiều cao h là gì?",
        options: ["V = B * h", "V = 1/3 * B * h", "V = 1/2 * B * h", "V = 3 * B * h"],
        correctIndex: 1,
        explanation: "Thể tích của khối chóp bằng 1/3 tích diện tích mặt đáy với chiều cao tương ứng: V = 1/3 * B * h."
      }
    ]
  },
  {
    id: "exam_eng_grammar",
    title: "Nắm Trọn Điểm Tenses & Passive Voice - Đề Số 1",
    subjectId: "english",
    durationMinutes: 10,
    difficulty: "Dễ",
    participantsCount: 3200,
    questions: [
      {
        id: "e_q1",
        subjectId: "english",
        text: "By the time the teacher arrived in the classroom, the students ________ the blackboard.",
        options: ["have cleaned", "were cleaning", "had cleaned", "cleaned"],
        correctIndex: 2,
        explanation: "Cấu trúc 'By the time + S + V(quá khứ đơn), S + V(quá khứ hoàn thành)'. Ở đây hành động lau bảng diễn ra trước hành động giáo viên bước vào lớp, do đó dùng Quá khứ hoàn thành (had cleaned)."
      },
      {
        id: "e_q2",
        subjectId: "english",
        text: "Select the correct passive voice: 'They are building a new smart school in our province.'",
        options: [
          "A new smart school is built in our province.",
          "A new smart school was being built in our province.",
          "A new smart school is being built in our province.",
          "A new smart school is building in our province."
        ],
        correctIndex: 2,
        explanation: "Câu chủ động ở thì Hiện tại tiếp diễn (are building). Cấu trúc bị động Hiện tại tiếp diễn: S + am/is/are + being + V(pII). Chủ ngữ mới là 'A new smart school' số ít nên chọn 'is being built'."
      },
      {
        id: "e_q3",
        subjectId: "english",
        text: "I haven't met up with my childhood close friends since we ________ high school.",
        options: ["have finished", "finished", "had finished", "were finishing"],
        correctIndex: 1,
        explanation: "Vế trước 'since' dùng Hiện tại hoàn thành (haven't met), vế sau 'since' dùng Quá khứ đơn diễn tả mốc thời gian hành động đã kết thúc (finished)."
      },
      {
        id: "e_q4",
        subjectId: "english",
        text: "Water ________ at 100 degrees Celsius under normal pressure conditions.",
        options: ["is boiling", "boil", "boils", "boiled"],
        correctIndex: 2,
        explanation: "Đây là một sự thật hiển nhiên, chân lý khoa học bất biến. Do đó ta sử dụng thì Hiện tại đơn. Chủ ngữ 'Water' là danh từ không đếm được nên động từ thêm s/es (boils)."
      },
      {
        id: "e_q5",
        subjectId: "english",
        text: "She promised ________ her homework before heading out with her friends.",
        options: ["to finish", "finishing", "finish", "to finishing"],
        correctIndex: 0,
        explanation: "Cấu trúc với động từ 'promise' (hứa): promise + to V (inf). Do đó, 'promise to finish' là cấu trúc chính xác."
      }
    ]
  },
  {
    id: "exam_phy_osc",
    title: "Chuyên Đề Trọng Tâm: Dao Động & Sóng Cơ",
    subjectId: "physics",
    durationMinutes: 12,
    difficulty: "Khó",
    participantsCount: 890,
    questions: [
      {
        id: "p_q1",
        subjectId: "physics",
        text: "Một con lắc lò xo gồm vật nhỏ và lò xo nhẹ có độ cứng k, dao động điều hòa quanh vị trí cân bằng theo trục Ox. Tần số góc ω của con lắc dao động được xác định bằng công thức:",
        options: ["ω = √(m/k)", "ω = √(k/m)", "ω = 2π√(k/m)", "ω = 1/(2π)√(m/k)"],
        correctIndex: 1,
        explanation: "Tần số góc của con lắc lò xo dao động điều hòa là ω = √(k/m) (với k là độ cứng lò xo, m là khối lượng của vật nhỏ)."
      },
      {
        id: "p_q2",
        subjectId: "physics",
        text: "Một nguồn phát sóng dao động điều hòa với tần số f = 50 Hz. Sóng cơ lan truyền trong môi trường với vận tốc v = 20 m/s. Bước sóng λ của sóng này có giá trị là:",
        options: ["0.4 m", "40 cm", "0.4 cm", "Cả A và B đều đúng"],
        correctIndex: 3,
        explanation: "Ta có công thức bước sóng λ = v / f. Thay số: λ = 20 m/s / 50 Hz = 0.4 m. Đổi 0.4 m = 40 cm. Vì vậy cả hai đáp án A (0.4 m) và B (40 cm) đều chính xác."
      },
      {
        id: "p_q3",
        subjectId: "physics",
        text: "Hai nguồn phát sóng kết hợp đồng pha cực đại giao thoa xảy ra tại những vị trí có hiệu đường truyền sóng d2 - d1 bằng:",
        options: ["k * λ (với k nguyên)", "(k + 0.5) * λ (với k nguyên)", "k * λ / 2", "(k + 0.5) * λ / 2"],
        correctIndex: 0,
        explanation: "Điều kiện cực đại giao thoa đối với hai nguồn kết hợp đồng pha là hiệu đường truyền phải bằng một số nguyên lần bước sóng: d2 - d1 = k * λ."
      }
    ]
  },
  {
    id: "exam_chem_base",
    title: "Chuyên Đề Trọng Tâm: Este - Lipit & Cacbohidrat",
    subjectId: "chemistry",
    durationMinutes: 10,
    difficulty: "Trung bình",
    participantsCount: 950,
    questions: [
      {
        id: "c_q1",
        subjectId: "chemistry",
        text: "Chất nào sau đây tác dụng với dung dịch chứa NaOH sinh ra muối natri axetat?",
        options: ["Metanol", "Metyl axetat", "Etyl fomat", "Axit fomic"],
        correctIndex: 1,
        explanation: "Phương trình phản ứng: CH3COOCH3 (metyl axetat) + NaOH -> CH3COONa (natri axetat) + CH3OH (metanol)."
      },
      {
        id: "c_q2",
        subjectId: "chemistry",
        text: "Sản phẩm cuối cùng của quá trình thủy phân hoàn toàn tinh bột hoặc xenlulozơ là gì?",
        options: ["Glucozơ", "Fructozơ", "Saccarozơ", "Mantozơ"],
        correctIndex: 0,
        explanation: "Cả tinh bột và xenlulozơ đều được cấu tạo từ các mắt xích glucozơ liên kết với nhau, do đó khi thủy phân hoàn toàn thu được glucozơ."
      },
      {
        id: "c_q3",
        subjectId: "chemistry",
        text: "Chất đường nào sau đây chiếm tỉ lệ nhiều nhất trong mật ong rừng tự nhiên?",
        options: ["Glucozơ", "Saccarozơ", "Fructozơ", "Mantozơ"],
        correctIndex: 2,
        explanation: "Fructozơ (đường hoa quả) chiếm khoảng 40% trong mật ong rừng, tạo nên vị ngọt cực kỳ đặc trưng và sắc sảo của mật tự nhiên."
      }
    ]
  },
  {
    id: "exam_chem_advanced",
    title: "Chuyên Đề Toàn Diện: Amin, Amino Axit & Kim Loại",
    subjectId: "chemistry",
    durationMinutes: 15,
    difficulty: "Khó",
    participantsCount: 1040,
    questions: [
      {
        id: "c_q4",
        subjectId: "chemistry",
        text: "Sắp xếp tính bazơ của các chất sau theo chiều tăng dần: (1) C6H5NH2 (anilin), (2) NH3, (3) CH3NH2, (4) NaOH.",
        options: ["(1) < (2) < (3) < (4)", "(1) < (3) < (2) < (4)", "(2) < (1) < (3) < (4)", "(4) < (3) < (2) < (1)"],
        correctIndex: 0,
        explanation: "Các gốc đẩy electron như gốc ankyl (-CH3) làm tăng mật độ electron trên nguyên tử N, làm tăng tính bazơ. Gốc hút electron như gốc phenyl (-C6H5) làm giảm tính bazơ. NaOH là bazơ vô cơ mạnh, phân ly hoàn toàn. Do đó thứ tự tăng dần là: C6H5NH2 < NH3 < CH3NH2 < NaOH."
      },
      {
        id: "c_q5",
        subjectId: "chemistry",
        text: "Khi thủy phân hoàn toàn một tripeptit Gly-Ala-Val trong môi trường dung dịch HCl dư, sản phẩm thu được tối sau phản ứng gồm:",
        options: [
          "Glyxin, Alanin, Valin tự do",
          "Muối muối clohidrat của Glyxin, Alanin và Valin",
          "Gly-Ala và muối của Valin",
          "Hỗn hợp este chứa muối của Gly, Ala, Val"
        ],
        correctIndex: 1,
        explanation: "Thủy phân peptit trong môi trường axit HCl dư sẽ thu được muối clohidrat của các amino axit thành phần (Gly.HCl, Ala.HCl, Val.HCl) chứ không dừng lại ở amino axit tự do."
      },
      {
        id: "c_q6",
        subjectId: "chemistry",
        text: "Kim loại nào sau đây có nhiệt độ nóng chảy cao nhất, thường được ứng dụng chế tạo dây tóc bóng đèn điện?",
        options: ["Sắt (Fe)", "Vonfram (W)", "Đồng (Cu)", "Crôm (Cr)"],
        correctIndex: 1,
        explanation: "Vonfram (W) có nhiệt độ nóng chảy cực kỳ cao (3422°C), giữ được độ bền cơ học tốt ở nhiệt độ cao nên được ứng dụng làm dây tóc bóng đèn."
      },
      {
        id: "c_q7",
        subjectId: "chemistry",
        text: "Để bảo vệ vỏ tàu thủy bằng thép (thành phần chính là sắt) khỏi bị ăn mòn trong nước biển, người ta thường gắn những khối kim loại nào vào vỏ tàu?",
        options: ["Đồng (Cu)", "Bạc (Ag)", "Kẽm (Zn)", "Chì (Pb)"],
        correctIndex: 2,
        explanation: "Đây là phương pháp bảo vệ điện hóa (vật hi sinh). Kẽm (Zn) có tính khử mạnh hơn Sắt (Fe) nên đóng vai trò cực âm (anode) và bị ăn mòn điện hóa trước, bảo vệ vỏ thép tàu thủy khỏi bị oxi hóa."
      }
    ]
  }
];

// Danh sách thẻ ghi nhớ (Flashcards) cho mục ôn tập hiệu quả (giống Quizlet)
export const INITIAL_FLASHCARDS: Flashcard[] = [
  // --- TIẾNG ANH ---
  {
    id: "fc_eng_1",
    subjectId: "english",
    front: "Ubiquitous (adj)",
    back: "Có mặt ở khắp nơi, phổ biến rộng rãi",
    example: "Smartphones are becoming increasingly ubiquitous in our daily lives.",
    isMastered: false,
  },
  {
    id: "fc_eng_2",
    subjectId: "english",
    front: "Procrastinate (v)",
    back: "Trì hoãn, chần chừ (thường do lười biếng)",
    example: "Don't procrastinate! Start studying for your crucial exam today.",
    isMastered: false,
  },
  {
    id: "fc_eng_3",
    subjectId: "english",
    front: "Meticulous (adj)",
    back: "Tỉ mỉ, kỹ càng, trau chuốt từng chi tiết",
    example: "The student kept meticulous notes for university entrance math exam.",
    isMastered: true,
  },
  {
    id: "fc_eng_4",
    subjectId: "english",
    front: "Adversity (n)",
    back: "Nghịch cảnh, hoàn cảnh khó khăn gian khổ",
    example: "Success is built on overcomming adversity with courage.",
    isMastered: false,
  },
  {
    id: "fc_eng_5",
    subjectId: "english",
    front: "Redundant (adj)",
    back: "Dư thừa, quá tải, không còn cần thiết",
    example: "The old manual instructions became redundant after the software update.",
    isMastered: false,
  },
  {
    id: "fc_eng_6",
    subjectId: "english",
    front: "Resilient (adj)",
    back: "Kiên cường, có khả năng phục hồi nhanh chóng",
    example: "Though faced with difficult exam questions, she is resilient and kept going.",
    isMastered: true,
  },
  {
    id: "fc_eng_7",
    subjectId: "english",
    front: "Pragmatic (adj)",
    back: "Thực tế, thực dụng, giải quyết vấn đề dựa trên thực tiễn",
    example: "We need to adopt a pragmatic approach to solve this physics problem.",
    isMastered: false,
  },
  {
    id: "fc_eng_8",
    subjectId: "english",
    front: "Benevolent (adj)",
    back: "Nhân từ, rộng lượng, hay làm việc thiện",
    example: "The benevolent teacher offered free exam preparation lessons to everyone.",
    isMastered: false,
  },
  {
    id: "fc_eng_9",
    subjectId: "english",
    front: "Equilibrium (n)",
    back: "Sự cân bằng, trạng thái cân bằng lực/hóa học",
    example: "It's crucial to reach a dynamic equilibrium in our chemical reactions.",
    isMastered: false,
  },

  // --- TOÁN HỌC ---
  {
    id: "fc_math_1",
    subjectId: "math",
    front: "Đạo hàm ln(x)",
    back: "y' = 1/x (với x > 0)",
    example: "Nếu y = ln(2x+1), áp dụng công thức u'/u ta được y' = 2/(2x+1)",
    isMastered: true,
  },
  {
    id: "fc_math_2",
    subjectId: "math",
    front: "Thể tích Khối Cầu",
    back: "V = (4/3) * π * R³",
    example: "Nếu bán kính R = 3cm, V = (4/3) * π * 27 = 36π cm³",
    isMastered: false,
  },
  {
    id: "fc_math_3",
    subjectId: "math",
    front: "Diện tích xung quanh Hình nón",
    back: "S_xq = π * r * l",
    example: "Trong đó: r là bán kính đáy, l là độ dài đường sinh hình nón.",
    isMastered: false,
  },
  {
    id: "fc_math_4",
    subjectId: "math",
    front: "Đạo hàm Hàm số lượng giác cơ bản",
    back: "(sin x)' = cos x và (cos x)' = -sin x",
    example: "Chú ý dấu trừ khi đạo hàm hàm cosin nhé!",
    isMastered: false,
  },
  {
    id: "fc_math_5",
    subjectId: "math",
    front: "Thể tích Khối nón tròn xoay",
    back: "V = (1/3) * π * r² * h",
    example: "Với r là bán kính đáy, h là chiều cao trục của hình nón.",
    isMastered: true,
  },
  {
    id: "fc_math_6",
    subjectId: "math",
    front: "Công thức Tổ hợp chập k của n",
    back: "C(n, k) = n! / (k! * (n-k)!)",
    example: "Dùng để chọn k phần tử ngẫu nhiên từ n phần tử không tính thứ tự.",
    isMastered: false,
  },
  {
    id: "fc_math_7",
    subjectId: "math",
    front: "Phương trình mặt cầu trong không gian Oxyz",
    back: "(x-a)² + (y-b)² + (z-c)² = R²",
    example: "Với tâm I(a, b, c) và bán kính của mặt cầu là R.",
    isMastered: false,
  },
  {
    id: "fc_math_8",
    subjectId: "math",
    front: "Nguyên hàm của phân thức 1/x",
    back: "∫(1/x)dx = ln|x| + C",
    example: "Chú ý phải có dấu giá trị tuyệt đối trong kết quả nhé!",
    isMastered: false,
  },
  {
    id: "fc_math_9",
    subjectId: "math",
    front: "Thể tích khối chóp bất kỳ",
    back: "V = (1/3) * S_đáy * h",
    example: "Với S_đáy là diện tích đa giác đáy, h là chiều cao từ đỉnh tới đáy.",
    isMastered: false,
  },

  // --- VẬT LÝ ---
  {
    id: "fc_phy_1",
    subjectId: "physics",
    front: "Tần số góc con lắc đơn",
    back: "ω = √(g/l)",
    example: "Mẹo nhớ: 'g/l' - Giỏi Lên. Trong đó g là gia tốc trọng trường, l là chiều dài dây.",
    isMastered: false,
  },
  {
    id: "fc_phy_2",
    subjectId: "physics",
    front: "Hệ số công suất đoạn RLC",
    back: "cos(φ) = R / Z",
    example: "Với R là điện trở thuần, Z là tổng trở của đoạn mạch xoay chiều RLC.",
    isMastered: false,
  },
  {
    id: "fc_phy_3",
    subjectId: "physics",
    front: "Tần số góc con lắc lò xo",
    back: "ω = √(k/m)",
    example: "Mẹo nhớ: 'k/m' - Không Mỏi. Trong đó k là độ cứng (N/m), m là khối lượng (kg).",
    isMastered: true,
  },
  {
    id: "fc_phy_4",
    subjectId: "physics",
    front: "Chu kỳ T liên hệ tần số f",
    back: "T = 1/f = 2π / ω",
    example: "T tính bằng giây (s), f tính bằng Hertz (Hz), ω tính bằng rad/s.",
    isMastered: false,
  },
  {
    id: "fc_phy_5",
    subjectId: "physics",
    front: "Quang phổ liên tục",
    back: "Chỉ phụ thuộc nhiệt độ của nguồn sáng phát ra",
    example: "Không phụ thuộc vào bản chất thành phần hóa học của nguồn sáng.",
    isMastered: false,
  },
  {
    id: "fc_phy_6",
    subjectId: "physics",
    front: "Công thức tính Vận tốc truyền sóng",
    back: "v = λ * f = λ / T",
    example: "Với λ là bước sóng (m), f là tần số (Hz), T là chu kỳ truyền sóng (s).",
    isMastered: false,
  },
  {
    id: "fc_phy_7",
    subjectId: "physics",
    front: "Cường độ dòng điện cực đại trong mạch RLC",
    back: "I_0 = U_0 / Z",
    example: "Với U_0 là điện áp cực đại, Z là tổng trở toàn mạch.",
    isMastered: false,
  },
  {
    id: "fc_phy_8",
    subjectId: "physics",
    front: "Năng lượng của một photon ánh sáng",
    back: "E = h * f = h * c / λ",
    example: "Với h là hằng số Planck, c là vận tốc ánh sáng, λ là bước sóng photon.",
    isMastered: false,
  },

  // --- HÓA HỌC ---
  {
    id: "fc_chem_1",
    subjectId: "chemistry",
    front: "Phản ứng Tráng Bạc Glucozo",
    back: "1 Glucozo (C6H12O6) sinh ra 2 Ag kết tủa",
    example: "Dùng để phân biệt Glucozo với Saccarozo (Saccarozo không tráng bạc trực tiếp).",
    isMastered: false,
  },
  {
    id: "fc_chem_2",
    subjectId: "chemistry",
    front: "Phản ứng xà phòng hóa este tiêu biểu",
    back: "Este + NaOH -> Muối Natri (Xà phòng) + Ancol tương ứng",
    example: "Phản ứng xảy ra một chiều dưới xúc tác nhiệt độ.",
    isMastered: true,
  },
  {
    id: "fc_chem_3",
    subjectId: "chemistry",
    front: "Độ điện ly và pH thu được",
    back: "pH = -log[H+]",
    example: "Dung dịch trung tính có pH = 7, dung dịch axit pH < 7, bazơ pH > 7.",
    isMastered: false,
  },
  {
    id: "fc_chem_4",
    subjectId: "chemistry",
    front: "Hợp chất muối Natri khi đốt cháy",
    back: "Cho ngọn lửa có màu vàng đặc trưng",
    example: "Thử nghiệm ngọn lửa nhanh để phát hiện sự hiện diện của muối cation Na+.",
    isMastered: false,
  },
  {
    id: "fc_chem_5",
    subjectId: "chemistry",
    front: "Tính chất đặc trưng của amin bậc 1",
    back: "Tác dụng với HNO2 giải phóng khí N2 ở nhiệt độ thường",
    example: "Phản ứng dùng để định lượng hoặc phân biệt amin bậc 1 với các amin khác.",
    isMastered: false,
  },
  {
    id: "fc_chem_6",
    subjectId: "chemistry",
    front: "Anilin phản ứng với nước Brom",
    back: "Tạo thành chất kết tủa màu trắng đặc trưng",
    example: "Thấy đổi màu dung dịch brom sang tủa trắng lập tức ở nhiệt độ phòng.",
    isMastered: false,
  },
  {
    id: "fc_chem_7",
    subjectId: "chemistry",
    front: "Sản phẩm thủy phân Saccarozo",
    back: "Thu được 1 phân tử Glucozo và 1 phân tử Fructozo",
    example: "Phản ứng thủy phân bằng dung dịch axit loãng đun nóng.",
    isMastered: false,
  },
];

// Dữ liệu người dùng mặc định (State khởi đầu của học sinh)
export const DEFAULT_USER_STATS: UserStats = {
  fullName: "Nguyễn Minh Đức",
  targetUniversity: "Đại học Bách Khoa Hà Nội (HUST)",
  targetScore: 27.5,
  currentStreak: 5, // 5 ngày học liên tục
  gems: 420, // điểm kim cương/kinh nghiệm
  stars: 10, // ⭐ Số sao tích điểm để dùng gợi ý trong game
  dailyGoalMinutes: 30, // 30 phút một ngày
  todayMinutesStudied: 18, // Đã học được 18 phút hôm nay
  subjectProgress: {
    math: 40,
    english: 50,
    physics: 33,
    chemistry: 0,
  },
};
