import os
import json
from PIL import Image

manifest_path = r'D:\little-things\public\assets\extracted_manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    mf = json.load(f)

html = ['<!DOCTYPE html><html><head><meta charset="utf-8"><title>LITTLE THINGS Asset Catalog</title>',
        '<style>body{font-family:sans-serif;background:#2d2238;color:#f2deb8;padding:20px;}',
        '.cat{background:#392d49;border:1px solid #766184;border-radius:8px;padding:15px;margin-bottom:25px;}',
        '.grid{display:flex;flex-wrap:wrap;gap:12px;}',
        '.card{background:#231a30;border:1px solid #b987a4;border-radius:6px;padding:8px;text-align:center;font-size:11px;}',
        '.card img{max-width:120px;max-height:120px;image-rendering:pixelated;background:repeating-conic-gradient(#30263d 0% 25%, #423554 0% 50%) 50% / 16px 16px;}',
        'h1,h2{color:#f2deb8;margin:4px 0;}',
        '</style></head><body>',
        '<h1>LITTLE THINGS — Asset Library Catalog</h1>',
        '<p>Visual inventory of extracted sprites, bounding boxes and dimensions.</p>']

for cat, sprites in sorted(mf.items()):
    html.append(f'<div class="cat"><h2>{cat} ({len(sprites)} items)</h2><div class="grid">')
    for s in sprites:
        img_rel = f"extracted/{s['filename']}" if 'filename' in s else f"extracted/{cat}/reference_full.png"
        name = s.get('name', 'reference')
        w = s.get('width', 0)
        h = s.get('height', 0)
        idx = s.get('sorted_idx', s.get('index', 0))
        html.append(f'<div class="card"><img src="{img_rel}"><br><b>#{idx}</b><br>{w}x{h}<br><span>{name[:16]}</span></div>')
    html.append('</div></div>')

html.append('</body></html>')

with open(r'D:\little-things\public\assets\catalog.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(html))

print("Catalog HTML written to D:\\little-things\\public\\assets\\catalog.html")
