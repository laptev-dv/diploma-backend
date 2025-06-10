import json
import sys
import os
from datetime import datetime
from fpdf import FPDF
import matplotlib.pyplot as plt
import numpy as np
import uuid  # Добавим для генерации уникальных имен файлов

class PDFReport(FPDF):    
    
    def add_title(self, title):
        self.set_font('noto-serif', 'B', 14)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)
    
    def add_section_title(self, title):
        self.set_font('noto-serif', 'B', 12)
        self.cell(0, 8, title, 0, 1, 'L')
        self.ln(3)
    
    def add_table(self, data, col_widths, header=None):
        self.set_font('noto-serif', '', 10)
        
        if header:
            self.set_font('noto-serif', '', 10)
            for i, item in enumerate(header):
                self.cell(col_widths[i], 7, str(item), 1, 0, 'C')
            self.ln()
            self.set_font('noto-serif', '', 10)
        
        for row in data:
            for i, item in enumerate(row):
                self.cell(col_widths[i], 6, str(item), 1, 0, 'C')
            self.ln()
        
        self.ln(5)
    
    def add_bar_chart(self, success, errors, misses, task_numbers):
        fig, ax = plt.subplots(figsize=(8, 3))
        
        bar_width = 0.25
        index = np.arange(len(task_numbers))
        
        ax.bar(index, success, bar_width, label='Правильные', color='#2e7d32')
        ax.bar(index + bar_width, errors, bar_width, label='Ошибки', color='#d32f2f')
        ax.bar(index + 2*bar_width, misses, bar_width, label='Пропуски', color='#ed6c02')
        
        ax.set_xlabel('№ Задачи')
        ax.set_ylabel('Количество')
        ax.set_xticks(index + bar_width)
        ax.set_xticklabels(task_numbers)
        ax.legend()
        
        # Генерируем уникальное имя файла
        temp_file = f"temp_chart_{uuid.uuid4().hex}.png"
        fig.savefig(temp_file, dpi=150, bbox_inches='tight')
        plt.close(fig)
        
        self.image(temp_file, x=10, w=190)
        self.ln(5)
        
        os.remove(temp_file)
    
    def add_task_response_time_chart(self, task_name, response_times):
        fig, ax = plt.subplots(figsize=(8, 3))
        
        # Преобразуем миллисекунды в секунды для графика
        times_seconds = [rt/1000 if rt else 0 for rt in response_times]
        trials = range(1, len(response_times)+1)
        
        ax.plot(trials, times_seconds, marker='o', linestyle='-', color='#1976d2')
        ax.axhline(y=np.mean(times_seconds), color='#d32f2f', linestyle='--', 
                  label=f'Среднее: {np.mean(times_seconds):.2f} с')
        
        ax.set_xlabel('Номер попытки')
        ax.set_ylabel('Время ответа (сек)')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.6)
        
        # Генерируем уникальное имя файла
        temp_file = f"temp_response_chart_{uuid.uuid4().hex}.png"
        fig.savefig(temp_file, dpi=150, bbox_inches='tight')
        plt.close(fig)
        
        self.image(temp_file, x=10, w=190)
        self.ln(5)
        
        os.remove(temp_file)

def format_duration(ms):
    if not ms:
        return "0:00"
    minutes = int(ms / 60000)
    seconds = int((ms % 60000) / 1000)
    return f"{minutes}:{seconds:02d}"

def format_date(date_str):
    if not date_str:
        return ""
    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    return dt.strftime('%d.%m.%Y %H:%M')

def generate_pdf(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    pdf = PDFReport()

    dir_path = os.path.dirname(os.path.abspath(__file__))

    pdf.add_font("noto-serif", style="B", fname=f'{dir_path}/NotoSerif-Bold.ttf')
    pdf.add_font("noto-serif", style="", fname=f'{dir_path}/NotoSerif-Regular.ttf')
    pdf.add_page()
    
    pdf.add_title('Основная информация о сессии')

    session_info = [
        ["Дата сессии", format_date(data.get('createdAt'))],
        ["Режим", "Строгий" if data['experiment'].get('mode') == 'strict' else "Адаптивный"],
        ["Количество задач", len(data['results'])],
        ["Общее время", format_duration(data.get('totalSeriesTime'))]
    ]
    
    if data['experiment'].get('mode') == 'adaptive':
        session_info.extend([
            ["Заданная длительность", f"{data['experiment'].get('seriesTime')} мин"],
            ["Границы оценки", f"Нижняя: {data['experiment'].get('efficiencyMin')}, Верхняя: {data['experiment'].get('efficiencyMax')}"]
        ])
    
    pdf.add_table(session_info, [70, 120])
    
    # Подготовка данных для диаграммы
    task_numbers = []
    success_counts = []
    error_counts = []
    miss_counts = []
    
    for i, result in enumerate(data['results']):
        task = result['task']
        task_numbers.append(f"{i+1}")
        success_counts.append(result['successCount'])
        error_counts.append(result['errorCount'])
        miss_counts.append(result['missCount'])
    
    # Добавление диаграммы
    pdf.add_section_title('Статистика ответов')
    pdf.add_bar_chart(success_counts, error_counts, miss_counts, task_numbers)
    
    # Подробная статистика по задачам
    pdf.add_section_title('Подробная статистика по задачам')
    
    table_data = []
    for i, result in enumerate(data['results']):
        task = result['task']
        table_data.append([
            i+1,
            task.get('name', ''),
            f"{result['successCount']}",
            f"{result['errorCount']}",
            f"{result['missCount']}",
            f"{result['avgResponseTime']/1000:.2f} с",
            f"{(result['successCount'] / len(result['presentations'])):.4f}"
        ])
    
    pdf.add_table(
        table_data,
        [15, 50, 25, 20, 20, 30, 30],
        ["№", "Название", "Правильные", "Ошибки", "Пропуски", "Ср. время", "Эффективность"]
    )
    
    pdf.add_page()

    # Параметры задач и графики времени ответа
    pdf.add_section_title('Детальный анализ по задачам')

    for i, result in enumerate(data['results']):
        task = result['task']
        task_name = task.get("name", f"Задача {i+1}")
        
        # Добавляем заголовок задачи
        pdf.set_font('noto-serif', 'B', 11)
        pdf.cell(0, 8, f'№{i+1}: {task_name}', 0, 1)
        pdf.set_font('noto-serif', '', 10)
        
        # Параметры задачи
        pdf.cell(0, 6, 'Параметры задачи:', 0, 1)
        
        params = [
            ["Размер матрицы", f"{task.get('rows', '')}×{task.get('columns', '')}"],
            ["Цвет символа", task.get('symbolColor', '')],
            ["Цвет фона", task.get('backgroundColor', '')],
            ["Вид символа", task.get('symbolType', '')],
            ["Шрифт", task.get('symbolFont', '')],
            ["Время стимула", f"{task.get('stimulusTime', 0)/1000:.2f} с"],
            ["Время ответа", f"{task.get('responseTime', 0)/1000:.2f} с"],
            ["Время паузы", f"{task.get('pauseTime', 0)/1000:.2f} с"]
        ]
        
        for param in params:
            pdf.cell(50, 6, param[0], 0, 0)
            pdf.cell(0, 6, param[1], 0, 1)
        
        pdf.ln(3)
        
        # Добавляем график времени ответа
        response_times = [p['responseTime'] for p in result['presentations'] if 'responseTime' in p]
        if response_times:
            pdf.set_font('noto-serif', 'B', 10)
            pdf.cell(0, 6, 'График времени ответа:', 0, 1)
            pdf.add_task_response_time_chart(task_name, response_times)
        
        pdf.ln(5)
        
        # Если задача не последняя, добавляем разрыв страницы
        if i < len(data['results']) - 1:
            pdf.add_page()
    
    # Сохраняем PDF
    pdf.output(output_file)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python export_pdf.py <input_json_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = input_file.replace('.json', '.pdf')
    
    generate_pdf(input_file, output_file)