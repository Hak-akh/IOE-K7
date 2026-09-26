import { Question } from '../types';
import { getQuestionVietnameseTranslation } from './sentenceReconstructor';

/**
 * Generates tailored, pedagogical 3-level hints for any IOE Grade 7 question
 * Level 1: Context & Meaning Orientation (without revealing answer)
 * Level 2: Grammar structure & Key clues
 * Level 3: Near-answer clue / Word shape / Elimination
 */
export function getQuestionHints(question: Question): [string, string, string] {
  const ans = (question.answer || '').trim();
  const qText = (question.question || '').trim();
  const viTrans = getQuestionVietnameseTranslation(question);
  const type = question.type;

  // Level 1: Context orientation
  let hint1 = '';
  // Level 2: Grammar / structural clue
  let hint2 = '';
  // Level 3: Near-answer clue
  let hint3 = '';

  // 1. WORD ORDER
  if (type === 'word_order') {
    const isQuestion = qText.includes('?') || ans.endsWith('?');
    if (isQuestion) {
      hint1 = `Đây là một câu hỏi (kết thúc bằng dấu '?'). Hãy tìm từ để hỏi (Wh-) hoặc trợ động từ viết hoa để đặt ở đầu câu.`;
      hint2 = `Cấu trúc câu hỏi: Từ để hỏi (hoặc Trợ động từ) + Chủ ngữ + Động từ chính + Tân ngữ / Bổ ngữ. Chú ý nghĩa câu: "${viTrans}".`;
    } else {
      hint1 = `Đây là câu trần thuật (kết thúc bằng dấu chấm '.'). Hãy tìm từ hoặc cụm từ viết hoa để làm chủ ngữ đứng đầu câu.`;
      hint2 = `Cấu trúc câu: Chủ ngữ + (Trạng từ tần suất) + Động từ + Tân ngữ / Trạng ngữ. Nghĩa của câu là: "${viTrans}".`;
    }

    const firstWord = ans.split(' ')[0] || '';
    const lastWord = ans.split(' ').slice(-1)[0] || '';
    hint3 = `Từ bắt đầu câu là "${firstWord}" và từ kết thúc câu là "${lastWord}".`;
    return [hint1, hint2, hint3];
  }

  // 2. FILL BLANK / LISTENING FILL
  if (type === 'fill_blank' || type === 'fill-blank' as any || type === 'listening_fill') {
    const blankCount = (qText.match(/_/g) || []).length;
    const ansLen = ans.length;

    hint1 = `Câu này có nghĩa tiếng Việt là: "${viTrans}". Hãy đọc kỹ ngữ cảnh xung quanh chỗ trống để đoán từ phù hợp.`;

    if (question.grammarPoint && question.grammarPoint !== 'General') {
      hint2 = `Điểm ngữ pháp cần chú ý: ${question.grammarPoint}. Xác định từ loại cần điền (danh từ, động từ, tính từ hay giới từ).`;
    } else if (blankCount > 0) {
      hint2 = `Vị trí khuyết yêu cầu từ cần điền có đúng ${ansLen} ký tự. Xem xét từ đứng ngay trước và ngay sau chỗ trống để xác định thì và dạng của từ.`;
    } else {
      hint2 = `Từ cần điền có độ dài ${ansLen} chữ cái. Hãy chú ý thì của động từ hoặc cấu trúc câu.`;
    }

    if (ansLen === 1) {
      hint3 = `Ký tự cần điền là chữ "${ans.toUpperCase()}".`;
    } else if (ansLen <= 3) {
      hint3 = `Từ cần điền gồm ${ansLen} chữ cái, bắt đầu bằng chữ cái '${ans[0].toLowerCase()}'.`;
    } else {
      hint3 = `Từ cần điền gồm ${ansLen} chữ cái, bắt đầu bằng '${ans.slice(0, 2).toLowerCase()}...' và kết thúc bằng '...${ans.slice(-1).toLowerCase()}'.`;
    }
    return [hint1, hint2, hint3];
  }

  // 3. MULTIPLE CHOICE / LISTENING MULTIPLE CHOICE
  if (type === 'multiple_choice' || type === 'listening_multiple_choice' || type === 'listening' as any) {
    hint1 = `Nghĩa của câu là: "${viTrans}". Hãy đối chiếu 4 phương án lựa chọn xem từ/cụm từ nào phù hợp nhất với ngữ cảnh này.`;

    if (question.grammarPoint && question.grammarPoint !== 'General') {
      hint2 = `Chú ý chủ điểm ngữ pháp: "${question.grammarPoint}". Kiểm tra sự hòa hợp giữa chủ ngữ - động từ, giới từ đi kèm hoặc thì của câu.`;
    } else if (question.options && question.options.length >= 2) {
      hint2 = `Quan sát các đáp án lựa chọn để nhận biết: Đây là câu hỏi về từ vựng (nghĩa khác nhau) hay ngữ pháp (các dạng chia của từ).`;
    } else {
      hint2 = `Chú ý cấu trúc câu và từ đứng liền trước/sau vị trí cần chọn.`;
    }

    // Level 3: Eliminates 1-2 wrong options or provides a decisive tip
    if (question.options && question.options.length === 4) {
      const wrongOpts = question.options.filter(o => o.toLowerCase().trim() !== ans.toLowerCase().trim());
      const eliminated = wrongOpts.slice(0, 2).map(o => o.replace(/^[A-D]\.\s*/i, '').trim()).join(' và ');
      hint3 = `Gợi ý loại trừ: Phương án (${eliminated}) không phù hợp với cấu trúc ngữ pháp của câu.`;
    } else {
      hint3 = `Đáp án đúng bắt đầu bằng chữ cái '${ans[0]}'. Hãy kiểm tra kỹ phương án bắt đầu bằng chữ này.`;
    }
    return [hint1, hint2, hint3];
  }

  // 4. ODD ONE OUT / PRONUNCIATION / STRESS
  if (type === 'odd_one_out') {
    hint1 = `Xác định từ loại hoặc nhóm chủ đề (ví dụ: đồ dùng học tập, đồ ăn, nghề nghiệp, thời tiết...) của các từ.`;
    hint2 = `Ba trong số bốn từ thuộc cùng một nhóm chủ đề hoặc cùng một từ loại (danh từ/động từ/tính từ).`;
    hint3 = `Từ khác biệt là từ không cùng nhóm chủ đề với 3 từ còn lại. Đáp án bắt đầu bằng chữ '${ans[0]}'.`;
    return [hint1, hint2, hint3];
  }

  if (type === 'pronunciation') {
    hint1 = `Đọc to từng từ và chú ý đến cách phát âm của phần chữ cái được gạch chân hoặc in hoa.`;
    hint2 = `Chú ý các quy tắc phát âm đuôi -s/es, đuôi -ed hoặc nguyên âm ngắn/nguyên âm dài.`;
    hint3 = `Đáp án là từ có phần phát âm khác biệt với 3 từ còn lại.`;
    return [hint1, hint2, hint3];
  }

  if (type === 'stress') {
    hint1 = `Xác định số lượng âm tiết của mỗi từ (thường là từ có 2 hoặc 3 âm tiết).`;
    hint2 = `Đa số danh từ/tính từ 2 âm tiết nhấn trọng âm 1, đa số động từ 2 âm tiết nhấn trọng âm 2.`;
    hint3 = `Đáp án là từ có trọng âm rơi vào vị trí khác biệt so với các từ còn lại.`;
    return [hint1, hint2, hint3];
  }

  // General default fallback
  hint1 = `Nghĩa của câu là: "${viTrans}". Hãy đọc kỹ ngữ cảnh câu hỏi.`;
  hint2 = `Xem xét kỹ cấu trúc câu và các từ khóa chính.`;
  hint3 = `Đáp án bắt đầu bằng chữ cái '${ans[0] || 'A'}'.`;
  return [hint1, hint2, hint3];
}
