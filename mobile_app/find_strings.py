import os
import re

ui_string_pattern = re.compile(
    r"""(Text\(\s*['"][^'"]+['"])|"""
    r"""(label:\s*['"][^'"]+['"])|"""
    r"""(hintText:\s*['"][^'"]+['"])|"""
    r"""(tooltip:\s*['"][^'"]+['"])|"""
    r"""(SnackBar\(content:\s*Text\(\s*['"][^'"]+['"]\))"""
)

ignore_files = ['app_localizations.dart', 'app_localizations_en.dart']

found_files = set()

for root, dirs, files in os.walk('lib'):
    for f in files:
        if f.endswith('.dart') and not any(ign in f for ign in ignore_files):
            filepath = os.path.join(root, f)
            try:
                content = open(filepath, 'r', encoding='utf-8').read()
                # Remove comments to avoid false positives
                content = re.sub(r'//.*', '', content)
                content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
                
                matches = ui_string_pattern.findall(content)
                if matches:
                    found_files.add(filepath)
            except Exception as e:
                pass

print("Files with possible hardcoded UI strings:")
for f in sorted(list(found_files)):
    print(f)
