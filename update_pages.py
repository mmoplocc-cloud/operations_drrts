import os
import glob

html_files = glob.glob("*.html")
# exclude index.html
if "index.html" in html_files:
    html_files.remove("index.html")

sidebar_addition = """                <li class="nav-item nav-header">REPORTS</li>
                <li class="nav-item has-submenu">
                    <a href="#" class="nav-link submenu-toggle"><i class="fa-solid fa-chart-column"></i> <span>View Reports</span> <i class="fa-solid fa-chevron-down submenu-icon" style="margin-left: auto;"></i></a>
                    <ul class="submenu-list">
                        <li class="nav-item"><a href="employee_list.html" class="nav-link"><i class="fa-regular fa-circle"></i> <span>Employee List</span></a></li>
                        <li class="nav-item"><a href="tp_competency_list.html" class="nav-link"><i class="fa-regular fa-circle"></i> <span>TP Competency</span></a></li>
                        <li class="nav-item"><a href="instruction_ack.html" class="nav-link"><i class="fa-regular fa-circle"></i> <span>Instruction Ack</span></a></li>
                        <li class="nav-item"><a href="instruction_ack_sheet.html" class="nav-link"><i class="fa-regular fa-circle"></i> <span>Instruction Ack Sheet</span></a></li>
                    </ul>
                </li>
                <li class="nav-item nav-header">ACCOUNT</li>"""

header_old = '<div class="brand"><i class="fa-solid fa-train-subway"></i> OpTra</div>'
header_new = '<div class="brand" style="display:flex; align-items:center; gap:0.5rem;"><img src="images/deutsche-bahn-logo.png" alt="DB Logo" style="height: 24px;"> <span>OpTra</span></div>'

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    modified = False
    
    if '<li class="nav-item nav-header">ACCOUNT</li>' in content:
        content = content.replace('<li class="nav-item nav-header">ACCOUNT</li>', sidebar_addition)
        modified = True
        
    if header_old in content:
        content = content.replace(header_old, header_new)
        modified = True

    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
