import os
import json
from PIL import Image

manifest_path = r'D:\little-things\public\assets\extracted_manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    mf = json.load(f)

extracted_dir = r'D:\little-things\public\assets\extracted'

chars = mf.get('little_things__enchanted_sprite_collection', [])
print(f"Total character sheet items: {len(chars)}")

# Group by vertical rows roughly (y-coordinate)
rows = {}
for c in chars:
    y = c.get('y', 0)
    # bucket by 150px
    row_idx = y // 180
    if row_idx not in rows:
        rows[row_idx] = []
    rows[row_idx].append(c)

for r_idx in sorted(rows.keys()):
    items = sorted(rows[r_idx], key=lambda x: x.get('x', 0))
    print(f"\nRow {r_idx} (~y={r_idx*180}): {len(items)} items")
    for item in items:
        print(f"  id: {item.get('name')} | size: {item.get('width')}x{item.get('height')} at ({item.get('x')}, {item.get('y')})")
