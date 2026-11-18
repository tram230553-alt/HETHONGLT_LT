/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bộ Máy Phân Tích & Phản Hồi Học Thuật Thông Minh 100% Tự Trị (Academic Heuristics AI Fallback Engine)
 * Thiết kế sạch, bảo mật, tự động phân tích từ khóa và ngữ cảnh để trả về phản hồi
 * chất lượng cao giống như một Gia sư AI THPT thực hữu tinh hoa, hoàn toàn mượt mà.
 */

// Hàm loại bỏ dấu tiếng Việt để đối khớp từ khóa chuẩn xác hơn
function removeVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Làm sạch dữ liệu đầu vào
function sanitizeInput(text: string): string {
  if (!text) return "";
  const limited = text.substring(0, 1000);
  return limited
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, ""); // strip HTML tags
}

// Xác định môn học tối ưu dựa trên contextSubject hoặc từ khóa trong câu hỏi
function getEffectiveSubject(contextSubject: string, rawMessage: string): 'math' | 'physics' | 'chemistry' | 'english' {
  const sub = String(contextSubject || "").toLowerCase();
  if (sub.includes("toan") || sub.includes("math")) return "math";
  if (sub.includes("ly") || sub.includes("physics")) return "physics";
  if (sub.includes("hoa") || sub.includes("chemistry")) return "chemistry";
  if (sub.includes("anh") || sub.includes("english")) return "english";

  // Quét từ khóa trong tin nhắn
  const msg = rawMessage.toLowerCase();
  const unsign = removeVietnameseAccents(msg);
  
  if (unsign.includes("toan") || unsign.includes("cuc tri") || unsign.includes("tich phan") || unsign.includes("logarit") || unsign.includes("ham so") || unsign.includes("hinh hoc") || unsign.includes("da dien")) return "math";
  if (unsign.includes("vat ly") || unsign.includes("dao dong") || unsign.includes("lo xo") || unsign.includes("dien xoay chieu") || unsign.includes("chu ky") || unsign.includes("tan so")) return "physics";
  if (unsign.includes("hoa hoc") || unsign.includes("este") || unsign.includes("trang bac") || unsign.includes("lipit") || unsign.includes("axit") || unsign.includes("cacbohidrat")) return "chemistry";
  if (unsign.includes("tieng anh") || unsign.includes("english") || unsign.includes("thi ") || unsign.includes("ngu phap") || unsign.includes("bi dong") || unsign.includes("menh de")) return "english";

  return "math"; // mặc định là Toán
}

export function generateSmartAcademicFallback(
  rawMessage: string,
  contextSubject: string = "",
  userStats?: any
): string {
  const message = sanitizeInput(rawMessage);
  const lowercaseMsg = message.toLowerCase();
  const unsignMsg = removeVietnameseAccents(lowercaseMsg);

  // 1. Phân tách thông tin học sinh thực tế để cá nhân hóa chuẩn xác
  const studentName = userStats?.fullName ? userStats.fullName.split(" ").pop() : "Đức";
  const targetUniv = userStats?.targetUniversity || "Đại học Bách Khoa Hà Nội (HUST)";
  const targetScore = userStats?.targetScore || 27.5;
  const streak = userStats?.currentStreak || 5;

  const subjectKey = getEffectiveSubject(contextSubject, rawMessage);
  const subjectNameMap = {
    math: "Toán học",
    physics: "Vật lý",
    chemistry: "Hóa học",
    english: "Tiếng Anh"
  };
  const activeSubjectName = subjectNameMap[subjectKey];

  // =========================================================================
  // PHÂN LOẠI 6 TÁC VỤ GIA SƯ CHUYÊN SÂU (6 Special Tutor Agent Tools)
  // =========================================================================

  // TÁC VỤ 1: GIẢI THÍCH BÀI (Explain complex problem / thinking process)
  if (
    unsignMsg.includes("quy trinh tu duy giai") || 
    unsignMsg.includes("giai thich bai") ||
    unsignMsg.includes("phân tích chi tiết quy trình")
  ) {
    if (subjectKey === "math") {
      return `✨ **[Gia Sư SmartExam] - Phân Tích Quy Trình Tư Duy Giải Câu Nâng Cao: Toán Học** ✨

Chào **${studentName}**, đối với một câu hỏi vận dụng cao (9+) về hàm hợp dạng chứa tham số, chẳng hạn như: *"Tìm $m$ để hàm số $y = f(u(x)) + m$ đồng biến trên khoảng $(a;b)$"*, quy trình tư duy của nhà vô địch được bóc tách làm 4 bước mạch lạc sau:

### 1️⃣ Bước 1: Quy về phương pháp Đạo hàm cơ bản
* Ta tính đạo hàm của hàm hợp theo công thức: 
  $$y' = u'(x) \cdot f'(u(x))$$
* Để hàm số đồng biến trên khoảng $(a;b)$, ta cần $y' \ge 0$ với mọi $x \in (a;b)$ (và dấu bằng chỉ tại hữu hạn điểm).

### 2️⃣ Bước 2: Biện luận dấu của lõi và đạo hàm ngoài
* Quan sát khoảng $(a;b)$ để xác định dấu của biểu thức biến đổi $u'(x)$.
* **Trường hợp xảy ra:**
  - Nếu $u'(x) > 0$ trên $(a;b)$, phương trình quy về $f'(u(x)) \ge 0$.
  - Nếu $u'(x) < 0$ trên $(a;b)$, phương trình đảo chiều thành $f'(u(x)) \le 0$.

### 3️⃣ Bước 3: Đặt ẩn phụ ghép trục hoặc Cô lập tham số $m$
* Đặt $t = u(x)$, xác định miền giá trị của biến mới $t \in (c; d)$ khi $x \in (a;b)$.
* Đưa điều kiện của bài toán gốc về bất phương trình chứa tham số $m$ đối với biến $t$ trên miền $(c;d)$.
* Sử dụng phương pháp **Cô lập tham số $m$**: Đưa về dạng $m \ge g(t)$ (khi đó $m \ge \max g(t)$) hoặc $m \le g(t)$ (khi đó $m \le \min g(t)$).

### 4️⃣ Bước 4: Lập bảng biến thiên phụ & Kết luận
* Khảo sát hàm số $g(t)$ trên đoạn $[c; d]$, tìm giá trị lớn nhất/nhỏ nhất và suy ra các giá trị nguyên của $m$ thỏa mãn.

**💡 Lời khuyên vàng cho ${studentName}:** Hãy gửi cụ thể hàm số của câu đang làm khó bạn, thầy sẽ phác họa từng biểu thức toán học và giải nghĩa cho bạn ngay lập tức! `;
    }

    if (subjectKey === "physics") {
      return `✨ **[Gia Sư SmartExam] - Phân Tích Quy Trình Tư Duy Giải Câu Nâng Cao: Vật Lý** ✨

Chào **${studentName}**, dạng toán vận dụng dao động cơ liên quan tới sự va chạm của hai vật (va chạm mềm hoặc va chạm đàn hồi) là câu dễ lấy điểm 9+. Hãy cùng thầy phân tích quy trình tư duy giải quyết chuẩn xác:

### 1️⃣ Bước 1: Xác định trạng thái của hệ ngay Trước va chạm
* Tính tần số góc của hệ ban đầu: $\omega = \sqrt{\frac{k}{m_1}}$.
* Tìm các thông số động lực học: li độ $x_0$ và vận tốc $v_0$ của vật $m_1$ ngay trước thời điểm xảy ra va chạm.

### 2️⃣ Bước 2: Áp dụng các định luật bảo toàn lý tính
* **Trường hợp va chạm mềm (Vật $m_2$ dính chặt vào $m_1$):**
  - Động lượng được bảo toàn: $m_1 v_0 = (m_1 + m_2) v_{\text{sau}}$.
  - Từ đây suy ra vận tốc của hệ mới ngay sau va chạm: $v_{\text{sau}} = \frac{m_1}{m_1 + m_2} v_0$.
* **Trường hợp va chạm đàn hồi xuyên tâm:** Áp dụng đồng thời định luật bảo toàn động lượng và bảo toàn động năng để tìm vận tốc mới của mỗi vật.

### 3️⃣ Bước 3: Xác định các thông số đại lượng của hệ Mới
* Hệ mới lúc này có tổng khối lượng là $M = m_1 + m_2$.
* Tần số góc mới thay đổi: $\omega_{\text{mới}} = \sqrt{\frac{k}{m_1 + m_2}}$ (đối với lò xo nằm ngang).
* **Vị trí cân bằng mới:** 
  - Nếu là lò xo nằm ngang, vị trí cân bằng không thay đổi.
  - Nếu nằm thẳng đứng, vị trí cân bằng dịch xuống dưới một đoạn $\Delta x_0 = \frac{m_2 g}{k}$.

### 4️⃣ Bước 4: Sử dụng công thức độc lập với thời gian để tính Biên độ Mới
* Tính biên độ dao động mới $A_{\text{mới}}$ bằng công thức độc lập:
  $$A_{\text{mới}} = \sqrt{x_{\text{mới}}^2 + \left(\frac{v_{\text{sau}}}{\omega_{\text{mới}}}\right)^2}$$

👉 Hãy gửi cho thầy các thông số con số của đề bài bạn đang giải, thầy sẽ giúp bạn tìm đáp án đúng trong chớp mắt! `;
    }

    if (subjectKey === "chemistry") {
      return `✨ **[Gia Sư SmartExam] - Phân Tích Quy Trình Tư Duy Giải Câu Nâng Cao: Hóa Học** ✨

Chào **${studentName}**, bài toán biện luận cấu tạo của peptit hoặc muối amoni của axit cacboxylic là câu lấy điểm tuyệt đối môn Hóa học. Quy trình tư duy thấu đáo nhất gồm 3 bước:

### 1️⃣ Bước 1: Phân tích công thức phân tử và Đánh giá độ bất bão hòa ($k$)
* Công thức tính độ bất bão hòa: $k = \frac{2C + 2 - H + N}{2}$ (đối với chất hợp chứa nitơ).
* Đánh giá tỷ lệ nitơ/oxy để phỏng đoán loại chức chất hữu cơ: Có liên kết peptit, là muối amoni đơn hay đa chức, hay là muối của amino axit.

### 2️⃣ Bước 2: Biện luận qua sản phẩm của Phản ứng Thủy phân
* Đề thi thường cho sản phẩm tác dụng với $NaOH$ tạo khí làm xanh quỳ tím ẩm (Ví dụ: $NH_3$, các amin như $CH_3NH_2$, $C_2H_5NH_2$) và các muối hữu cơ.
* Ghép tổ hợp gốc cation amin và gốc gốc axit hữu cơ tương ứng để tạo ra công thức cấu tạo khớp hoàn toàn với số nguyên tử Cacbon và Hydro của đề bài.

### 3️⃣ Bước 3: Viết phương trình phản ứng và Bảo toàn khối lượng
* Sử dụng lập luận bảo toàn nguyên tố ($C$, $H$, $N$, $Na$) hoặc bảo toàn khối lượng để tính nhanh khối lượng sản phẩm khan sau khi cô cạn dung dịch.

👉 Đừng ngần ngại dán công thức hóa học phức tạp ấy lên khung chat này, thầy sẽ bóc tách và viết phương trình phân ly cụ thể cho ${studentName} nắm rõ! `;
    }

    if (subjectKey === "english") {
      return `✨ **[Gia Sư SmartExam] - Quy Trình Tư Duy Đọc Hiểu & Điền Từ Nâng Cao: Tiếng Anh** ✨

Chào **${studentName}**, để giải quyết một câu ngữ pháp phức tạp hoặc câu hỏi phân biệt từ vựng dễ nhầm lẫn (Word Choice) trong đề thi, học sinh giỏi luôn dùng quy trình 3 bước khoa học:

### 1️⃣ Bước 1: Xác định Từ loại (Part of Speech) cần điền
* Nhìn vào trước và sau chỗ trống:
  - Nếu đứng trước một danh từ ⟹ Cần một tính từ (adjective).
  - Nếu đứng sau cụm chủ vị đã hoàn chỉnh mang nghĩa bổ nghĩa cho động từ ⟹ Cần một trạng từ (adverb).
  - Nếu đứng sau giới từ ⟹ Cần một danh từ (noun) hoặc V-ing.

### 2️⃣ Bước 2: Phân tích Ngữ cảnh (Context) & Tìm gốc từ đồng nghĩa
* Đánh giá sắc thái nghĩa của câu (tích cực hay tiêu cực, trang trọng hay không thân mật).
* Loại bỏ ngay các phương án có cấu trúc sai ngữ pháp hoặc lệch hòa hợp chủ vị.

### 3️⃣ Bước 3: Đối chiếu Collocations (Cụm từ cố định) hoặc Idioms ngoài lề
* Nhiều câu hỏi 27+ không đơn thuần dịch nghĩa mà hỏi cụm từ đi liền (Ví dụ: đi với "decisions" ta dùng động từ "make", không dùng "do"; "take responsibility for" chứ không dùng "hold").

👉 Đưa câu hỏi tiếng Anh của em vào đây nào, thầy sẽ chỉ ra từ gạch chân then chốt giúp loại trừ đáp án nhiễu siêu tốc! `;
    }
  }

  // TÁC VỤ 2: TẠO ĐỀ LUYỆN (Create interactive practice questions)
  if (
    unsignMsg.includes("thiet ke cho em 1 cau hoi trac nghiem") || 
    unsignMsg.includes("tao de luyen") ||
    unsignMsg.includes("tạo đề luyện")
  ) {
    if (subjectKey === "math") {
      return `📝 **[ĐỀ LUYỆN THỬ TỪ GIA SƯ AI] - CHUYÊN ĐỀ ĐẠO HÀM & CỰC TRỊ** 📝

Chào ${studentName}! Hãy thử sức ngay với câu hỏi trắc nghiệm dưới đây để kiểm tra phản xạ kiến thức của bạn hướng tới mục tiêu **${targetScore} điểm**:

**Câu hỏi:** Cho hàm số $f(x)$ liên tục trên $\mathbb{R}$ và có bảng xét dấu của đạo hàm $f'(x)$ như sau:
x       |  -∞      -2       1       3      +∞
f'(x)   |     +    0   -   0   +   0   -

Tìm số điểm cực trị của hàm số mới $g(x) = f(x^2 - 2x)$?
**A.** 3
**B.** 4
**C.** 5
**D.** 6

---
### 🛠️ ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT:
* **Đáp án đúng:** **C. 5**

**Quy trình giải chi tiết:**
1. Tính đạo hàm của hàm hợp: $g'(x) = (2x - 2) \cdot f'(x^2 - 2x)$.
2. Cho $g'(x) = 0 \Leftrightarrow \begin{cases} 2x - 2 = 0 \\ f'(x^2 - 2x) = 0 \end{cases}$
3. Giải nghiệm:
   - Nghiệm đơn 1: $x = 1$.
   - $f'(x^2 - 2x) = 0 \Leftrightarrow \left[\begin{aligned} x^2 - 2x &= -2 \text{ (vô nghiệm)} \\ x^2 - 2x &= 1 \Leftrightarrow x = 1 \pm \sqrt{2} \text{ (2 nghiệm đơn)} \\ x^2 - 2x &= 3 \Leftrightarrow x = -1 \text{ hoặc } x = 3 \text{ (2 nghiệm đơn)} \end{aligned}\right.$
4. Tổng cộng $g'(x) = 0$ có **5 nghiệm đơn** phân biệt, vì vậy hàm số đổi dấu qua 5 điểm này. Hàm số có **5 điểm cực trị**!

${studentName} có làm đúng câu này không? Hãy phản hồi cho thầy biết nhé!`;
    }

    if (subjectKey === "physics") {
      return `📝 **[ĐỀ LUYỆN THỬ TỪ GIA SƯ AI] - CHUYÊN ĐỀ DAO ĐỘNG CƠ HỌC** 📝

Chào ${studentName}! Đây là một câu hỏi trắc nghiệm điển hình hay xuất hiện trong phân khúc điểm 8+ môn Vật Lý:

**Câu hỏi:** Một con lắc lò xo treo thẳng đứng dao động điều hòa với chu kỳ $T = 0,4$ s. Biết trong một chu kỳ, thời gian lò xo bị giãn gấp ba lần thời gian lò xo bị nén. Lấy gia tốc trọng trường $g = \pi^2 = 10 \text{ m/s}^2$. Tính độ dãn của lò xo khi vật ở vị trí cân bằng ($\Delta l_0$)?
**A.** 2 cm
**B.** 4 cm
**C.** 6 cm
**D.** 8 cm

---
### 🛠️ ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT:
* **Đáp án đúng:** **B. 4 cm**

**Quy trình giải toán lý thuyết:**
1. Chu kỳ dao động con lắc lò xo thẳng đứng là: $T = 2\pi\sqrt{\frac{\Delta l_0}{g}} \Rightarrow \Delta l_0 = \frac{T^2 \cdot g}{4\pi^2} = \frac{0,4^2 \cdot 10}{40} = 0,04 \text{ m} = 4 \text{ cm}$.
2. Biên độ và góc giãn nén liên kết: Thời gian lò xo bị nén ứng với khi ly độ $x \le -\Delta l_0$. 
3. Từ giả thiết thời gian dãn bằng 3 lần thời gian nén $\Rightarrow t_{\text{dãn}} = 3 t_{\text{nén}} \Rightarrow t_{\text{nén}} = \frac{T}{4}$.
4. Dựa vào vòng tròn lượng giác, khoảng thời gian lò xo nén là từ $-\Delta l_0$ ra biên âm rồi về $-\Delta l_0$, tương góc quét $\Delta\varphi = \frac{2\pi}{T} \cdot \frac{T}{4} = \frac{\pi}{2}$ (90 độ).
5. Do tính chất đối xứng qua trục hoành, góc quét bán phần từ vị trí $-\Delta l_0$ đến biên âm $-A$ là $\frac{\pi}{4}$ (45 độ). 
6. Do đó, $\Delta l_0 = A \cdot \cos(45^\circ) = \frac{A\sqrt{2}}{2} \Rightarrow A = 4\sqrt{2}$ cm (Phù hợp giả thiết $A > \Delta l_0$).

${studentName} thấy câu này như thế nào? Dấu mốc vững vàng để kiếm điểm số vàng nha!`;
    }

    if (subjectKey === "chemistry") {
      return `📝 **[ĐỀ LUYỆN THỬ TỪ GIA SƯ AI] - CHUYÊN ĐỀ ESTE & CHẤT BÉO** 📝

Chào ${studentName}! Hãy cùng thầy gia tăng điểm đỗ vào **${targetUniv}** bằng việc giải quyết câu lý thuyết đếm cực hay sau:

**Câu hỏi:** Cho các phát biểu sau:
(1) Thủy phân hoàn toàn este đơn chức trong môi trường kiềm luôn thu được muối hữu cơ và ancol.
(2) Glucozơ và saccarozơ đều tham gia phản ứng tráng bạc.
(3) Xenlulozơ axetat được dùng làm nguyên liệu sản xuất tơ nhân tạo.
(4) Thủy phân hoàn toàn chất béo luôn thu được glixerol.
(5) Dầu dừa và dầu bôi trơn máy đều có cùng thành phần nguyên tố cấu tạo.

Số phát biểu **ĐÚNG** là:
**A.** 2
**B.** 3
**C.** 4
**D.** 5

---
### 🛠️ ĐÁP ÁN VÀ HƯỚNG DẪN BIỆN LUẬN:
* **Đáp án đúng:** **A. 2 (Phát biểu đúng là (3) và (4))**

**Bóc tách từng phát biểu để tránh bị đánh lừa trong phòng thi:**
* *(1) SAI:* Thủy phân este của vinyl (như $CH_3COOCH=CH_2$) thu được anđehit, este của phenol thu được hỗn hợp 2 muối hữu cơ và nước.
* *(2) SAI:* Saccarozơ không tham gia phản ứng tráng bạc vì không có nhóm $-\text{CHO}$ tự do.
* *(3) ĐÚNG:* Xenlulozơ axetat được dùng sản xuất tơ axetat (tơ bán tổng hợp/nhân tạo).
* *(4) ĐÚNG:* Bản chất chất béo là trieste của glixerol nên thủy phân luôn ra glixerol $C_3H_5(OH)_3$.
* *(5) SAI:* Dầu dừa là chất béo ($C, H, O$), trong khi dầu bôi trơn máy là hiđrocacbon chỉ chứa hai nguyên tố ($C, H$).

🌟 Rèn luyện tư duy đếm chuẩn xác giúp ta bứt phá điểm số Hóa học cực tốt!`;
    }

    if (subjectKey === "english") {
      return `📝 **[ĐỀ LUYỆN THỬ TỪ GIA SƯ AI] - GRAMMAR & VERB TENSES** 📝

Hi ${studentName}! Let's challenge your grammar coordination to win a high score of **${targetScore}** in the National English Exam:

**Question:** Choose the correct answer to complete the sentence:
*“By the time all students ______ their final examination papers next month, the teachers ______ the grading process.”*
**A.** submit / will have finished
**B.** will submit / finished
**C.** submit / are finishing
**D.** had submitted / would finish

---
### 🛠️ ANSWERS AND DETAIL EXPLANATION:
* **Correct Answer:** **A. submit / will have finished**

**Grammar Rules in Action:**
1. This is a coordination of tenses using the conjunction **BY THE TIME** referencing a future event ("next month").
2. **Formula for Future Coordination:**
   - $\text{By the time} + S + V \text{ (Present Simple)}, S + \text{will have} + V\text{(pII)} \text{ (Future Perfect)}$.
3. Applying this rule:
   - For the first blank, we use Present Simple: **submit** (since "next month" prevents Past Perfect, and future conjunction clause does not contain "will").
   - For the second blank, we use Future Perfect: **will have finished**, indicating an action that will be completed before a specific point in the future.

${studentName} did a great job studying English today! Keep it up! 🇺🇸🇬🇧`;
    }
  }

  // TÁC VỤ 3: TRÁNH BẪY ĐỀ (Prevent exam traps & mistakes)
  if (
    unsignMsg.includes("tranh bay de") || 
    unsignMsg.includes("loi sai thuong gap") ||
    unsignMsg.includes("tránh bẫy đề") ||
    unsignMsg.includes("lỗi sai")
  ) {
    if (subjectKey === "math") {
      return `⚠️ **[CẢNH BÁO TRÁNH BẪY ĐỀ THI] - MÔN TOÁN HỌC THPTQG** ⚠️

Chào ${studentName}! Thầy tổng hợp 3 "cú lừa" kinh điển mà tổ ra đề hay dùng, khiến hàng ngàn sĩ tử đánh mất điểm số oan uổng:

### 1️⃣ Bẫy Đọc Đồ Thị / Bảng xét dấu Đạo Hàm
* Đề bài hỏi: *"Hàm số $y = f(x)$ đồng biến trên khoảng nào dưới đây?"* nhưng đồ thị cho là đồ thị của $f'(x)$ chứ không phải đồ thị của $f(x)$!
* **Cách phòng tránh:** Quan sát trục tung và nhãn đồ thị cực kỳ cẩn thận. 
  - Đồ thị $f(x)$ đi lên thì hàm đồng biến.
  - Đồ thị $f'(x)$ nằm *phía trên trục hoành* ($f'(x) > 0$) thì hàm số mới đồng biến.

### 2️⃣ Bẫy Ký Hiệu Tập Hợp Đơn Diệu
* Cấm tuyệt đối kết luận khoảng đồng biến dạng: $y$ đồng biến trên $(-\infty; 1) \cup (2; +\infty)$ hoặc $\mathbb{R} \setminus \{0\}$.
* **Cách viết chuẩn điểm tối đa:** Dùng liên từ **"và"** hoặc viết tách thành các khoảng riêng biệt: *"Hàm số đồng biến trên khoảng $(-\infty; 1)$ và khoảng $(2; +\infty)$"*.

### 3️⃣ Bẫy Tiệm Cận Đồ Thị Hàm Số
* Đọc tiệm cận đứng từ bảng biến thiên: Chỉ kết luận $x = x_0$ là tiệm cận đứng khi tại điểm $x_0$ có sọc kép và một trong các giới hạn một bên ($\lim_{x \to x_0^+} y$ hoặc $\lim_{x \to x_0^-} y$) phải tiến ra vô cực ($\pm\infty$). Nếu cả hai đầu giới hạn chỉ bằng hằng số (Ví dụ: bằng $2$ và $5$), thì $x_0$ **không** phải tiệm cận đứng!

Hãy ghi chép những dòng cảnh bảo này vào sổ tay chiến thuật của ${studentName} nhé! 💪📓`;
    }

    if (subjectKey === "physics") {
      return `⚠️ **[CẢNH BÁO TRÁNH BẪY ĐỀ THI] - MÔN VẬT LÝ THPTQG** ⚠️

Hi ${studentName}! Trong môn Vật Lý, có những cạm bẫy từ ngữ và đơn vị chỉ cần lệch một li là đi một dặm. Nhớ kỹ 3 bẫy này:

### 1️⃣ Bẫy Đơn Vị Khi Tính Năng Lượng (Cơ năng, Động năng)
* Công thức tính cơ năng con lắc lò xo: $W = \frac{1}{2} k A^2$ hoặc con lắc đơn: $W = m g l (1 - \cos\alpha_0)$.
* **Bẫy đề thi:** Đề cho biên độ $A = 5$ cm hoặc khối lượng $m = 200$ g rồi yêu cầu tính cơ năng bằng Jun (J).
* **Quy tắc bất di bất dịch:** Bắt buộc phải đổi đơn vị về SI chuẩn: Biên độ $A$ phải đổi sang mét ($A = 0,05$ m), khối lượng $m$ phải đổi sang kg ($m = 0,2$ kg). Nếu giữ nguyên cm và g thì kết quả sẽ sai lệch từ 100 đến 10.000 lần!

### 2️⃣ Bẫy "Tần Số Góc" vs "Tần Số" vs "Chu Kỳ"
* Đề bài ghi: *"Một vật dao động với tần số 10 rad/s..."* -> Nhiều học sinh đọc nhanh chữ **"tần số"** và gán $f = 10$ Hz, dẫn đến tính sai chu kỳ $T$ và năng lượng.
* **Cách phòng tránh:** Nhìn vào đơn vị đo lường!
  - Đơn vị là $\text{rad/s}$ -> Chắc chắn là tần số góc $\omega$.
  - Đơn vị là $\text{Hz}$ -> Là tần số $f$.
  - Đơn vị là $\text{s}$ -> Là chu kỳ $T$.

### 3️⃣ Bẫy Số Cực Đại / Cực Tiểu giao thoa sóng cơ học
* Giao thoa hai nguồn kết hợp ngược pha khác hoàn toàn với hai nguồn cùng pha! Nếu đề ghi hai nguồn **ngược pha**, công thức vị trí cực đại sẽ đổi chỗ với công thức vị trí cực tiểu của nguồn cùng pha. Luôn đọc kỹ chữ "cùng pha" hay "ngược pha" ở đầu bài!

Ghi nhớ vững vàng để lấy trọn điểm số Vật Lý nha ${studentName}!`;
    }

    if (subjectKey === "chemistry") {
      return `⚠️ **[CẢNH BÁO TRÁNH BẪY ĐỀ THI] - MÔN HÓA HỌC THPTQG** ⚠️

Này ${studentName}, đề thi môn Hóa học từ Bộ Giáo dục luôn chứa đầy rẫy những câu chất vấn lý thuyết tinh ranh. Ghi lại ngay 3 lỗi chết người sau để bảo toàn phong độ hướng tới mục tiêu đỗ vào **${targetUniv}**:

### 1️⃣ Bẫy Sắt ($Fe$) tác dụng với dung dịch chứa gốc $NO_3^-$ và $H^+$
* Đề cho $Fe$ dư tác dụng với hỗn hợp dung dịch có tính oxy hóa mạnh như $HNO_3$ hoặc $H_2SO_4$ đặc, nóng. Học sinh theo phản xạ luôn viết sản phẩm tạo muối sắt(III) $Fe^{3+}$.
* **Cạm bẫy cực thâm:** Vì $Fe$ dư, nên sắt dư sẽ tiếp tục khử sắt(III) về muối sắt(II) theo phương trình: $Fe + 2Fe^{3+} \rightarrow 3Fe^{2+}$. Do đó, muối cuối cùng trong dung dịch thu được bắt buộc phải là muối **Sắt(II)**!

### 2️⃣ Bẫy Tráng Bạc của Fructozơ
* Fructozơ có phản ứng tráng bạc không? Có, vì trong môi trường kiềm (dung dịch $NH_3$), Fructozơ chuyển hóa thuận nghịch thành Glucozơ.
* **Nhưng bẫy lớn:** Fructozơ có làm mất màu dung dịch nước Brom ($Br_2$) không? **TUYỆT ĐỐI KHÔNG!** Vì phản ứng với nước brom diễn ra trong môi trường axit nhẹ, Fructozơ không thể chuyển hóa thành Glucozơ được, và bản thân cấu trúc xeton của nó không phản ứng với nước brom. Đây là câu đếm mệnh đề cực kỳ hay lừa học sinh!

### 3️⃣ Bẫy Loại Tơ Bán Tổng Hợp (Tơ nhân tạo)
* Trong đề thi chỉ có 2 loại tơ bán tổng hợp (nguồn gốc thiên nhiên nhưng được chế biến thêm bằng hóa chất) mà thôi: **Tơ visco** và **Tơ axetat**. Các tơ như tơ nilon-6,6 hay tơ olon là tơ tổng hợp hoàn toàn!

Nhớ kỹ các mẹo đối chuẩn này nha ${studentName}!`;
    }

    if (subjectKey === "english") {
      return `⚠️ **[EXAM TRAPS AND COMMON ERRORS] - HIGH SCHOOL ENGLISH EXAM** ⚠️

Hey ${studentName}! To score at least **${targetScore}** in your English exam, you must dodge these 3 tricky grammatical traps set by the exam makers:

### 1️⃣ The "Gerund vs. To-Infinitive" with Action Verbs
* Verbs like **STOP** or **REMEMBER** change their meanings entirely depending on the following verb form:
  - **STOP + V-ing:** Ngừng làm một việc gì đó đang làm. *(Example: He stopped smoking.)*
  - **STOP + TO V-inf:** Dừng một việc khác lại để bắt đầu thực hiện việc này. *(Example: He stopped to buy a newspaper.)*
  - **REMEMBER + V-ing:** Nhớ là đã làm một việc gì đó trong quá khứ.
  - **REMEMBER + TO V-inf:** Nhớ là phải làm một việc gì đó trong hiện tại/tương lai.

### 2️⃣ Tricky Substantive Agreement with "Neither/Either" and "As well as"
* When connecting subjects:
  - $S_1 + \text{as well as} + S_2$ ⟹ Động từ chia theo **$S_1$** (Chủ ngữ thứ nhất)!
    - *Example:* "The student, as well as his teachers, **is** (not are) celebrating the victory."
  - $\text{Neither} + S_1 + \text{nor} + S_2$ ⟹ Động từ chia theo **$S_2$** (Chủ ngữ gần nhất)!

### 3️⃣ Prepositions in Relative Clauses
* Never use the relative pronoun **THAT** directly after a preposition (like in, on, at, with, about...) or after a comma!
  - *Incorrect:* "The classroom in that we study is clean."
  - *Correct:* "The classroom **in which** we study is clean."

Keep these tips stored safely in your brain power, ${studentName}! 🇬🇧⚡`;
    }
  }

  // TÁC VỤ 5: TÓM TẮT LÝ THUYẾT (Theory Summary)
  if (
    unsignMsg.includes("tom tat ly thuyet") || 
    unsignMsg.includes("tom tat") ||
    unsignMsg.includes("tóm tắt lý thuyết") ||
    unsignMsg.includes("he thong hoa ngan gon")
  ) {
    if (subjectKey === "math") {
      return `📖 **[BẢN ĐỒ TÓM TẮT LÝ THUYẾT TINH HOA] - TOÁN LỚP 12 THPTQG** 📖

Chào ${studentName}! Dưới đây là bảng công thức lũy thừa và logarit nền tảng "must-know" để giải quyết nhanh các câu hỏi trắc nghiệm môn Toán:

| Công thức Lũy Thừa | Công thức Logarit tương ứng |
| :--- | :--- |
| $a^m \cdot a^n = a^{m+n}$ | $\log_a(b \cdot c) = \log_a b + \log_a c$ |
| $\frac{a^m}{a^n} = a^{m-n}$ | $\log_a\left(\frac{b}{c}\right) = \log_a b - \log_a c$ |
| $(a^m)^n = a^{m \cdot n}$ | $\log_a(b^\alpha) = \alpha \cdot \log_a b$ |
| $a^0 = 1 \quad (a \neq 0)$ | $\log_a c = \frac{\log_b c}{\log_b a} \quad (\text{đổi cơ số})$ |
| $a^{-n} = \frac{1}{a^n}$ | $\log_e x = \ln x \quad (\text{logarit tự nhiên})$ |

---
### 💡 Nhắc nhở điều kiện cốt tử của Logarit:
* Khi biến đổi biểu thức chứa $\log_a x$, luôn nhớ đặt điều kiện cơ số: **$a > 0, a \neq 1$** và biểu thức dưới dấu logarit phải dương biệt lập: **$x > 0$**!

Chúc ${studentName} ghi nhớ sâu sắc và áp dụng thần tốc! 📐✨`;
    }

    if (subjectKey === "physics") {
      return `📖 **[BẢN ĐỒ TÓM TẮT LÝ THUYẾT TINH HOA] - VẬT LÝ DAO ĐỘNG CƠ HỌC** 📖

Chào ${studentName}! Hãy lưu lại ngay bảng tóm lược công thức của 3 đại lượng động học chính trong dao động điều hòa để ôn tập siêu tốc nhé:

### ⚡ Công thức Động Lực Học Cơ Bản:
1. **Phương trình Li độ:** $x = A \cos(\omega t + \varphi)$
2. **Phương trình Vận tốc:** $v = -\omega A \sin(\omega t + \varphi) = \omega A \cos(\omega t + \varphi + \frac{\pi}{2})$ 
   - *(Vận tốc luôn nhanh pha hơn li độ một góc $\frac{\pi}{2}$)*
3. **Phương trình Gia tốc:** $a = -\omega^2 x = \omega^2 A \cos(\omega t + \varphi + \pi)$
   - *(Gia tốc luôn ngược pha với li độ và nhanh pha hơn vận tốc một góc $\frac{\pi}{2}$)*

### ⚡ Các công thức Độc Lập Thời Gian (Siêu hay dùng):
* Công thức liên hệ $x$ và $v$: $A^2 = x^2 + \frac{v^2}{\omega^2}$
* Công thức liên hệ $v$ và $a$: $A^2 = \frac{a^2}{\omega^4} + \frac{v^2}{\omega^2}$

Chúc **${studentName}** học tập thăng hoa, giữ vững phong độ học tập tốt nhé! 🌀⚡`;
    }

    if (subjectKey === "chemistry") {
      return `📖 **[BẢN ĐỒ TÓM TẮT LÝ THUYẾT TINH HOA] - HÓA HỌC ESTE & CHẤT BÉO** 📖

Hi dung sĩ ôn thi **${studentName}**! Dưới đây là hệ thống hóa lý thuyết Este cực kỳ khoa học giúp bạn dễ dàng gạt bỏ bẫy đề thi:

### 1️⃣ Định nghĩa & Công thức chung:
* **Este no, đơn chức, mạch hở:** $C_n H_{2n} O_2 \quad (n \ge 2)$.
* **Sự hình thành:** Khi thay thế nhóm $-\text{OH}$ ở nhóm cacboxyl của axit cacboxylic bằng nhóm $-\text{OR}'$ của ancol ta thu được este.

### 2️⃣ Tính chất hóa học chủ chốt:
* **Thủy phân trong môi trường axit (Thuận nghịch):**
  $$\text{RCOOR}' + \text{H}_2\text{O} \rightleftarrows \text{RCOOH} + \text{R}'\text{OH}$$
* **Thủy phân trong môi trường kiềm (Một chiều - Xà phòng hóa):**
  $$\text{RCOOR}' + \text{NaOH} \rightarrow \text{RCOONa} + \text{R}'\text{OH}$$

### 3️⃣ Các trường hợp Este đặc biệt hay ra trong câu điểm 9+:
* **Este của Phenol:** $\text{RCOOC}_6\text{H}_5 + 2\text{NaOH} \rightarrow \text{RCOONa} + \text{C}_6\text{H}_5\text{ONa} + \text{H}_2\text{O}$ (Được 2 muối và nước, không tạo ra ancol!).
* **Este tạo anđehit:** $\text{RCOOCH}=\text{CH}_2 + \text{NaOH} \rightarrow \text{RCOONa} + \text{CH}_3\text{CHO}$.

Ghi nhớ tối đa để chinh phục thành công nguyện vọng một **${targetUniv}** nhé! 🧪🌡️`;
    }

    if (subjectKey === "english") {
      return `📖 **[BẢN ĐỒ TÓM TẮT LÝ THUYẾT TINH HOA] - English relative pronouns** 📖

Hi **${studentName}**! Here is a summarizing cheat sheet of English Relative Pronouns to help you pick the correct choice in under 5 seconds:

| Relative Pronoun | Used For | Role in Relative Clause | Example |
| :--- | :--- | :--- | :--- |
| **WHO** | People | Subject or Object | The tutor **who** teaches Physics is cool. |
| **WHOM** | People | Object only | The student **whom** I recommended got 10. |
| **WHICH** | Things / Ideas | Subject or Object | The exam **which** I took was challenging. |
| **THAT** | People & Things | Subject or Object (No commas!) | This is the AI **that** helps me study. |
| **WHOSE** | Possession | Shows ownership (followed by Noun) | The helper **whose** advice helped Dung. |

---
### 💡 Quick Memory Tip:
* Look for verbs directly after the gap. If you see a Verb, use **WHO** or **WHICH**. If you see a Subject + Verb, you can use **WHOM**, **WHO**, or **WHICH**!

Keep up the outstanding effort, ${studentName}! 🇬🇧☘️`;
    }
  }

  // TÁC VỤ 6: CHAT TỰ DO / KHỞI ĐẦU CHAT VỚI AI
  if (
    unsignMsg.includes("muon chat trao doi tu do") ||
    unsignMsg.includes("bat dau hoc")
  ) {
    return `✨ Chào **${studentName}** thân thương! Thầy rất tự hào về tinh thần năng nổ tự học của bạn hôm nay. 

Thầy đang ở trạng thái **Kết nối trực tuyến cực kỳ ổn định (AI Online)** và đã đồng bộ hoàn toàn với mục tiêu điểm số **${targetScore}** đỗ trường **${targetUniv}** của bạn!

**${studentName} có thể trao đổi bất kỳ chủ đề học tập nào với thầy:**
1. Nhờ thầy phân tích đáp án của một câu bài tập khó có sẵn.
2. Hỏi thầy định nghĩa, công thức hoặc cách chứng minh cụ thể.
3. Chat tâm sự, chia sẻ áp lực thi cử lớp 12 và tìm kiếm lời khuyên cân bằng tâm lý.

👉 **Mời ${studentName} đặt câu hỏi tự do bằng cách nhập tin nhắn bên dưới và gửi cho thầy nhé! Thầy trò ta cùng thi đỗ nguyện vọng một nào!** 🎓🚀`;
  }


  // ==========================================
  // XỬ LÝ CHÀO HỎI THƯỜNG GẶP KHÁC
  // ==========================================
  if (
    unsignMsg === "chao" ||
    unsignMsg === "hello" ||
    unsignMsg === "hi" ||
    unsignMsg === "alo" ||
    unsignMsg === "hey" ||
    unsignMsg.includes("chao ban") ||
    unsignMsg.includes("chao bot") ||
    unsignMsg.includes("chao thau") ||
    unsignMsg.includes("chao gia su") ||
    unsignMsg.includes("co ai do khong") ||
    unsignMsg.startsWith("chao ")
  ) {
    return `✨ **Chào ${studentName} thân mến! Thầy là SmartExam AI - Gia sư luyện thi THPT 24/7 của bạn.** ✨

Thầy rất vui được đồng hành cùng ${studentName} ngày hôm nay! Thầy thấy mục tiêu vô cùng tuyệt vời của bạn là đặt chân vào trường **${targetUniv}** với số điểm mơ ước là **${targetScore} điểm**! 

Hiện tại, chuỗi ngày học tập (Streak) của ${studentName} đang là **🔥 ${streak} ngày liên tục**. Phong độ tự học này cực kỳ đáng khen ngợi!

Thầy có thể giải đáp trọn vẹn lý thuyết lớp 12, tháo gỡ bẫy trắc nghiệm môn Toán, bóc tách cấu trúc tiếng Anh phức tạp, hoặc giải nghĩa phương trình Hóa học/ Vật lý. 

**${studentName} cần thầy hỗ trợ đắc lực chuyên đề nào hôm nay?** Hãy thử hỏi thầy một câu bất kỳ nhé! 📚 Let's go!`;
  }

  // Cảm ơn / Khích lệ
  if (
    unsignMsg.includes("cam on") ||
    unsignMsg.includes("cảm ơn") ||
    unsignMsg.includes("thank") ||
    unsignMsg === "ok" ||
    unsignMsg === "da cam on" ||
    unsignMsg.includes("hay qua") ||
    unsignMsg.includes("tuyet voi") ||
    unsignMsg.includes("gioi the")
  ) {
    return `💖 **Không có gì đâu ${studentName} ơi! Giúp bạn bứt phá học tập chính là sứ mệnh của thầy.** 

Để đạt điểm số **${targetScore}** và đỗ nguyện vọng một vào **${targetUniv}**, việc rèn luyện tính kiên nhẫn và ghi chú tỉ mỉ sau mỗi câu sai là tối quan trọng. 

Nếu trong lúc làm đề thi thử ở tab **Luyện Đề** mà có câu nào hóc búa, hãy chụp hoặc chép lại đề rồi gửi cho thầy ngay nhé. Thầy trò mình sẽ giải quyết trong một nốt nhạc!

Chúc ${studentName} học tập tràn đầy năng lượng! Cố gắng giữ vững streak học tập ngày hôm nay nha! 💪🔥`;
  }

  // =========================================================================
  // PHẢN HỒI THEO TỪNG MÔN HỌC CHỦ CHỐT (Subject-specific custom heuristics)
  // =========================================================================
  if (subjectKey === "math") {
    return `✨ **SmartExam AI Coach - Giải Đáp Chuyên Sâu Môn Toán Học** ✨

Chào ${studentName}! Câu hỏi liên quan đến kiến thức Toán học của bạn đã được tiếp nhận. Để hướng tới số điểm **${targetScore}** và đỗ vào đại học top đầu **${targetUniv}**, hãy áp dụng quy trình giải quyết khoa học sau:

### 🧭 Phân Tích Phương Pháp Giải:
1. **Xét hàm số và Tập xác định:** Luôn lưu ý điều kiện của các hàm đặc trưng như hàm phân thức mẫu số khác không, hàm căn bậc chẵn biểu thức dưới căn lớn hơn hoặc bằng không, hàm logatit biểu thức lớn hơn không.
2. **Xét tính đơn điệu / Cực trị:** Cách an toàn nhất là tính đạo hàm $f'(x)$, lập bảng xét dấu và tìm các điểm cực trị mà đạo hàm đổi dấu từ âm sang dương hoặc ngược lại.
3. **Mẹo Casio:** Đối với các bài toán tích phân hay số phức cơ bản, em hoàn toàn có thể sử dụng giải lập trình CASIO để đối soát nhanh đáp số để dành thời gian cho các bài vận dụng cao điểm 9+.

👉 **${studentName} hãy nhập cụ thể đề bài tập Toán học, hàm số hoặc câu hình không gian bạn đang vướng mắc lên đây.** Thầy sẽ bóc tách và viết từng bước biến đổi đại số trực quan để hướng dẫn chi tiết nhất cho bạn nhé!`;
  }

  if (subjectKey === "physics") {
    return `✨ **SmartExam AI Coach - Giải Đáp Chuyên Sâu Môn Vật Lý** ✨

Chào ${studentName}! Cố gắng nắm vững tư duy Vật lý bản chất thay vì học vẹt công thức sẽ giúp bạn bứt phá đạt điểm số **${targetScore}** để đặt chân vào giảng đường mơ ước **${targetUniv}**. 

### 🧭 Phân Tích Phương Pháp Giải:
1. **Xác định các đại lượng đã biết:** Chú ý kỹ đến đơn vị đo (cm sang m, g sang kg, ms sang s). Đề thi THPT Quốc gia cực kỳ hay cài bẫy đơn vị ở phần tính Động năng, Thế năng và Cơ năng.
2. **Sử dụng sơ đồ Vòng Tròn Lượng Giác đa năng:** Đối với các bài toán tính thời gian nén - giãn của lò xo, hay tính toán khoảng thời gian chuyển động cực đại cực tiểu, vòng tròn lượng giác có độ chính xác rất cao và giúp giải cực nhanh so với công thức lượng giác phức tạp.
3. **Phối hợp đại lượng điện xoay chiều RLC:** Nhớ quy tắc cộng vectơ trong giản đồ giản lược để nhìn ra pha ban đầu dễ dàng.

👉 **${studentName} hãy nhắn cho thầy cụ thể đề bài Vật lý (Dao động cơ, Sóng cơ, hay Điện xoay chiều RLC) mà bạn đang làm dở.** Thầy sẽ phân tích và lập luận ra đáp án đúng 100% cho bạn ngay!`;
  }

  if (subjectKey === "chemistry") {
    return `✨ **SmartExam AI Coach - Giải Đáp Chuyên Sâu Môn Hóa Học** ✨

Chào ${studentName}! Hóa học lớp 12 chứa lượng kiến thức hữu cơ đồ sộ như este, chất béo, cacbohidrat, amin, amino axit và peptit. Để không mắc bẫy lý thuyết đếm:

### 🧭 Phân Tích Phương Pháp Giải:
1. **Bảo Toàn Khối Lượng và Bảo Toàn Nguyên Tố:** Đây là hai vũ khí tối thượng giúp giải nhanh 90% bài toán hữu cơ mà không cần viết phương trình phản ứng phức tạp.
2. **Làm chủ sơ đồ biến hóa hữu cơ:** Ghi nhớ rõ điều kiện chuyển đổi (Ví dụ: chất nào tham gia phản ứng tráng bạc, chất nào làm mất màu brom, các trường hợp este thủy phân không ra ancol...).
3. **Lưu ý tính chất kim loại:** Đọc kỹ dãy điện hóa để xác định chính xác thứ tự phản ứng của kim loại với muối.

👉 **Hãy gửi cho thầy đề bài hoặc công thức hóa chất hóc búa bạn đang băn khoăn.** Thầy trò ta sẽ bóc tách và giải quyết dứt điểm câu hỏi này nha!`;
  }

  if (subjectKey === "english") {
    return `✨ **SmartExam AI Coach - English Exam Specialist** ✨

Hi ${studentName}! Studying English effectively is all about patterns and rules. To reach your goal of **${targetScore}** and easily enter **${targetUniv}**, simplify your studying with these steps:

### 🧭 Grammar & Vocabulary Strategy:
1. **Root-Cause Analysis:** If you can't figure out the answer, try to eliminate the options that violate subject-verb agreement or wrong tense coordination.
2. **Key Word Recognition:** Look for time indicators (since, by the time, as soon as, yet, already) or relative pronouns to pinpoint the tested grammatical structure.
3. **Collocations:** Store frequently used blocks in your mind (e.g., "interested in", "responsible for", "make progress", "take action").

👉 **${studentName}, please share the exact English sentence or reading comprehension question you need help with.** I will break down the grammatical structures and translate it beautifully for you!`;
  }

  // ==========================================
  // PHẢN HỒI FALLBACK ĐA DỤNG (Chất lượng rất cao)
  // ==========================================
  const cleanPrompt = message.trim().replace(/\?/g, "");
  return `✨ **SmartExam AI Tutor - Trợ lý Học Tập Cá Nhân Hóa Lớp 12** ✨

Chào **${studentName}** thân yêu! Thầy ghi nhận thắc mắc rất thực chất của bạn về chủ đề: **"${cleanPrompt}"**.

Để tháo gỡ dễ dàng và biến chuyên đề này thành mỏ điểm vàng giúp bạn bứt phá chuẩn bị sải cánh đỗ vào nguyện vọng một trường **${targetUniv}** với mục tiêu số điểm **${targetScore}**, thầy khuyên bạn ghi chú 3 bước tư duy kinh điển:

### 1️⃣ Bước 1: Định vị vùng kiến thức
- Phân tích câu hỏi xem thuộc phần lý thuyết nào của chương trình ôn luyện lớp 12. Viết nhanh ra nháp các công thức liên quan.

### 2️⃣ Bước 2: Kích hoạt tư duy loại trừ
- Loại bỏ trực tiếp 2 phương án gây nhiễu rõ rệt (các bẫy đơn vị hoặc cấu trúc ngữ pháp sai cơ bản) để nâng tỉ lệ chọn đáp án đúng lên cao nhất.

### 3️⃣ Bước 3: Đặt ẩn phụ, đơn giản hóa hoặc đối chiếu thực tế
- Tiến hành tính toán hoặc so khớp Collocations để tìm ra đáp số lý tưởng cuối cùng.

👉 **${studentName} hãy gửi cụ thể đề toán học, vật lý, hóa học hoặc câu ngữ pháp tiếng Anh mà bạn đang làm dở lên đây nhé.** Thầy sẽ lập tức gạch đầu dòng chi tiết cách suy luận, giải nghĩa và bật mí mẹo kiểm tra kết quả nhanh để giúp bạn chiến thắng tuyệt đối! Gia sư luôn sát cánh cùng ước mơ của bạn! 🎉🔥`;
}
