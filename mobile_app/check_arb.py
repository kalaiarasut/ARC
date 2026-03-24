import json
import glob
import sys

has_error = False
for f in glob.glob('lib/l10n/*.arb'):
    try:
        data = json.load(open(f, encoding='utf-8'))
        print(f + ': VALID')
    except Exception as e:
        print(f + ': ERROR - ' + str(e))
        has_error = True

if has_error:
    sys.exit(1)
print("All ARB files are valid JSON.")
