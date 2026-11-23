USE [HE_THONG_LUYEN_THI];
SET NOCOUNT ON;
BEGIN TRANSACTION;


INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Việt Nam chính thức gia nhập ASEAN vào năm 1995.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'DEA697EF-E788-499F-B610-CC91B1DBE321', 'medium', GETDATE(), N'Việt Nam gia nhập ASEAN ngày 28/7/1995 tại Brunei.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hiệp hội các quốc gia Đông Nam Á (ASEAN) ban đầu được thành lập tại Singapore.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'DEA697EF-E788-499F-B610-CC91B1DBE321', 'medium', GETDATE(), N'ASEAN được thành lập ngày 8/8/1967 tại Băng Cốc (Thái Lan).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kể tên 3 trụ cột chính trong việc xây dựng Cộng đồng ASEAN.',
    N'', N'', N'', N'',
    N'Cộng đồng Chính trị - An ninh, Cộng đồng Kinh tế, Cộng đồng Văn hóa - Xã hội', 'DEA697EF-E788-499F-B610-CC91B1DBE321', 'medium', GETDATE(), N'Ba trụ cột gồm Chính trị-An ninh (APSC), Kinh tế (AEC) và Văn hóa-Xã hội (ASCC).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trụ sở chính của Ban Thư ký Hiệp hội các quốc gia Đông Nam Á (ASEAN) đặt tại thủ đô nào?',
    N'', N'', N'', N'',
    N'Jakarta', 'DEA697EF-E788-499F-B610-CC91B1DBE321', 'medium', GETDATE(), N'Trụ sở Ban Thư ký ASEAN đặt tại thủ đô Jakarta, Indonesia.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hoa Kì là quốc gia có quy mô nền kinh tế (GDP) lớn nhất thế giới hiện nay.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'A1284D63-5489-4349-A4FA-2EAB4595B424', 'medium', GETDATE(), N'Hoa Kì duy trì vị thế nền kinh tế số 1 toàn cầu.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Vùng Đông Bắc Hoa Kì là trung tâm công nghiệp hàng không vũ trụ hiện đại nhất cả nước.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'A1284D63-5489-4349-A4FA-2EAB4595B424', 'medium', GETDATE(), N'Vùng Đông Bắc là vành đai công nghiệp truyền thống (luyện kim, cơ khí); hàng không vũ trụ tập trung ở phía Nam và Tây.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kể tên con sông dài nhất chảy qua trung tâm lãnh thổ nước Mỹ.',
    N'', N'', N'', N'',
    N'Mississippi', 'A1284D63-5489-4349-A4FA-2EAB4595B424', 'medium', GETDATE(), N'Hệ thống sông Mississippi - Missouri là hệ thống sông lớn nhất Bắc Mỹ.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Thủ đô hành chính của Hợp chúng quốc Hoa Kì tên là gì?',
    N'', N'', N'', N'',
    N'Washington D.C.', 'A1284D63-5489-4349-A4FA-2EAB4595B424', 'medium', GETDATE(), N'Washington D.C. là thủ đô của Hoa Kì.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đồng tiền chung châu Âu (Euro) chính thức được đưa vào lưu hành tiền mặt từ năm 2002.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'D083177E-A856-46B7-A2A5-E33CB7DB7759', 'medium', GETDATE(), N'Đồng Euro bắt đầu lưu hành tiền mặt vào ngày 1/1/2002.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hiện nay Vương quốc Anh vẫn là thành viên đầy đủ quyền lợi của Liên minh châu Âu (EU).',
    N'Đúng', N'Sai', N'', N'',
    'false', 'D083177E-A856-46B7-A2A5-E33CB7DB7759', 'medium', GETDATE(), N'Vương quốc Anh đã chính thức rời khỏi EU (sự kiện Brexit) vào năm 2020.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nêu tên hiệp ước đặt nền tảng pháp lý chính thức cho sự ra đời của Liên minh châu Âu năm 1993.',
    N'', N'', N'', N'',
    N'Hiệp ước Maastricht', 'D083177E-A856-46B7-A2A5-E33CB7DB7759', 'medium', GETDATE(), N'Hiệp ước Maastricht có hiệu lực năm 1993 chính thức thành lập Liên minh châu Âu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trụ sở chính của Ủy ban châu Âu (cơ quan điều hành EU) đặt tại thành phố nào?',
    N'', N'', N'', N'',
    N'Brussels', 'D083177E-A856-46B7-A2A5-E33CB7DB7759', 'medium', GETDATE(), N'Brussels (Bỉ) là thủ đô trên thực tế của Liên minh châu Âu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Lãnh thổ Nhật Bản gồm 4 đảo lớn: Hô-cai-đô, Hôn-su, Xi-cô-cư và Kiu-xiu.',
    N'Đúng', N'Sai', N'', N'',
    'true', '1E1338C7-31A5-41D0-B81B-73605D7F036B', 'medium', GETDATE(), N'Bốn hòn đảo chính này chiếm phần lớn diện tích Nhật Bản.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nhật Bản là quốc gia rất giàu tài nguyên khoáng sản kim loại và nhiên liệu tự nhiên.',
    N'Đúng', N'Sai', N'', N'',
    'false', '1E1338C7-31A5-41D0-B81B-73605D7F036B', 'medium', GETDATE(), N'Nhật Bản rất nghèo tài nguyên thiên nhiên, hầu như phải nhập khẩu nguyên nhiên liệu.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đỉnh núi cao nhất và là biểu tượng tự nhiên nổi tiếng của Nhật Bản tên là gì?',
    N'', N'', N'', N'',
    N'Núi Phú Sĩ', '1E1338C7-31A5-41D0-B81B-73605D7F036B', 'medium', GETDATE(), N'Núi Phú Sĩ (Fuji) cao 3.776m là biểu tượng của Nhật Bản.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '2C4BFEB8-93F2-4084-B397-3298AF29A729', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đảo nào có diện tích lớn nhất và tập trung dân cư đông nhất của Nhật Bản?',
    N'', N'', N'', N'',
    N'Honshu', '1E1338C7-31A5-41D0-B81B-73605D7F036B', 'medium', GETDATE(), N'Đảo Hôn-su (Honshu) là đảo lớn nhất, nơi có thủ đô Tokyo.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cạnh tranh lành mạnh là động lực quan trọng thúc đẩy sự phát triển của nền kinh tế thị trường.',
    N'Đúng', N'Sai', N'', N'',
    'true', '5E51D05A-AE87-42B4-B1C2-422538AAD8A0', 'medium', GETDATE(), N'Cạnh tranh lành mạnh kích thích cải tiến kỹ thuật, nâng cao năng suất và phục vụ người tiêu dùng tốt hơn.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Mọi hành vi cạnh tranh bằng cách tung tin giả, bôi nhọ đối thủ đều được pháp luật khuyến khích.',
    N'Đúng', N'Sai', N'', N'',
    'false', '5E51D05A-AE87-42B4-B1C2-422538AAD8A0', 'medium', GETDATE(), N'Đó là hành vi cạnh tranh không lành mạnh và bị pháp luật nghiêm cấm.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Mục đích tối hậu của các chủ thể sản xuất kinh doanh khi tham gia cạnh tranh kinh tế là gì?',
    N'', N'', N'', N'',
    N'Tối đa hóa lợi nhuận', '5E51D05A-AE87-42B4-B1C2-422538AAD8A0', 'medium', GETDATE(), N'Mục đích chính là giành giật điều kiện thuận lợi để thu lợi nhuận cao nhất.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nêu 2 loại hình cạnh tranh cơ bản trong nền kinh tế thị trường.',
    N'', N'', N'', N'',
    N'Cạnh tranh lành mạnh và cạnh tranh không lành mạnh', '5E51D05A-AE87-42B4-B1C2-422538AAD8A0', 'medium', GETDATE(), N'Gồm cạnh tranh đúng luật (lành mạnh) và cạnh tranh vi phạm pháp luật/đạo đức (không lành mạnh).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hàng hóa là sản phẩm của lao động, có thể thỏa mãn nhu cầu con người và dùng để trao đổi, mua bán.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'B8FC9729-EBE6-4CAD-BD07-5AD935954993', 'medium', GETDATE(), N'Định nghĩa hàng hóa trong kinh tế chính trị.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Mọi sản phẩm do bàn tay người lao động làm ra đều đương nhiên là hàng hóa.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'B8FC9729-EBE6-4CAD-BD07-5AD935954993', 'medium', GETDATE(), N'Sản phẩm tự làm tự tiêu không phải là hàng hóa, nó phải được đưa ra thị trường trao đổi.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kể tên hai thuộc tính cơ bản cấu thành nên một hàng hóa.',
    N'', N'', N'', N'',
    N'Giá trị sử dụng và giá trị', 'B8FC9729-EBE6-4CAD-BD07-5AD935954993', 'medium', GETDATE(), N'Hàng hóa có hai thuộc tính thống nhất là giá trị sử dụng và giá trị.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ai là nhà kinh tế đã phân tích sâu sắc hai thuộc tính của hàng hóa trong tác phẩm Tư bản?',
    N'', N'', N'', N'',
    N'Karl Marx', 'B8FC9729-EBE6-4CAD-BD07-5AD935954993', 'medium', GETDATE(), N'C. Mác là người hoàn thiện học thuyết giá trị và hai thuộc tính hàng hóa.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi lượng cung lớn hơn lượng cầu trên thị trường, giá cả hàng hóa thường có xu hướng giảm.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'FB2E7AC1-4EC5-4669-A164-159506266EA2', 'medium', GETDATE(), N'Cung thừa thì người bán phải giảm giá để bán được hàng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Giá cả hàng hóa tăng cao sẽ kích thích người tiêu dùng mua sắm nhiều hàng hóa hơn.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'FB2E7AC1-4EC5-4669-A164-159506266EA2', 'medium', GETDATE(), N'Giá tăng thường làm giảm lượng cầu (người tiêu dùng mua ít đi).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi giá cả hàng hóa tăng cao, người sản xuất có xu hướng tăng hay giảm quy mô cung ứng?',
    N'', N'', N'', N'',
    N'Tăng quy mô cung ứng', 'FB2E7AC1-4EC5-4669-A164-159506266EA2', 'medium', GETDATE(), N'Giá cao mang lại lợi nhuận cao nên nhà sản xuất mở rộng cung cấp.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trạng thái thị trường được gọi là gì khi lượng hàng hóa người mua muốn mua bằng đúng lượng hàng người bán muốn bán?',
    N'', N'', N'', N'',
    N'Cân bằng thị trường', 'FB2E7AC1-4EC5-4669-A164-159506266EA2', 'medium', GETDATE(), N'Tại điểm cân bằng, lượng cung bằng lượng cầu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Quy luật giá trị yêu cầu việc sản xuất và lưu thông hàng hóa phải dựa trên hao phí lao động xã hội cần thiết.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'BA0666D9-2FB1-4779-8977-B5F4D4F97122', 'medium', GETDATE(), N'Nội dung căn bản của quy luật giá trị.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Người sản xuất có hao phí lao động cá biệt cao hơn hao phí lao động xã hội sẽ thu được lợi nhuận cao nhất.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'BA0666D9-2FB1-4779-8977-B5F4D4F97122', 'medium', GETDATE(), N'Hao phí cá biệt lớn hơn hao phí xã hội sẽ bị lỗ hoặc phá sản.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Quy luật giá trị điều tiết sự vận động của sản xuất và lưu thông hàng hóa thông qua yếu tố nào?',
    N'', N'', N'', N'',
    N'Giá cả thị trường', 'BA0666D9-2FB1-4779-8977-B5F4D4F97122', 'medium', GETDATE(), N'Thông qua sự biến động của giá cả xoay quanh giá trị.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '3058471E-B1CE-4C3C-AC1E-9FFE91AF5AF8', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nêu tác động kích thích quan trọng nhất của quy luật giá trị đối với người sản xuất.',
    N'', N'', N'', N'',
    N'Cải tiến kỹ thuật, nâng cao năng suất lao động', 'BA0666D9-2FB1-4779-8977-B5F4D4F97122', 'medium', GETDATE(), N'Để hạ thấp hao phí cá biệt xuống dưới hao phí xã hội.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Amoniac (NH3) là chất khí tan rất nhiều trong nước và dung dịch có tính bazơ yếu.',
    N'Đúng', N'Sai', N'', N'',
    'true', '9E324E47-2B73-466D-9587-11548380173B', 'medium', GETDATE(), N'NH3 tan cực nhiều trong nước tạo dung dịch NH3 mang tính bazo yếu.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí amoniac có mùi thơm dễ chịu và nặng hơn không khí.',
    N'Đúng', N'Sai', N'', N'',
    'false', '9E324E47-2B73-466D-9587-11548380173B', 'medium', GETDATE(), N'NH3 có mùi khai xốc đặc trưng và nhẹ hơn không khí (M=17 < 29).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Viết công thức phân tử của khí Amoniac.',
    N'', N'', N'', N'',
    N'NH3', '9E324E47-2B73-466D-9587-11548380173B', 'medium', GETDATE(), N'Amoniac có công thức phân tử là NH3.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Dung dịch amoniac làm quỳ tím ẩm chuyển sang màu gì?',
    N'', N'', N'', N'',
    N'Màu xanh', '9E324E47-2B73-466D-9587-11548380173B', 'medium', GETDATE(), N'Do tạo môi trường kiềm (OH-) làm quỳ tím chuyển xanh.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ankan là hiđrocacbon no, mạch hở, phân tử chỉ chứa các liên kết đơn.',
    N'Đúng', N'Sai', N'', N'',
    'true', '5498D013-C5DB-4DF5-B679-765D94BB47B5', 'medium', GETDATE(), N'Ankan chỉ chứa liên kết sigma C-C và C-H bền vững.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ở nhiệt độ phòng, ankan dễ dàng tham gia phản ứng cộng làm mất màu dung dịch brom.',
    N'Đúng', N'Sai', N'', N'',
    'false', '5498D013-C5DB-4DF5-B679-765D94BB47B5', 'medium', GETDATE(), N'Ankan là hidrocacbon no, không có phản ứng cộng làm mất màu dung dịch brom.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Viết công thức chung của dãy đồng đẳng ankan với n nguyên tử cacbon (n >= 1).',
    N'', N'', N'', N'',
    N'CnH2n+2', '5498D013-C5DB-4DF5-B679-765D94BB47B5', 'medium', GETDATE(), N'Công thức tổng quát của ankan là CnH2n+2.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kể tên ankan đơn giản nhất trong tự nhiên, thành phần chính của khí thiên nhiên.',
    N'', N'', N'', N'',
    N'Metan', '5498D013-C5DB-4DF5-B679-765D94BB47B5', 'medium', GETDATE(), N'Khí metan (CH4) là ankan đơn giản nhất.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Anken có khả năng làm mất màu nâu đỏ của dung dịch nước brom ngay ở điều kiện thường.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'F690B53A-C546-4113-ABA7-F12C78ED8E8E', 'medium', GETDATE(), N'Do liên kết đôi C=C có 1 liên kết pi kém bền dễ bị bẻ gãy.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Phản ứng đặc trưng nhất của anken là phản ứng thế halogen.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'F690B53A-C546-4113-ABA7-F12C78ED8E8E', 'medium', GETDATE(), N'Phản ứng đặc trưng của anken là phản ứng cộng vào liên kết đôi.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Viết công thức phân tử của anken đơn giản nhất (etilen).',
    N'', N'', N'', N'',
    N'C2H4', 'F690B53A-C546-4113-ABA7-F12C78ED8E8E', 'medium', GETDATE(), N'Etilen có công thức C2H4 (CH2=CH2).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trùng hợp etilen tạo ra loại chất dẻo phổ biến nào?',
    N'', N'', N'', N'',
    N'Polietilen', 'F690B53A-C546-4113-ABA7-F12C78ED8E8E', 'medium', GETDATE(), N'Trùng hợp C2H4 thu được nhựa PE (polietilen).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí nitơ đioxit (NO2) là chất khí có màu nâu đỏ đặc trưng và có tính độc đối với đường hô hấp.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'D7720EDF-8518-461A-985E-2DAFB30C5DB5', 'medium', GETDATE(), N'NO2 là khí màu nâu đỏ, mùi hắc và rất độc.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí NO (nitơ monoxit) không màu và bền vững, không bao giờ phản ứng với oxi trong không khí.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'D7720EDF-8518-461A-985E-2DAFB30C5DB5', 'medium', GETDATE(), N'NO ngay lập tức kết hợp với O2 ở điều kiện thường tạo thành NO2 nâu đỏ.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Viết công thức hóa học của đinitơ oxit (thường gọi là khí cười).',
    N'', N'', N'', N'',
    N'N2O', 'D7720EDF-8518-461A-985E-2DAFB30C5DB5', 'medium', GETDATE(), N'Khí cười có công thức N2O.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'CF98A029-39FD-4822-AF76-EBC786004A86', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí NO2 có màu gì dễ nhận biết nhất bằng mắt thường?',
    N'', N'', N'', N'',
    N'Màu nâu đỏ', 'D7720EDF-8518-461A-985E-2DAFB30C5DB5', 'medium', GETDATE(), N'NO2 có màu nâu đỏ đặc trưng.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cuộc phá ngục Ba-xti ngày 14/7/1789 đã mở đầu cho thắng lợi của Cách mạng tư sản Pháp.',
    N'Đúng', N'Sai', N'', N'',
    'true', '3A6B16C0-1583-4386-B241-B16943B4C1FB', 'medium', GETDATE(), N'Ngày 14/7 trở thành ngày Quốc khánh của nước Pháp.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cách mạng tư sản Pháp cuối thế kỉ XVIII do giai cấp vô sản lãnh đạo.',
    N'Đúng', N'Sai', N'', N'',
    'false', '3A6B16C0-1583-4386-B241-B16943B4C1FB', 'medium', GETDATE(), N'Giai cấp tư sản là lực lượng nắm ngọn cờ lãnh đạo cách mạng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Văn kiện lịch sử bất hủ được Quốc hội lập hiến Pháp thông qua năm 1789 có tên là gì?',
    N'', N'', N'', N'',
    N'Tuyên ngôn Nhân quyền và Dân quyền', '3A6B16C0-1583-4386-B241-B16943B4C1FB', 'medium', GETDATE(), N'Đề cao quyền tự do, bình đẳng của con người.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Pháo đài ngục nào bị quần chúng Paris đánh chiếm ngày 14/7/1789?',
    N'', N'', N'', N'',
    N'Ngục Ba-xti', '3A6B16C0-1583-4386-B241-B16943B4C1FB', 'medium', GETDATE(), N'Ngục Ba-xti (Bastille) biểu tượng của chế độ quân chủ chuyên chế.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cách mạng tháng Mười Nga năm 1917 lật đổ Chính phủ tư sản lâm thời, lập nên nhà nước Xô viết đầu tiên trên thế giới.',
    N'Đúng', N'Sai', N'', N'',
    'true', '50D913AE-93A7-4F75-ADED-50AB6AB43D6A', 'medium', GETDATE(), N'Mở ra thời đại mới trong lịch sử phong trào cách mạng thế giới.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Lãnh tụ vĩ đại trực tiếp lãnh đạo Cách mạng tháng Mười Nga thành công là V.I. Lê-nin.',
    N'Đúng', N'Sai', N'', N'',
    'true', '50D913AE-93A7-4F75-ADED-50AB6AB43D6A', 'medium', GETDATE(), N'Lê-nin lãnh đạo Đảng Bolshevik giành chính quyền về tay nhân dân.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chiến hạm nào đã nổ phát pháo lệnh tấn công Cung điện Mùa Đông đêm 25/10/1917?',
    N'', N'', N'', N'',
    N'Chiến hạm Rạng Đông', '50D913AE-93A7-4F75-ADED-50AB6AB43D6A', 'medium', GETDATE(), N'Tàu Rạng Đông (Aurora) phát tín hiệu tấn công.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đảng nào đã lãnh đạo giai cấp công nhân và nhân dân lao động Nga làm nên Cách mạng tháng Mười?',
    N'', N'', N'', N'',
    N'Đảng Bôn-sê-vích', '50D913AE-93A7-4F75-ADED-50AB6AB43D6A', 'medium', GETDATE(), N'Đảng Công nhân Xã hội Dân chủ Nga (Bolshevik) do Lê-nin đứng đầu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chiến tranh thế giới thứ nhất (1914 - 1918) về tính chất là cuộc chiến tranh đế quốc phi nghĩa với cả hai phe.',
    N'Đúng', N'Sai', N'', N'',
    'true', '35974DDC-AA1F-4A2E-B717-01A2ED1B3B75', 'medium', GETDATE(), N'Cả hai phe đều nhằm tranh giành thuộc địa và phân chia lại thị trường thế giới.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chiến tranh thế giới thứ nhất kết thúc với thắng lợi thuộc về phe Liên minh (Đức, Áo - Hung).',
    N'Đúng', N'Sai', N'', N'',
    'false', '35974DDC-AA1F-4A2E-B717-01A2ED1B3B75', 'medium', GETDATE(), N'Phe Liên minh thất bại hoàn toàn trước phe Hiệp ước.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Vụ ám sát Thái tử Áo-Hung vào năm 1914 châm ngòi cho chiến tranh thế giới thứ nhất diễn ra ở thành phố nào?',
    N'', N'', N'', N'',
    N'Sarajevo', '35974DDC-AA1F-4A2E-B717-01A2ED1B3B75', 'medium', GETDATE(), N'Vụ ám sát tại Sarajevo (Bosnia) là ngòi nổ châm bùng chiến tranh.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chiến tranh thế giới thứ nhất nổ ra và kết thúc trong khoảng thời gian từ năm nào đến năm nào?',
    N'', N'', N'', N'',
    N'1914 - 1918', '35974DDC-AA1F-4A2E-B717-01A2ED1B3B75', 'medium', GETDATE(), N'Bắt đầu ngày 28/7/1914 và kết thúc ngày 11/11/1918.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tuyên ngôn Độc lập của Hợp chúng quốc Hoa Kì được công bố vào ngày 4 tháng 7 năm 1776.',
    N'Đúng', N'Sai', N'', N'',
    'true', '9002A06A-48AD-4358-BB74-94BA3F8CD3A1', 'medium', GETDATE(), N'Được soạn thảo bởi Thomas Jefferson và thông qua ngày 4/7/1776.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'George Washington là Tổng chỉ huy quân đội của 13 thuộc địa Anh ở Bắc Mĩ trong cuộc chiến giành độc lập.',
    N'Đúng', N'Sai', N'', N'',
    'true', '9002A06A-48AD-4358-BB74-94BA3F8CD3A1', 'medium', GETDATE(), N'Sau này ông được bầu làm Tổng thống đầu tiên của Hoa Kì.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ngày Quốc khánh hằng năm của nước Mỹ (Hoa Kì) là ngày tháng nào?',
    N'', N'', N'', N'',
    N'Ngày 4 tháng 7', '9002A06A-48AD-4358-BB74-94BA3F8CD3A1', 'medium', GETDATE(), N'Kỷ niệm Tuyên ngôn Độc lập năm 1776.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D212868C-7B68-44BD-90C0-44C0A43E69FD', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ai là tác giả chính soạn thảo bản Tuyên ngôn Độc lập nước Mỹ năm 1776?',
    N'', N'', N'', N'',
    N'Thomas Jefferson', '9002A06A-48AD-4358-BB74-94BA3F8CD3A1', 'medium', GETDATE(), N'Thomas Jefferson là ngòi bút chủ chốt của bản Tuyên ngôn.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Bài thơ ''Đây thôn Vĩ Dạ'' của Hàn Mặc Tử gắn liền với khung cảnh thiên nhiên xứ Huế mộng mơ.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'C850DBC6-AFE4-4745-A615-42DAB270322F', 'medium', GETDATE(), N'Lấy cảm hứng từ thôn Vĩ Dạ bên dòng sông Hương.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hàn Mặc Tử là nhà thơ lớn của phong trào Thơ mới thuộc trào lưu lãng mạn thoát ly đời sống thuần túy.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'C850DBC6-AFE4-4745-A615-42DAB270322F', 'medium', GETDATE(), N'Hàn Mặc Tử là gương mặt nổi bật nhất của Trường thơ Loạn (thơ Điên) với hồn thơ bi thương kỳ ảo.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Địa danh thôn Vĩ trong tác phẩm ''Đây thôn Vĩ Dạ'' của Hàn Mặc Tử thuộc tỉnh thành nào của nước ta?',
    N'', N'', N'', N'',
    N'Huế', 'C850DBC6-AFE4-4745-A615-42DAB270322F', 'medium', GETDATE(), N'Thôn Vĩ Dạ nằm cạnh bờ sông Hương thuộc thành phố Huế.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Điền từ còn thiếu vào câu thơ mở đầu: ''Sao anh không về chơi ... Dạ?''',
    N'', N'', N'', N'',
    N'thôn Vĩ', 'C850DBC6-AFE4-4745-A615-42DAB270322F', 'medium', GETDATE(), N'Câu thơ: ''Sao anh không về chơi thôn Vĩ?''.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tác phẩm kiệt tác ''Chí Phèo'' của Nam Cao lúc đầu khi mới in có tên là ''Cái lò gạch cũ''.',
    N'Đúng', N'Sai', N'', N'',
    'true', '668684EA-3423-474E-86FA-8F79200F2A6E', 'medium', GETDATE(), N'Sau đó nhà xuất bản đổi thành ''Đôi lứa xứng đôi'', cuối cùng lấy tên nhân vật ''Chí Phèo''.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nhân vật Thị Nở đã đem bát cháo gà thơm phức đến cho Chí Phèo khi hắn bị ốm.',
    N'Đúng', N'Sai', N'', N'',
    'false', '668684EA-3423-474E-86FA-8F79200F2A6E', 'medium', GETDATE(), N'Thị Nở mang cho Chí Phèo bát cháo hành ấm áp tình người.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Làng quê phong kiến ngột ngạt nơi diễn ra số phận bi kịch của Chí Phèo tên là gì?',
    N'', N'', N'', N'',
    N'Làng Vũ Đại', '668684EA-3423-474E-86FA-8F79200F2A6E', 'medium', GETDATE(), N'Làng Vũ Đại là bức tranh thu nhỏ của xã hội nông thôn Việt Nam trước cách mạng.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Món ăn giản dị nào mà Thị Nở đã nấu đã đánh thức bản tính lương thiện của Chí Phèo?',
    N'', N'', N'', N'',
    N'Bát cháo hành', '668684EA-3423-474E-86FA-8F79200F2A6E', 'medium', GETDATE(), N'Bát cháo hành ấm áp là hương vị của tình thương và nhân tính.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tiểu thuyết ''Tắt đèn'' của Ngô Tất Tố đã phản ánh hiện thực tàn khốc về nạn sưu thuế đè nặng lên người nông dân.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'AF8610E2-52D1-404D-82A1-0D5420293BEF', 'medium', GETDATE(), N'Tác phẩm kinh điển của văn học hiện thực phê phán 1930 - 1945.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nhân vật chị Dậu trong ''Tắt đèn'' là người phụ nữ luôn cam chịu và không bao giờ dám vùng lên chống lại bọn cai lệ.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'AF8610E2-52D1-404D-82A1-0D5420293BEF', 'medium', GETDATE(), N'Chị Dậu đã có hành động phản kháng mạnh mẽ, quật ngã tên cai lệ để bảo vệ chồng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tên nhân vật nữ chính nghèo khổ nhưng kiên cường trong tiểu thuyết ''Tắt đèn'' là ai?',
    N'', N'', N'', N'',
    N'Chị Dậu', 'AF8610E2-52D1-404D-82A1-0D5420293BEF', 'medium', GETDATE(), N'Chị Dậu (Lê Thị Đào) là hình tượng người phụ nữ nông dân kiên cường.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đoạn trích nổi tiếng trong tác phẩm ''Tắt đèn'' học ở trường có nhan đề là ''Tức nước ...''?',
    N'', N'', N'', N'',
    N'vỡ bờ', 'AF8610E2-52D1-404D-82A1-0D5420293BEF', 'medium', GETDATE(), N'Đoạn trích ''Tức nước vỡ bờ'' thể hiện sự phản kháng mạnh mẽ của chị Dậu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Xuân Diệu được nhà phê bình Hoài Thanh ngợi ca là ''nhà thơ mới nhất trong các nhà thơ mới''.',
    N'Đúng', N'Sai', N'', N'',
    'true', '28ECFFD8-CD21-4DC6-849E-79AE7AA12F81', 'medium', GETDATE(), N'Được tôn vinh là ông hoàng thơ tình của phong trào Thơ mới.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Bài thơ ''Vội vàng'' của Xuân Diệu thể hiện tâm trạng buồn rầu, chán chường và muốn xa lánh trần thế.',
    N'Đúng', N'Sai', N'', N'',
    'false', '28ECFFD8-CD21-4DC6-849E-79AE7AA12F81', 'medium', GETDATE(), N'Ngược lại, ''Vội vàng'' chứa chan lòng ham sống, khát khao tận hưởng từng khoảnh khắc tuổi trẻ.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Ai là tác giả của thi phẩm tình yêu nổi tiếng ''Vội vàng'' trong phong trào Thơ mới?',
    N'', N'', N'', N'',
    N'Xuân Diệu', '28ECFFD8-CD21-4DC6-849E-79AE7AA12F81', 'medium', GETDATE(), N'Xuân Diệu sáng tác ''Vội vàng'' in trong tập ''Thơ thơ'' (1938).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'E1061C9D-0952-40B9-8255-C9F7FE234238', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Xuân Diệu được mệnh danh là ''ông hoàng ...'' của nền thơ ca hiện đại Việt Nam?',
    N'', N'', N'', N'',
    N'thơ tình', '28ECFFD8-CD21-4DC6-849E-79AE7AA12F81', 'medium', GETDATE(), N'Ông hoàng thơ tình Xuân Diệu.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Một cung phản xạ hoàn chỉnh gồm 5 bộ phận: thụ thể cảm giác, neuron hướng tâm, trung ương thần kinh, neuron ly tâm và cơ quan đáp ứng.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'DACC5052-7451-4A26-9A6D-B8E9C13055F3', 'medium', GETDATE(), N'Cấu trúc kinh điển của cung phản xạ thần kinh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cung phản xạ chỉ tồn tại ở các loài động vật bậc thấp chưa có hệ thần kinh phát triển.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'DACC5052-7451-4A26-9A6D-B8E9C13055F3', 'medium', GETDATE(), N'Phản xạ chỉ có ở sinh vật có hệ thần kinh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Một cung phản xạ đầy đủ được cấu thành từ bao nhiêu thành phần cơ bản?',
    N'', N'', N'', N'',
    N'5 thành phần', 'DACC5052-7451-4A26-9A6D-B8E9C13055F3', 'medium', GETDATE(), N'Gồm thụ thể, đường hướng tâm, trung ương, đường ly tâm và cơ quan thực hiện.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Thành phần nào của cung phản xạ trực tiếp tiếp nhận kích thích từ môi trường ngoài?',
    N'', N'', N'', N'',
    N'Thụ thể cảm giác', 'DACC5052-7451-4A26-9A6D-B8E9C13055F3', 'medium', GETDATE(), N'Thụ thể tiếp nhận kích thích chuyển thành xung thần kinh.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Bản chất của hô hấp tế bào là quá trình phân giải chất hữu cơ để giải phóng năng lượng ATP.',
    N'Đúng', N'Sai', N'', N'',
    'true', '94471C52-83D3-4550-87DD-054DC8AD034F', 'medium', GETDATE(), N'Hô hấp tế bào biến đổi năng lượng hóa học thành dạng ATP dễ sử dụng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí cacbonic (CO2) là nguyên liệu cần thiết ban đầu để tế bào thực hiện hô hấp hiếu khí.',
    N'Đúng', N'Sai', N'', N'',
    'false', '94471C52-83D3-4550-87DD-054DC8AD034F', 'medium', GETDATE(), N'Nguyên liệu là glucose và O2; CO2 là sản phẩm thải của quá trình.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Bào quan nào trong tế bào nhân thực được coi là ''trung tâm năng lượng'' của hô hấp?',
    N'', N'', N'', N'',
    N'Ti thể', '94471C52-83D3-4550-87DD-054DC8AD034F', 'medium', GETDATE(), N'Ti thể là nơi diễn ra chu trình Crep và chuỗi truyền electron hô hấp.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đồng tiền năng lượng chủ yếu được tạo ra trong quá trình hô hấp tế bào viết tắt là gì?',
    N'', N'', N'', N'',
    N'ATP', '94471C52-83D3-4550-87DD-054DC8AD034F', 'medium', GETDATE(), N'Adenozin triphotphat (ATP) là nguồn năng lượng của mọi tế bào.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nơron (tế bào thần kinh) là đơn vị cấu tạo và chức năng cơ bản của hệ thần kinh.',
    N'Đúng', N'Sai', N'', N'',
    'true', '98EB03F9-954A-41F9-B502-8048AC0CDCAC', 'medium', GETDATE(), N'Nơron có chức năng cảm ứng và dẫn truyền xung thần kinh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Các xung thần kinh truyền từ nơron này sang nơron khác qua điểm nối tiếp gọi là xináp.',
    N'Đúng', N'Sai', N'', N'',
    'true', '98EB03F9-954A-41F9-B502-8048AC0CDCAC', 'medium', GETDATE(), N'Xinap là vị trí tiếp xúc giữa các tế bào thần kinh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cấu trúc tiếp xúc liên kết giữa hai tế bào thần kinh với nhau được gọi là gì?',
    N'', N'', N'', N'',
    N'Xináp', '98EB03F9-954A-41F9-B502-8048AC0CDCAC', 'medium', GETDATE(), N'Xináp (Synapse) là cấu trúc truyền xung giữa các nơron.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tên gọi khoa học của tế bào thần kinh trong sinh học là gì?',
    N'', N'', N'', N'',
    N'Nơron', '98EB03F9-954A-41F9-B502-8048AC0CDCAC', 'medium', GETDATE(), N'Nơron là tên gọi chuẩn của tế bào thần kinh.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Pha sáng của quá trình quang hợp ở thực vật diễn ra tại màng tilacôit của lục lạp.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'ABE60D4B-4F73-49EE-80D7-4B5565CD19E5', 'medium', GETDATE(), N'Pha sáng tổng hợp ATP và NADPH đồng thời quang phân ly nước giải phóng oxi.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khí oxy giải phóng trong quá trình quang hợp có nguồn gốc từ sự phân giải khí cacbonic (CO2).',
    N'Đúng', N'Sai', N'', N'',
    'false', 'ABE60D4B-4F73-49EE-80D7-4B5565CD19E5', 'medium', GETDATE(), N'Oxi được sinh ra từ quá trình quang phân ly nước trong pha sáng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Sắc tố chính chịu trách nhiệm hấp thụ năng lượng ánh sáng mặt trời trong lá cây là gì?',
    N'', N'', N'', N'',
    N'Diệp lục', 'ABE60D4B-4F73-49EE-80D7-4B5565CD19E5', 'medium', GETDATE(), N'Diệp lục (Clorophyll) là sắc tố chủ yếu của quang hợp.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'A9E50E33-C8B3-418C-A056-316B4DED5821', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Sản phẩm khí có ích cho hô hấp của con người được giải phóng ra từ quang hợp là khí gì?',
    N'', N'', N'', N'',
    N'Khí oxi', 'ABE60D4B-4F73-49EE-80D7-4B5565CD19E5', 'medium', GETDATE(), N'Quang hợp giải phóng khí O2 duy trì sự sống trên Trái Đất.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cấu trúc cơ bản của câu bị động (Passive voice) luôn phải có trợ động từ ''to be'' và động từ ở dạng quá khứ phân từ (V3/V-ed).',
    N'Đúng', N'Sai', N'', N'',
    'true', 'C7DB5B19-C991-4122-A236-D99260F8899C', 'medium', GETDATE(), N'Công thức tổng quát: S + be + V3/ed + (by O).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Mọi động từ trong tiếng Anh kể cả nội động từ (Intransitive verbs) đều có thể biến đổi sang câu bị động.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'C7DB5B19-C991-4122-A236-D99260F8899C', 'medium', GETDATE(), N'Chỉ ngoại động từ có tân ngữ trực tiếp mới chuyển sang bị động được.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Điền dạng quá khứ phân từ (V3) của động từ ''write'': ''The letter was ... by Lan yesterday.''',
    N'', N'', N'', N'',
    N'written', 'C7DB5B19-C991-4122-A236-D99260F8899C', 'medium', GETDATE(), N'Quá khứ phân từ của write là written.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong câu bị động, tác nhân thực hiện hành động thường đi sau giới từ nào?',
    N'', N'', N'', N'',
    N'by', 'C7DB5B19-C991-4122-A236-D99260F8899C', 'medium', GETDATE(), N'Dùng ''by + O'' để chỉ người hoặc vật thực hiện hành động.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Mệnh đề ''If'' trong câu điều kiện loại 1 thường được chia ở thì hiện tại đơn (Present Simple).',
    N'Đúng', N'Sai', N'', N'',
    'true', 'BCC18FD5-B82B-4BBC-958A-1AE9B67DE650', 'medium', GETDATE(), N'Cấu trúc: If + S + V(s/es), S + will + V-inf.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Câu điều kiện loại 1 dùng để diễn tả sự việc hoàn toàn trái ngược với thực tế ở hiện tại.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'BCC18FD5-B82B-4BBC-958A-1AE9B67DE650', 'medium', GETDATE(), N'Đó là câu điều kiện loại 2. Loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Điền trợ động từ thích hợp vào mệnh đề chính: ''If you study hard, you ... pass the exam.''',
    N'', N'', N'', N'',
    N'will', 'BCC18FD5-B82B-4BBC-958A-1AE9B67DE650', 'medium', GETDATE(), N'Mệnh đề chính câu điều kiện loại 1 dùng ''will + V-inf''.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ liên từ phủ định nào tương đương với ''If ... not'' trong câu điều kiện?',
    N'', N'', N'', N'',
    N'Unless', 'BCC18FD5-B82B-4BBC-958A-1AE9B67DE650', 'medium', GETDATE(), N'Unless = If ... not (trừ khi, nếu không).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi chuyển câu trực tiếp sang câu gián tiếp có động từ tường thuật ở quá khứ, ta bắt buộc phải lùi thì của động từ chính.',
    N'Đúng', N'Sai', N'', N'',
    'true', '1DD47D95-9702-4379-B632-0383B09ACECD', 'medium', GETDATE(), N'Quy tắc lùi thì (Backshift of tenses) khi động từ tường thuật ở dạng quá khứ (said, told).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ chỉ thời gian ''now'' trong câu trực tiếp khi chuyển sang gián tiếp vẫn giữ nguyên không đổi.',
    N'Đúng', N'Sai', N'', N'',
    'false', '1DD47D95-9702-4379-B632-0383B09ACECD', 'medium', GETDATE(), N'''now'' phải đổi thành ''then''.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi đổi sang câu gián tiếp, trạng từ chỉ thời gian ''tomorrow'' được chuyển thành cụm từ nào?',
    N'', N'', N'', N'',
    N'the next day', '1DD47D95-9702-4379-B632-0383B09ACECD', 'medium', GETDATE(), N'''tomorrow'' đổi thành ''the next day'' hoặc ''the following day''.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong câu gián tiếp, từ chỉ nơi chốn ''here'' được đổi thành từ nào?',
    N'', N'', N'', N'',
    N'there', '1DD47D95-9702-4379-B632-0383B09ACECD', 'medium', GETDATE(), N'''here'' đổi thành ''there''.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Thì hiện tại hoàn thành (Present Perfect) sử dụng trợ động từ have/has kết hợp với động từ ở dạng V3/V-ed.',
    N'Đúng', N'Sai', N'', N'',
    'true', '00FA2FF6-E836-4FD7-88F4-47CE06B21525', 'medium', GETDATE(), N'Cấu trúc: S + have/has + V3/ed.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trạng từ chỉ thời gian ''yesterday'' là dấu hiệu nhận biết của thì hiện tại hoàn thành.',
    N'Đúng', N'Sai', N'', N'',
    'false', '00FA2FF6-E836-4FD7-88F4-47CE06B21525', 'medium', GETDATE(), N'''yesterday'' là dấu hiệu của thì quá khứ đơn (Past Simple).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Điền dạng V3 của động từ ''see'': ''I have ... this movie three times.''',
    N'', N'', N'', N'',
    N'seen', '00FA2FF6-E836-4FD7-88F4-47CE06B21525', 'medium', GETDATE(), N'Quá khứ phân từ của see là seen.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '63D911B6-DB78-4FE6-804C-265B24D23099', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trạng từ nào có nghĩa là ''chưa'' thường xuất hiện ở cuối câu phủ định và nghi vấn thì hiện tại hoàn thành?',
    N'', N'', N'', N'',
    N'yet', '00FA2FF6-E836-4FD7-88F4-47CE06B21525', 'medium', GETDATE(), N'''yet'' thường đứng cuối câu phủ định và câu hỏi.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong ngôn ngữ lập trình Python, câu lệnh điều kiện rẽ nhánh bắt đầu bằng từ khóa ''if''.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'CE0C9831-D918-41DF-B5D3-99B588373F99', 'medium', GETDATE(), N'Cú pháp rẽ nhánh cơ bản: if điều_kiện: khối_lệnh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Một câu lệnh ''if'' bắt buộc phải luôn luôn đi kèm với khối ''else''.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'CE0C9831-D918-41DF-B5D3-99B588373F99', 'medium', GETDATE(), N'Khối ''else'' là tùy chọn, không bắt buộc.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ khóa viết tắt của ''else if'' trong ngôn ngữ lập trình Python là gì?',
    N'', N'', N'', N'',
    N'elif', 'CE0C9831-D918-41DF-B5D3-99B588373F99', 'medium', GETDATE(), N'Trong Python dùng ''elif'' thay cho else if.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Toán tử so sánh bằng trong ngôn ngữ lập trình Python được viết như thế nào?',
    N'', N'', N'', N'',
    N'==', 'CE0C9831-D918-41DF-B5D3-99B588373F99', 'medium', GETDATE(), N'Dùng hai dấu bằng ''=='' để so sánh bằng.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong Python, từ khóa ''def'' được dùng để khai báo và định nghĩa một hàm mới.',
    N'Đúng', N'Sai', N'', N'',
    'true', '7A49E7C5-D3B7-4D95-9CF0-B26896E0480D', 'medium', GETDATE(), N'Cú pháp: def ten_ham(tham_so): khối_lenh.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Một hàm sau khi được định nghĩa chỉ có thể được gọi và thực thi đúng 1 lần duy nhất trong toàn bộ chương trình.',
    N'Đúng', N'Sai', N'', N'',
    'false', '7A49E7C5-D3B7-4D95-9CF0-B26896E0480D', 'medium', GETDATE(), N'Hàm có thể được gọi nhiều lần ở bất kì vị trí nào trong mã nguồn.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ khóa dùng để trả về kết quả tính toán của một hàm về nơi gọi hàm trong Python là gì?',
    N'', N'', N'', N'',
    N'return', '7A49E7C5-D3B7-4D95-9CF0-B26896E0480D', 'medium', GETDATE(), N'Lệnh ''return'' trả về giá trị kết quả.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ khóa viết tắt gồm 3 chữ cái dùng để bắt đầu định nghĩa hàm trong Python là gì?',
    N'', N'', N'', N'',
    N'def', '7A49E7C5-D3B7-4D95-9CF0-B26896E0480D', 'medium', GETDATE(), N'Viết tắt của từ ''define''.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kiểu dữ liệu ''int'' trong các ngôn ngữ lập trình dùng để lưu trữ các giá trị số nguyên.',
    N'Đúng', N'Sai', N'', N'',
    'true', '8BB95AA4-B5B0-4DFB-8F56-6FAEFF88C76E', 'medium', GETDATE(), N'int viết tắt của integer (số nguyên).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kiểu dữ liệu logic boolean (bool) có thể nhận 3 giá trị: True, False và Null.',
    N'Đúng', N'Sai', N'', N'',
    'false', '8BB95AA4-B5B0-4DFB-8F56-6FAEFF88C76E', 'medium', GETDATE(), N'Kiểu bool chỉ có hai giá trị chân lý duy nhất là True hoặc False.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Kiểu dữ liệu dùng để lưu trữ chuỗi ký tự văn bản trong ngôn ngữ Python viết tắt là gì?',
    N'', N'', N'', N'',
    N'str', '8BB95AA4-B5B0-4DFB-8F56-6FAEFF88C76E', 'medium', GETDATE(), N'str viết tắt của string (chuỗi ký tự).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tên kiểu dữ liệu lưu trữ số thực (số có dấu phẩy thập phân) trong Python là gì?',
    N'', N'', N'', N'',
    N'float', '8BB95AA4-B5B0-4DFB-8F56-6FAEFF88C76E', 'medium', GETDATE(), N'Kiểu float dùng cho số thực.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Vòng lặp ''for'' thường được sử dụng khi đã biết trước số lần lặp cụ thể hoặc duyệt qua danh sách.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'D398B0DC-B297-482E-8BEA-24CCA292DD83', 'medium', GETDATE(), N'Vòng lặp for dùng để duyệt qua tuần tự các phần tử.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Lệnh ''break'' dùng để bỏ qua lần lặp hiện tại và lập tức chuyển sang lần lặp kế tiếp.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'D398B0DC-B297-482E-8BEA-24CCA292DD83', 'medium', GETDATE(), N'Lệnh bỏ qua là ''continue''. Lệnh ''break'' sẽ dừng và thoát hẳn khỏi vòng lặp.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ khóa dùng để dừng ngay lập tức và thoát hẳn ra ngoài vòng lặp là gì?',
    N'', N'', N'', N'',
    N'break', 'D398B0DC-B297-482E-8BEA-24CCA292DD83', 'medium', GETDATE(), N'Lệnh break thoát vòng lặp.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'DAAC6A29-0684-49F2-B3B5-1A1E939B3845', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Từ khóa dùng để bỏ qua các câu lệnh còn lại trong vòng lặp hiện tại và chuyển sang bước lặp tiếp theo là gì?',
    N'', N'', N'', N'',
    N'continue', 'D398B0DC-B297-482E-8BEA-24CCA292DD83', 'medium', GETDATE(), N'Lệnh continue tiếp tục bước lặp mới.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong một cấp số cộng, hiệu số giữa hai số hạng liên tiếp luôn là một hằng số d gọi là công sai.',
    N'Đúng', N'Sai', N'', N'',
    'true', 'E04B4EE8-9737-414E-B3E8-2D87B9807CD4', 'medium', GETDATE(), N'u_{n+1} - u_n = d với mọi n >= 1.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Dãy số 2, 4, 8, 16, 32 là một cấp số cộng với công sai d = 2.',
    N'Đúng', N'Sai', N'', N'',
    'false', 'E04B4EE8-9737-414E-B3E8-2D87B9807CD4', 'medium', GETDATE(), N'Đây là cấp số nhân với công bội q = 2, không phải cấp số cộng.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cho cấp số cộng có số hạng đầu u1 = 3 và công sai d = 4. Tìm giá trị của số hạng thứ hai u2.',
    N'', N'', N'', N'',
    N'7', 'E04B4EE8-9737-414E-B3E8-2D87B9807CD4', 'medium', GETDATE(), N'u2 = u1 + d = 3 + 4 = 7.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đại lượng không đổi bằng hiệu số giữa số hạng sau và số hạng trước liền kề trong cấp số cộng gọi là gì?',
    N'', N'', N'', N'',
    N'Công sai', 'E04B4EE8-9737-414E-B3E8-2D87B9807CD4', 'medium', GETDATE(), N'Được ký hiệu là d.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Trong cấp số nhân, thương số giữa số hạng sau và số hạng trước liền kề luôn là hằng số q gọi là công bội.',
    N'Đúng', N'Sai', N'', N'',
    'true', '77745853-DC84-4DB0-A330-181ADF52B3EC', 'medium', GETDATE(), N'u_{n+1} / u_n = q với mọi n >= 1.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nếu một cấp số nhân có công bội q = 1 thì tất cả các số hạng trong dãy số đều bằng nhau.',
    N'Đúng', N'Sai', N'', N'',
    'true', '77745853-DC84-4DB0-A330-181ADF52B3EC', 'medium', GETDATE(), N'u_n = u_1 * 1^(n-1) = u_1 với mọi n.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cho cấp số nhân có u1 = 2 và công bội q = 3. Tính số hạng thứ ba u3.',
    N'', N'', N'', N'',
    N'18', '77745853-DC84-4DB0-A330-181ADF52B3EC', 'medium', GETDATE(), N'u3 = u1 * q^2 = 2 * 9 = 18.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tỉ số không đổi giữa số hạng sau và số hạng trước trong cấp số nhân được gọi là gì?',
    N'', N'', N'', N'',
    N'Công bội', '77745853-DC84-4DB0-A330-181ADF52B3EC', 'medium', GETDATE(), N'Ký hiệu là q.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đẳng thức sin²(x) + cos²(x) = 1 luôn đúng với mọi góc lượng giác x.',
    N'Đúng', N'Sai', N'', N'',
    'true', '3B85574B-B6BC-45A2-84BF-9135FD8651BC', 'medium', GETDATE(), N'Hằng đẳng thức lượng giác cơ bản số 1.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Công thức nhân đôi sin(2x) = sin(x) + cos(x).',
    N'Đúng', N'Sai', N'', N'',
    'false', '3B85574B-B6BC-45A2-84BF-9135FD8651BC', 'medium', GETDATE(), N'Công thức đúng là sin(2x) = 2*sin(x)*cos(x).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Tính giá trị của biểu thức lượng giác: sin²(30°) + cos²(30°).',
    N'', N'', N'', N'',
    N'1', '3B85574B-B6BC-45A2-84BF-9135FD8651BC', 'medium', GETDATE(), N'Theo hệ thức cơ bản sin²a + cos²a = 1.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Theo công thức nhân đôi, cos(2x) bằng cos²(x) trừ đi đại lượng nào?',
    N'', N'', N'', N'',
    N'sin²(x)', '3B85574B-B6BC-45A2-84BF-9135FD8651BC', 'medium', GETDATE(), N'cos(2x) = cos²(x) - sin²(x).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Phương trình sin(x) = m có nghiệm thực khi và chỉ khi m thuộc đoạn [-1, 1].',
    N'Đúng', N'Sai', N'', N'',
    'true', '5CA46F5E-F9E1-47FE-B833-1907AF33E711', 'medium', GETDATE(), N'Vì tập giá trị của hàm sin(x) là đoạn [-1, 1].', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Phương trình cos(x) = 2 có vô số nghiệm thực trên tập số thực R.',
    N'Đúng', N'Sai', N'', N'',
    'false', '5CA46F5E-F9E1-47FE-B833-1907AF33E711', 'medium', GETDATE(), N'Phương trình vô nghiệm vì 2 > 1 vượt quá miền giá trị của cos(x).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Nghiệm cơ bản của phương trình tan(x) = 0 có dạng x = k nhân với số nào (k thuộc Z)?',
    N'', N'', N'', N'',
    N'pi', '5CA46F5E-F9E1-47FE-B833-1907AF33E711', 'medium', GETDATE(), N'tan(x) = 0 khi sin(x) = 0, nghiệm là x = k*pi.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), 'D0060DC6-E7F7-4291-A6B8-CD0A625D7BEA', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Phương trình cos(x) = 1 có nghiệm x = k * 2pi. Đúng hay Sai?',
    N'', N'', N'', N'',
    N'Đúng', '5CA46F5E-F9E1-47FE-B833-1907AF33E711', 'medium', GETDATE(), N'Nghiệm của cos(x) = 1 là x = k2pi.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chu kì T và tần số f trong dao động điều hòa liên hệ với nhau theo công thức f = 1/T.',
    N'Đúng', N'Sai', N'', N'',
    'true', '80C40D9A-26B3-4AC3-9A7D-A7F69BC5D4C6', 'medium', GETDATE(), N'Tần số f là số dao động thực hiện trong một giây.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đơn vị chuẩn của tần số dao động trong hệ đo lường quốc tế SI là Giây (s).',
    N'Đúng', N'Sai', N'', N'',
    'false', '80C40D9A-26B3-4AC3-9A7D-A7F69BC5D4C6', 'medium', GETDATE(), N'Đơn vị của tần số là Héc (Hz), giây là đơn vị của chu kì.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đơn vị đo chuẩn của tần số dao động trong hệ SI viết tắt là gì?',
    N'', N'', N'', N'',
    N'Hz', '80C40D9A-26B3-4AC3-9A7D-A7F69BC5D4C6', 'medium', GETDATE(), N'Viết tắt của Héc (Hertz).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khoảng thời gian ngắn nhất để vật lặp lại trạng thái dao động như cũ được gọi là gì?',
    N'', N'', N'', N'',
    N'Chu kì', '80C40D9A-26B3-4AC3-9A7D-A7F69BC5D4C6', 'medium', GETDATE(), N'Chu kì dao động (T).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Chu kì dao động điều hòa của con lắc lò xo phụ thuộc vào khối lượng của vật nặng và độ cứng của lò xo.',
    N'Đúng', N'Sai', N'', N'',
    'true', '996E2580-397E-4C34-A0C5-D3B93B0E3BC1', 'medium', GETDATE(), N'Công thức T = 2*pi*sqrt(m/k).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi kéo vật lệch xa hơn gấp đôi vị trí cân bằng thì chu kì dao động của con lắc lò xo cũng tăng gấp đôi.',
    N'Đúng', N'Sai', N'', N'',
    'false', '996E2580-397E-4C34-A0C5-D3B93B0E3BC1', 'medium', GETDATE(), N'Chu kì dao động của con lắc lò xo không phụ thuộc vào biên độ dao động.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Độ cứng của lò xo thường được ký hiệu bằng chữ cái nào?',
    N'', N'', N'', N'',
    N'k', '996E2580-397E-4C34-A0C5-D3B93B0E3BC1', 'medium', GETDATE(), N'Độ cứng lò xo ký hiệu là k (đơn vị N/m).', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi tăng khối lượng m của vật nặng lên 4 lần thì chu kì T của con lắc lò xo tăng lên mấy lần?',
    N'', N'', N'', N'',
    N'2 lần', '996E2580-397E-4C34-A0C5-D3B93B0E3BC1', 'medium', GETDATE(), N'T tỉ lệ thuận với căn bậc hai của m, sqrt(4) = 2.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Lực tương tác tĩnh điện giữa hai điện tích điểm tỉ lệ nghịch với bình phương khoảng cách giữa chúng.',
    N'Đúng', N'Sai', N'', N'',
    'true', '21150FA8-0B76-4A6A-9147-4C44CFBA40D7', 'medium', GETDATE(), N'Định luật Cu-lông: F = k * |q1*q2| / (r^2).', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hai điện tích điểm cùng dấu (cùng dương hoặc cùng âm) khi đặt gần nhau sẽ hút nhau.',
    N'Đúng', N'Sai', N'', N'',
    'false', '21150FA8-0B76-4A6A-9147-4C44CFBA40D7', 'medium', GETDATE(), N'Điện tích cùng dấu đẩy nhau, trái dấu mới hút nhau.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hai điện tích cùng dấu khi đặt gần nhau sẽ đẩy nhau hay hút nhau?',
    N'', N'', N'', N'',
    N'Đẩy nhau', '21150FA8-0B76-4A6A-9147-4C44CFBA40D7', 'medium', GETDATE(), N'Cùng dấu thì tương tác đẩy.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Hằng số k trong định luật Cu-lông trong chân không xấp xỉ bằng 9 nhân 10 mũ mấy?',
    N'', N'', N'', N'',
    N'9', '21150FA8-0B76-4A6A-9147-4C44CFBA40D7', 'medium', GETDATE(), N'k = 9 * 10^9 N.m2/C2.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Cường độ dòng điện chạy qua một đoạn mạch tỉ lệ thuận với hiệu điện thế giữa hai đầu đoạn mạch đó.',
    N'Đúng', N'Sai', N'', N'',
    'true', '5D35A535-E4A4-40A1-B357-8EBF3C0C7B08', 'medium', GETDATE(), N'Định luật Ôm: I = U / R.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Khi tăng hiệu điện thế U lên 2 lần thì điện trở R của đoạn dây kim loại cũng tự động tăng gấp đôi.',
    N'Đúng', N'Sai', N'', N'',
    'false', '5D35A535-E4A4-40A1-B357-8EBF3C0C7B08', 'medium', GETDATE(), N'Điện trở R là đại lượng đặc trưng cho vật dẫn, không đổi khi thay đổi U.', 'true_false'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Viết công thức định luật Ôm cho đoạn mạch thuần điện trở: I = ?',
    N'', N'', N'', N'',
    N'U/R', '5D35A535-E4A4-40A1-B357-8EBF3C0C7B08', 'medium', GETDATE(), N'I = U / R.', 'essay'
);

INSERT INTO [Questions] (
    [Id], [SubjectId], [TeacherId], [GradeId], [NoiDung],
    [OptionA], [OptionB], [OptionC], [OptionD],
    [CorrectAnswer], [TopicId], [Difficulty], [CreatedAt], [Explanation], [Type]
) VALUES (
    NEWID(), '5CA64CC7-95F6-4D22-995B-720B7FDAD597', '1081A0E9-B18A-4028-8AB9-50897108A889', '41A0DB31-C8A7-4420-927D-18E661175B46', N'Đơn vị đo điện trở trong hệ đơn vị quốc tế SI là gì?',
    N'', N'', N'', N'',
    N'Om', '5D35A535-E4A4-40A1-B357-8EBF3C0C7B08', 'medium', GETDATE(), N'Đơn vị là Ôm (kí hiệu Omega).', 'essay'
);

COMMIT TRANSACTION;
PRINT N'Đã thêm thành công 160 câu hỏi (Đúng/Sai và Tự luận) vào CSDL cho Lớp 11!';