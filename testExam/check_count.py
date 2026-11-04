import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
target_path = os.path.join(base_dir, 'js', 'questions.js')

with open(target_path, 'r', encoding='utf-8') as f:
    text = f.read()

aws_count = len(re.findall(r'"id":\s*"AWS\d+"|\bid:\s*\'AWS\d+\'', text))
cbt_count = len(re.findall(r'"id":\s*"CBT\d+"|\bid:\s*\'CBT\d+\'', text))

print(f'Total AWS SAA questions in questions.js: {aws_count}')
print(f'Total CBT questions in questions.js: {cbt_count}')
print(f'File size: {len(text):,} bytes')
