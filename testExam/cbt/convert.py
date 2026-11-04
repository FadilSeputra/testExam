import os
import sys
import re
import json

def clean_table_line(line):
    stripped = line.strip()
    if stripped.startswith('|') and stripped.endswith('|'):
        cells = [c.strip() for c in stripped.split('|')[1:-1]]
        if all(set(c) <= set('-: ') for c in cells if c):
            return None
        non_empty = [c for c in cells if c]
        return ' '.join(non_empty)
    return line

def clean_text_block(block):
    lines = block.splitlines()
    out = []
    for l in lines:
        cleaned_l = clean_table_line(l)
        if cleaned_l is not None:
            out.append(cleaned_l)
    return '\n'.join(out)

def normalize_spaces(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_cbt_markdown(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # Filter out page footer watermarks
    clean_lines = []
    for line in raw_text.splitlines():
        if 'TuntasCBTISalingMembantuMenggapaiImpian' in line:
            continue
        clean_lines.append(line)
    cleaned_raw = '\n'.join(clean_lines)

    ans_matches = list(re.finditer(r'ANS\s*:\s*([A-Ea-e])', cleaned_raw))
    if len(ans_matches) != 200:
        raise ValueError(f"Expected 200 ANS matches, found {len(ans_matches)}")

    letter_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
    parsed_questions = []

    for i in range(200):
        q_num = i + 1
        cur_ans_m = ans_matches[i]
        ans_letter = cur_ans_m.group(1).upper()

        prev_boundary = ans_matches[i - 1].end() if i > 0 else 0
        ans_start = cur_ans_m.start()
        ans_end = cur_ans_m.end()

        # Text before current ANS contains previous explanation (if i > 0) + Q[i] + options
        pre_text = cleaned_raw[prev_boundary:ans_start]

        # Match Q number marker
        m_q = list(re.finditer(rf'(?:^|\n)\s*{q_num}\s*\.\s*', pre_text))
        if not m_q:
            raise ValueError(f"Cannot find Q{q_num} start in pre_text")
        q_start_idx = m_q[-1].end()

        q_and_opts_raw = pre_text[q_start_idx:]
        q_and_opts = clean_text_block(q_and_opts_raw)

        opt_a_m = re.search(r'(?:^|\n)\s*a\.\s*', q_and_opts)
        opt_b_m = re.search(r'(?:^|\n)\s*b\.\s*', q_and_opts)
        opt_c_m = re.search(r'(?:^|\n)\s*c\.\s*', q_and_opts)
        opt_d_m = re.search(r'(?:^|\n)\s*d\.\s*', q_and_opts)
        opt_e_m = re.search(r'(?:^|\n)\s*e\.\s*', q_and_opts)

        if not (opt_a_m and opt_b_m and opt_c_m and opt_d_m and opt_e_m):
            raise ValueError(f"Cannot find all 5 options in Q{q_num}")

        q_text = q_and_opts[:opt_a_m.start()].strip()
        opt_a = normalize_spaces(q_and_opts[opt_a_m.end():opt_b_m.start()])
        opt_b = normalize_spaces(q_and_opts[opt_b_m.end():opt_c_m.start()])
        opt_c = normalize_spaces(q_and_opts[opt_c_m.end():opt_d_m.start()])
        opt_d = normalize_spaces(q_and_opts[opt_d_m.end():opt_e_m.start()])
        opt_e = normalize_spaces(q_and_opts[opt_e_m.end():])

        # Explanation
        if i < 199:
            next_ans_start = ans_matches[i + 1].start()
            between_text = cleaned_raw[ans_end:next_ans_start]
            next_q_num = i + 2
            m_next = re.search(rf'(?:^|\n)\s*{next_q_num}\s*\.\s*', between_text)
            exp_text = between_text[:m_next.start()] if m_next else between_text
        else:
            exp_text = cleaned_raw[ans_end:]

        # Clean quotes and banners from explanation
        exp_text = re.sub(r'‘’.*?‘’', '', exp_text, flags=re.DOTALL)
        exp_text = exp_text.strip()

        parsed_questions.append({
            "id": f"CBT{q_num}",
            "number": q_num,
            "question": q_text,
            "options": [opt_a, opt_b, opt_c, opt_d, opt_e],
            "answer": letter_to_idx[ans_letter],
            "answerLetter": ans_letter,
            "explanation": exp_text,
            "isMultiSelect": False
        })

    return parsed_questions

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, ".."))
    workspace_root = os.path.abspath(os.path.join(project_root, ".."))

    # Source markdown
    source_md = os.path.join(base_dir, "hasil.md")
    if not os.path.exists(source_md):
        source_md = os.path.join(workspace_root, "hasil.md")

    print(f"Reading and parsing from: {source_md}")
    questions = parse_cbt_markdown(source_md)
    print(f"Parsed {len(questions)} questions successfully.")

    # 1. Save testExam/cbt/parsed_questions.json
    out_cbt_json = os.path.join(base_dir, "parsed_questions.json")
    with open(out_cbt_json, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_cbt_json}")

    # 2. Save testExam/js/cbt_questions.json
    js_dir = os.path.join(project_root, "js")
    out_js_cbt_json = os.path.join(js_dir, "cbt_questions.json")
    with open(out_js_cbt_json, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_js_cbt_json}")

    # 3. Save testExam/js/questions.json (standard json)
    out_js_general_json = os.path.join(js_dir, "questions.json")
    with open(out_js_general_json, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_js_general_json}")

    # 4. Update testExam/js/questions.js
    questions_js_file = os.path.join(js_dir, "questions.js")
    with open(questions_js_file, "r", encoding="utf-8") as f:
        q_js_text = f.read()

    # Check if window.QUESTION_BANK or similar exists
    cbt_json_str = json.dumps(questions, indent=2, ensure_ascii=False)

    if '"cbt1":' in q_js_text or "'cbt1':" in q_js_text or 'cbt1:' in q_js_text:
        print("cbt1 already exists in questions.js, updating section...")
        # Replace existing cbt1 block
        q_js_text = re.sub(
            r'("?cbt1"?\s*:\s*\[[\s\S]*?\](?=,\s*"?[a-zA-Z0-9_]+"?\s*:|\s*\}\s*;?\s*$))',
            f'"cbt1": {cbt_json_str}',
            q_js_text
        )
    else:
        # Find closing brace of window.QUESTION_BANK
        # Look for the last '};' or '}' in the file
        last_brace_idx = q_js_text.rfind('}')
        if last_brace_idx != -1:
            # Insert before the last brace
            prefix = q_js_text[:last_brace_idx].rstrip()
            # If ends with comma or not
            if not prefix.endswith(','):
                prefix += ','
            q_js_text = prefix + f'\n  "cbt1": {cbt_json_str}\n' + q_js_text[last_brace_idx:]
            print("Injected cbt1 into questions.js")

    with open(questions_js_file, "w", encoding="utf-8") as f:
        f.write(q_js_text)
    print(f"Updated: {questions_js_file}")

if __name__ == '__main__':
    main()
