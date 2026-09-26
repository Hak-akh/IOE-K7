# 🎯 IOE K7 2024–2025 — Chinh phục IOE K7 từng câu một

Ứng dụng web tĩnh (Static Web App) hoàn chỉnh, trực quan và tối ưu cho học sinh lớp 7 luyện thi Olympic tiếng Anh trên Internet (IOE) năm học 2024–2025.

---

## 📊 Quy mô dữ liệu chuẩn

- **51 Bộ đề**: Từ `Bộ 00` đến `Bộ 50`.
- **200 câu / bộ**: Đầy đủ 100% câu hỏi, đáp án, bản dịch, ngữ pháp và gợi ý.
- **Tổng cộng**: **10.200 câu hỏi** chất lượng cao.
- **Đã kiểm định**: Chạy script `node validate-data.js` để kiểm tra toàn bộ 51 bộ và 10.200 câu với tỷ lệ hợp lệ 100%.

---

## 🚀 Hướng dẫn Deploy trực tiếp lên GitHub Pages

Ứng dụng được thiết kế cấu trúc phẳng (Flat structure) hoàn toàn tương thích với GitHub Pages:

### Cách 1: Sử dụng giao diện GitHub Web
1. Tạo một repository mới trên GitHub (ví dụ: `IOE-K7`).
2. Tải toàn bộ các file trong thư mục dự án lên nhánh `main` (bao gồm `index.html`, các file `bo00.json` ... `bo50.json`, thư mục `src/` hoặc thư mục build `dist/`).
3. Vào **Settings** của repository -> Chọn mục **Pages**.
4. Ở phần **Build and deployment**, chọn:
   - Source: **Deploy from a branch**
   - Branch: `main` / Folder: `/ (root)` hoặc `/docs` (hoặc build qua GitHub Actions).
5. Nhấn **Save**. Sau 1-2 phút, trang web của bạn sẽ hoạt động tại địa chỉ:
   `https://<username>.github.io/<repo-name>/`

### Cách 2: Deploy bản build tối ưu (Production Build)
```bash
# Cài đặt thư viện
npm install

# Kiểm tra dữ liệu 10.200 câu hỏi
node validate-data.js

# Build ứng dụng web tĩnh
npm run build
```
Sau khi build, thư mục `dist/` chứa toàn bộ mã nguồn tĩnh và 51 file JSON, sẵn sàng tải lên bất kỳ host tĩnh nào (GitHub Pages, Vercel, Cloudflare Pages, Netlify).

---

## 🌟 Các tính năng nổi bật

### 1. Chế độ luyện tập từng câu (Practice Mode)
- Lựa chọn nhanh bất kỳ bộ đề nào trong 51 bộ (`Bộ 00` – `Bộ 50`).
- Xem tiến độ, % hoàn thành và số câu đúng/sai theo thời gian thực.
- Hỗ trợ đầy đủ các dạng bài thi IOE:
  - **Trắc nghiệm 4 lựa chọn (A, B, C, D)** với phím tắt nhanh (`1, 2, 3, 4` hoặc `A, B, C, D`).
  - **Điền từ vào chỗ trống / Điền ký tự còn thiếu** (`_ _ _ _ _`).
  - **Sắp xếp cụm từ thành câu hoàn chỉnh (Word Order)** với chip tương tác bấm chọn / hoàn tác linh hoạt.
  - **Bài nghe Audio IOE** với trình phát có điều chỉnh tốc độ (0.8x, 1.0x, 1.2x) và tua lại.
  - **Phát âm từ & câu (Text-to-Speech)** chuẩn giọng bản xứ Mỹ.

### 2. Hệ thống hỗ trợ học tập chuyên sâu
- 💡 **Gợi ý 3 cấp độ (3-Level Hints)**:
  - *Bậc 1*: Nhận diện cấu trúc và loại từ cần điền.
  - *Bậc 2*: Manh mối chữ cái đầu / ý nghĩa từ khoá.
  - *Bậc 3*: Hướng dẫn giải chi tiết từng bước.
- 🇻🇳 **Dịch nghĩa tiếng Việt**: Bản dịch chuẩn xác giúp học sinh hiểu sâu ngữ cảnh.
- 📖 **Ngữ pháp trọng tâm**: Điểm ngữ pháp và cấu trúc câu tương ứng của chương trình lớp 7.
- 📚 **Bảng từ vựng cần nhớ**: Liệt kê từ vựng, từ loại `(n, v, adj)`, phiên âm IPA quốc tế và nghĩa kèm nút nghe phát âm từng từ.

### 3. Thi thử IOE tính giờ (Mock Exam Mode)
- Mô phỏng phòng thi thật với đồng hồ đếm ngược (30 phút, 20 phút hoặc 10 phút).
- Thang điểm chuẩn IOE: 10 điểm / câu (tối đa 2000 điểm).
- Bảng tổng kết kết quả chi tiết, bảng điểm, xếp loại và xem lại toàn bộ câu đúng/sai.

### 4. Sổ tay câu sai (Mistake Notebook)
- Tự động gom tất cả các câu bạn từng trả lời sai trong 51 bộ đề.
- Chế độ "Làm lại câu này" giúp khắc phục điểm yếu và không lặp lại lỗi sai.
- Đánh dấu đã hiểu để đưa câu ra khỏi sổ tay.

### 5. Bộ sưu tập câu hỏi đã lưu (Bookmarks)
- Đánh dấu các câu hỏi hay, câu khó để ôn tập cấp tốc trước ngày thi.

### 6. Thống kê tiến độ & Sao lưu dữ liệu
- Bảng điều khiển phân tích số câu đã làm, tỷ lệ chính xác, lịch sử thi thử.
- Xuất file sao lưu (JSON) và khôi phục dễ dàng giữa các thiết bị mà không cần đăng nhập.
- Tự động lưu tiến độ trên trình duyệt (`localStorage`).

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, Tailwind CSS, TypeScript, React 19.
- **Biểu tượng**: Lucide Icons.
- **Âm thanh**: Web Audio API (âm thanh thông báo tương tác không phụ thuộc mạng) & Web Speech API.
- **Lưu trữ**: Trình duyệt `localStorage`.
- **Dữ liệu**: Định dạng chuẩn JSON tối ưu tốc độ tải.
