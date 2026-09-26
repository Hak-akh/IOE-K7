// Strict validation script for all 51 sets of IOE K7 2024-2025 (ES Module)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOTAL_SETS = 51;
const QUESTIONS_PER_SET = 200;
const EXPECTED_TOTAL_QUESTIONS = TOTAL_SETS * QUESTIONS_PER_SET;

let totalErrors = 0;
let validatedQuestions = 0;
let validatedSets = 0;

console.log('====================================================');
console.log('KIỂM TRA DỮ LIỆU TOÀN DIỆN - IOE K7 2024-2025');
console.log(`Mục tiêu: ${TOTAL_SETS} bộ đề × ${QUESTIONS_PER_SET} câu = ${EXPECTED_TOTAL_QUESTIONS} câu`);
console.log('====================================================\n');

for (let i = 0; i < TOTAL_SETS; i++) {
  const setId = `bo${String(i).padStart(2, '0')}`;
  const filePath = path.join(__dirname, `${setId}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ [LỖI THIẾU BỘ]: Không tìm thấy file ${setId}.json`);
    totalErrors++;
    continue;
  }

  let content;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    content = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ [LỖI ĐỊNH DẠNG JSON]: File ${setId}.json bị lỗi cú pháp: ${err.message}`);
    totalErrors++;
    continue;
  }

  if (!content.questions || !Array.isArray(content.questions)) {
    console.error(`❌ [LỖI DỮ LIỆU]: ${setId}.json không có mảng questions hợp lệ`);
    totalErrors++;
    continue;
  }

  if (content.questions.length !== QUESTIONS_PER_SET) {
    console.error(`❌ [LỖI SỐ LƯỢNG]: ${setId}.json có ${content.questions.length} câu (yêu cầu đúng ${QUESTIONS_PER_SET} câu)`);
    totalErrors++;
  }

  let setErrors = 0;
  content.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    if (!q.id) {
      console.error(`❌ ${setId} Câu ${qNum}: Thiếu id`);
      setErrors++;
    }
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
      console.error(`❌ ${setId} Câu ${qNum}: Nội dung câu hỏi rỗng`);
      setErrors++;
    }
    if (!q.answer || typeof q.answer !== 'string' || q.answer.trim().length === 0) {
      console.error(`❌ ${setId} Câu ${qNum}: Đáp án rỗng`);
      setErrors++;
    }
    if (!q.type) {
      console.error(`❌ ${setId} Câu ${qNum}: Thiếu loại câu hỏi (type)`);
      setErrors++;
    }
    if (q.type === 'multiple_choice' || q.type === 'listening_multiple_choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        console.error(`❌ ${setId} Câu ${qNum}: multiple_choice thiếu options hợp lệ`);
        setErrors++;
      }
    }
    validatedQuestions++;
  });

  if (setErrors === 0) {
    validatedSets++;
  } else {
    totalErrors += setErrors;
  }
}

console.log('\n====================================================');
console.log('KẾT QUẢ KIỂM TRA:');
console.log(`- Số bộ đề hợp lệ: ${validatedSets}/${TOTAL_SETS}`);
console.log(`- Tổng số câu hỏi đã kiểm tra: ${validatedQuestions}/${EXPECTED_TOTAL_QUESTIONS}`);
console.log(`- Tổng số lỗi phát hiện: ${totalErrors}`);
console.log('====================================================');

if (totalErrors === 0 && validatedSets === TOTAL_SETS && validatedQuestions === EXPECTED_TOTAL_QUESTIONS) {
  console.log('✅ TOÀN BỘ 51 BỘ ĐỀ VÀ 10.200 CÂU HỎI ĐÃ ĐẠT CHUẨN 100%!');
  process.exit(0);
} else {
  console.error('❌ CẦN SỬA LỖI TRƯỚC KHI DEPLOY!');
  process.exit(1);
}
