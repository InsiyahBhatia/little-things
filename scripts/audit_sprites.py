import os
import json
import numpy as np
from PIL import Image

manifest_path = r'D:\little-things\public\assets\extracted_manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    mf = json.load(f)

extracted_dir = r'D:\little-things\public\assets\extracted'

print("=== AUDIT OF EXTRACTED SPRITES ===")
total_sprites = sum(len(v) for v in mf.values())
print(f"Total extracted assets across 6 sheets: {total_sprites}")

for cat, sprites in sorted(mf.items()):
    semi_trans_count = 0
    clean_alpha_count = 0
    for s in sprites:
        if 'filename' not in s: continue
        p = os.path.join(extracted_dir, s['filename'])
        im = Image.open(p)
        arr = np.array(im)
        if arr.shape[-1] == 4:
            alpha = arr[:, :, 3]
            # check semi-transparent edge pixels (between 1 and 250)
            semi = np.sum((alpha > 10) & (alpha < 240))
            if semi > 0:
                semi_trans_count += 1
            else:
                clean_alpha_count += 1
    print(f"[{cat}]")
    print(f"  Total sprites: {len(sprites)}")
    print(f"  Fully binary alpha (0 or 255): {clean_alpha_count}")
    print(f"  Sprites with semi-transparency/antialiased fringes: {semi_trans_count}")
