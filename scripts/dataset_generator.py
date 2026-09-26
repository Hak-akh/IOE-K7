import os
import json
import random
from normalizer import normalize_question
from raw_bo01 import get_bo01
from raw_bo02 import get_bo02
from raw_bo03 import get_bo03
from raw_bo04 import get_bo04

def main():
    print("Loading base sets 01 to 04...")
    bo01 = get_bo01()
    bo02 = get_bo02()
    bo03 = get_bo03()
    bo04 = get_bo04()

    all_base_questions = []
    for b in [bo01, bo02, bo03, bo04]:
        all_base_questions.extend(b["questions"])

    print(f"Total base questions loaded: {len(all_base_questions)}")

    # Collect questions into categories
    mc_questions = [q for q in all_base_questions if q["type"] == "multiple_choice"]
    fill_questions = [q for q in all_base_questions if q["type"] == "fill_blank"]
    order_questions = [q for q in all_base_questions if q["type"] == "word_order"]
    audio_questions = [q for q in all_base_questions if "listening" in q["type"] or q.get("audio")]
    pronun_questions = [q for q in all_base_questions if q["type"] in ("pronunciation", "stress", "odd_one_out")]
    image_questions = [q for q in all_base_questions if "image" in q["type"]]

    print(f"MC: {len(mc_questions)}, Fill: {len(fill_questions)}, Order: {len(order_questions)}, Audio: {len(audio_questions)}, Pronun: {len(pronun_questions)}, Image: {len(image_questions)}")

    # Create root directory output and public output
    os.makedirs("./public", exist_ok=True)

    # We will generate bo00 to bo50 (51 sets)
    # Each set has exactly 200 questions
    sets_summary = []

    for set_idx in range(51):
        set_id = f"bo{set_idx:02d}"
        file_name = f"{set_id}.json"
        title = f"IOE K7 2024–2025 - Bộ đề {set_idx:02d}"

        if set_idx == 1:
            q_list = bo01["questions"]
        elif set_idx == 2:
            q_list = bo02["questions"]
        elif set_idx == 3:
            q_list = bo03["questions"]
        elif set_idx == 4:
            q_list = bo04["questions"]
        else:
            # Generate deterministic, high-quality set using seed
            rng = random.Random(set_idx * 1000 + 42)
            # Pick a rich mixture of question types:
            selected_mc = rng.sample(mc_questions, min(len(mc_questions), 60))
            selected_fill = rng.sample(fill_questions, min(len(fill_questions), 60))
            selected_order = rng.sample(order_questions, min(len(order_questions), 45))
            selected_audio = rng.sample(audio_questions, min(len(audio_questions), 25))
            selected_pronun = rng.sample(pronun_questions, min(len(pronun_questions), 10))

            pool = selected_mc + selected_fill + selected_order + selected_audio + selected_pronun
            if len(pool) < 200:
                remaining_needed = 200 - len(pool)
                candidates = [q for q in all_base_questions if q not in pool]
                if len(candidates) < remaining_needed:
                    pad = rng.choices(all_base_questions, k=remaining_needed)
                else:
                    pad = rng.sample(candidates, remaining_needed)
                pool.extend(pad)
            
            # Exactly 200 questions
            pool = pool[:200]
            rng.shuffle(pool)

            # Re-index questions for this set
            q_list = []
            for num, base_q in enumerate(pool, start=1):
                new_q = json.loads(json.dumps(base_q)) # deepcopy
                new_q["id"] = f"{set_id}-q{num:03d}"
                new_q["number"] = num
                q_list.append(new_q)

        data = {
            "examId": f"{set_idx:02d}",
            "setId": set_id,
            "title": title,
            "totalQuestions": len(q_list),
            "questions": q_list
        }

        # Write to root (for GitHub Pages flat structure)
        with open(f"./{file_name}", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Also write to public/ (for Vite dev server and build)
        with open(f"./public/{file_name}", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        sets_summary.append({
            "setId": set_id,
            "examId": f"{set_idx:02d}",
            "title": title,
            "totalQuestions": len(q_list),
            "file": f"./{file_name}"
        })
        print(f"Generated {file_name}: {len(q_list)} questions")

    # Save metadata index
    index_data = {
        "title": "IOE K7 2024-2025 Dataset Index",
        "totalSets": len(sets_summary),
        "totalQuestions": sum(s["totalQuestions"] for s in sets_summary),
        "sets": sets_summary
    }
    with open("./sets_index.json", "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    with open("./public/sets_index.json", "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"Done! Generated {len(sets_summary)} sets, total questions: {index_data['totalQuestions']}")

if __name__ == "__main__":
    main()
