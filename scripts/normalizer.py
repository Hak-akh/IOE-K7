import json
import os
import re

def normalize_question(q, set_num):
    q_num = q.get("number") or int(q.get("id", "").split("-q")[-1] or 1)
    orig_type = q.get("type", "unknown")
    q_text = q.get("question", "")
    ans = q.get("answer", "")
    audio = q.get("audio", None)
    image = q.get("image", None)
    options = q.get("options", None)
    
    # Standardize question type
    if "/" in q_text and orig_type in ["word_order", "listening_fill"] and not audio:
        q_type = "word-order"
    elif "listening" in orig_type or audio:
        q_type = "listening"
    elif orig_type in ["multiple_choice", "image_multiple_choice"]:
        q_type = "multiple-choice"
    elif orig_type in ["fill_blank", "image_fill"]:
        q_type = "fill-blank"
    elif orig_type == "pronunciation":
        q_type = "pronunciation"
    elif orig_type == "stress":
        q_type = "stress"
    elif orig_type == "odd_one_out":
        q_type = "odd-one-out"
    elif orig_type == "word_order":
        q_type = "word-order"
    else:
        q_type = orig_type.replace("_", "-")

    tokens = None
    if q_type == "word-order" or "/" in q_text:
        # Split tokens by / and preserve punctuation as requested in Section AW & AX
        raw_tokens = [t.strip() for t in q_text.split("/") if t.strip()]
        if len(raw_tokens) >= 2:
            tokens = raw_tokens
            q_type = "word-order"

    # Normalize options if options is list of strings without A/B/C/D prefixes
    formatted_options = None
    if options and isinstance(options, list):
        formatted_options = []
        letters = ["A", "B", "C", "D", "E"]
        for idx, opt in enumerate(options):
            if opt.startswith(("A.", "B.", "C.", "D.", "A ", "B ", "C ", "D ")):
                formatted_options.append(opt)
            else:
                prefix = f"{letters[idx]}. " if idx < len(letters) else ""
                formatted_options.append(f"{prefix}{opt}")

    # Standardize answer if answer is "Chọn ý: A"
    cleaned_answer = ans
    if ans.startswith("Chọn ý:"):
        choice_letter = ans.replace("Chọn ý:", "").strip().upper()
        if formatted_options:
            for opt in formatted_options:
                if opt.startswith(f"{choice_letter}."):
                    cleaned_answer = opt[3:].strip()
                    break

    # Build smart hints
    hints = [
        f"Hãy đọc kỹ câu hỏi số {q_num} và xác định từ loại/thì của câu.",
        f"Gợi ý: Chú ý các từ khóa chính và cấu trúc trong câu.",
        f"Gợi ý gần đáp án: Đáp án bắt đầu với chữ cái '{cleaned_answer[:2]}'..." if len(cleaned_answer) >= 2 else "Xem kỹ cấu trúc để chọn đáp án phù hợp nhất."
    ]

    # Meaning translation
    translation = q.get("translation", "")
    if not translation:
        if q_type == "word-order":
            translation = f"Dịch nghĩa: {cleaned_answer}"
        else:
            translation = "Bản dịch hỗ trợ học tập – tham khảo nghĩa của câu trong ngữ cảnh đề bài."

    explanation = q.get("explanation", "")
    if not explanation:
        if q_type == "word-order":
            explanation = f"Sắp xếp các cụm từ theo trật tự cú pháp tiếng Anh: {cleaned_answer}."
        elif q_type == "listening":
            explanation = f"Dựa vào đoạn nghe và từ khóa chính, đáp án chính xác là: {cleaned_answer}."
        else:
            explanation = f"Căn cứ vào ngữ pháp và ngữ cảnh câu hỏi, đáp án đúng là: {cleaned_answer}."

    return {
        "id": q_num,
        "number": q_num,
        "uid": f"bo{set_num:02d}-q{q_num:03d}",
        "type": q_type,
        "question": q_text,
        "options": formatted_options,
        "answer": cleaned_answer,
        "tokens": tokens,
        "audio": audio,
        "image": image,
        "learning": {
            "hints": hints,
            "translation": translation,
            "vocabulary": [],
            "grammar": "Trọng tâm kiến thức chương trình Tiếng Anh lớp 7 IOE.",
            "explanation": explanation
        }
    }

print("Normalizer loaded.")
