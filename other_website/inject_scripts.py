import os
import glob

html_files = glob.glob("*.html")

script_tags = """
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-client.js"></script>
"""

# Scripts that need to be injected before other scripts
for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # If already injected, skip
    if "supabase-client.js" in content:
        continue
        
    # Find the closing body tag or any existing script tag near the end
    if "<script src=\"app.js\"></script>" in content:
        new_content = content.replace('<script src="app.js"></script>', script_tags + '    <script src="app.js"></script>')
    elif "</body>" in content:
        new_content = content.replace('</body>', script_tags + '</body>')
    else:
        new_content = content + script_tags
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f"Injected scripts into {f}")

print("Injection complete.")
