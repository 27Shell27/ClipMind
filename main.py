from summary_generator import generate_summary_with_ai, input_link
from accuracy_check import run_quality_check
print("===Вставьте ссылку на видео Youtube===")
input_link()
print("=== СОЗДАНИЕ ВЫЖИМКИ ===")
generate_summary_with_ai()

print()
print("=== ПРОВЕРКА КАЧЕСТВА ===")

run_quality_check()