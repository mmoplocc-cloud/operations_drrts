import os
import glob

# 1. Rename files
files_to_rename = {
    'tp_competency_list.html': 'to_competency_list.html',
    'tp_counselling.html': 'to_counselling.html',
    'tp_inspection.html': 'to_inspection.html',
    'tp_performance.html': 'to_performance.html'
}

for old_name, new_name in files_to_rename.items():
    if os.path.exists(old_name):
        os.rename(old_name, new_name)
        print(f"Renamed {old_name} to {new_name}")

# 2. Replace text in files
html_files = glob.glob("*.html")
js_files = glob.glob("*.js")

text_replacements = {
    'tp_competency_list.html': 'to_competency_list.html',
    'tp_counselling.html': 'to_counselling.html',
    'tp_inspection.html': 'to_inspection.html',
    'tp_performance.html': 'to_performance.html',
    'TP Competency': 'TO Competency',
    'TP Counselling': 'TO Counselling',
    'TP Inspection': 'TO Inspection',
    'TP Performance': 'TO Performance',
    'Train Pilot': 'Train Operator',
    '>TP ': '>TO ',
    ' TP ': ' TO '
}

for f in html_files + js_files:
    if not os.path.exists(f): continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    modified = False
    for old, new in text_replacements.items():
        if old in content:
            content = content.replace(old, new)
            modified = True
            
    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated text in {f}")

print("Done")
