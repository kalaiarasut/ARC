import json
import os
import time
from googletrans import Translator

l10n_dir = r"d:\ON-AIR\Ocean\mobile_app\lib\l10n"
langs = ['bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'ta', 'te']
translator = Translator()

en_arb_path = os.path.join(l10n_dir, 'app_en.arb')
with open(en_arb_path, 'r', encoding='utf-8') as f:
    en_arb = json.load(f)

for lang in langs:
    arb_path = os.path.join(l10n_dir, f'app_{lang}.arb')
    if os.path.exists(arb_path):
        with open(arb_path, 'r', encoding='utf-8') as f:
            lang_arb = json.load(f)
    else:
        lang_arb = {"@@locale": lang}
        
    for key, en_val in en_arb.items():
        if key == "@@locale" or key.startswith("@"):
            if key not in lang_arb:
                lang_arb[key] = en_val
            continue
            
        # Only translate if missing or identical to English
        # Exception: some short words might genuinely be the same, but very rare for these Indic languages.
        if key not in lang_arb or lang_arb[key] == en_val:
            try:
                print(f"Translating '{en_val}' to {lang}...")
                res = translator.translate(en_val, src='en', dest=lang)
                lang_arb[key] = res.text
                time.sleep(0.3)
            except Exception as e:
                print(f"Error translating {key} to {lang}: {e}")
                if key not in lang_arb:
                    lang_arb[key] = en_val

    with open(arb_path, 'w', encoding='utf-8') as f:
        json.dump(lang_arb, f, ensure_ascii=False, indent=2)

print("Translation complete.")
