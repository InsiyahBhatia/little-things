import os
import json
import numpy as np
from PIL import Image

manifest_path = r'D:\little-things\public\assets\extracted_manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    mf = json.load(f)

extracted_dir = r'D:\little-things\public\assets\extracted'

print("=== DETAILED BREAKDOWN OF ASSET COLLECTIONS ===")
for cat, sprites in sorted(mf.items()):
    print(f"\n--- {cat} ({len(sprites)} sprites) ---")
    sizes = [(s.get('width', 0), s.get('height', 0)) for s in sprites]
    widths = [w for w, h in sizes]
    heights = [h for w, h in sizes]
    if widths:
        print(f"Widths min={min(widths)}, max={max(widths)}, median={sorted(widths)[len(widths)//2]}")
        print(f"Heights min={min(heights)}, max={max(heights)}, median={sorted(heights)[len(heights)//2]}")
    for s in sprites[:8]:
        print(f"  {s.get('name')}: size={s.get('width')}x{s.get('height')} at pos ({s.get('x')}, {s.get('y')})")
