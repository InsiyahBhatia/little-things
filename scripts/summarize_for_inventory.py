import os
import json

manifest_path = r'D:\little-things\public\assets\extracted_manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    mf = json.load(f)

for cat, sprites in sorted(mf.items()):
    print(f"### {cat}: {len(sprites)} items")
    for s in sprites[:5]:
        print(f"- `{s.get('name')}`: {s.get('width')}x{s.get('height')} px at original coords ({s.get('x')}, {s.get('y')})")
