import os
import json
import numpy as np
from PIL import Image

PROC_DIR = r'D:\little-things\assets\processed'
APPROVED_DIR = r'D:\little-things\assets\approved'
PUBLIC_DIR = r'D:\little-things\public\assets\approved'

for sub in ['furniture', 'items', 'nature', 'tiles']:
    os.makedirs(os.path.join(APPROVED_DIR, sub), exist_ok=True)
    os.makedirs(os.path.join(PUBLIC_DIR, sub), exist_ok=True)

def copy_to_approved(img, subfolder, name):
    p1 = os.path.join(APPROVED_DIR, subfolder, name)
    p2 = os.path.join(PUBLIC_DIR, subfolder, name)
    img.save(p1)
    img.save(p2)
    return p1

def fit_icon(img, target_size=32):
    scale = min(target_size / img.width, target_size / img.height)
    nw = max(1, int(round(img.width * scale)))
    nh = max(1, int(round(img.height * scale)))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    arr = np.array(resized)
    arr[:, :, 3] = np.where(arr[:, :, 3] >= 110, 255, 0)
    crisp = Image.fromarray(arr)
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    ox = (target_size - nw) // 2
    oy = (target_size - nh) // 2
    canvas.paste(crisp, (ox, oy), crisp)
    return canvas

# 1. FURNITURE PROPS
shop_proc = os.path.join(PROC_DIR, 'cozy_pixel-art_witchy_shop_asset_sheet')
shop_files = sorted(os.listdir(shop_proc))

# Map key furniture
# sprite_005 is large shelf, sprite_008 is counter, sprite_003 is cauldron, sprite_007 is desk, sprite_001 is cabinet
furniture_mapping = [
    ('sprite_005_', 'apothecary_shelf_large.png', 96, 72),
    ('sprite_008_', 'shop_counter.png', 80, 48),
    ('sprite_003_', 'cauldron_station.png', 56, 64),
    ('sprite_001_', 'display_cabinet.png', 64, 72),
    ('sprite_007_', 'register_desk.png', 56, 48),
    ('sprite_002_', 'hearth_fireplace.png', 56, 64),
    ('sprite_000_', 'potion_shelf_tall.png', 56, 72),
    ('sprite_004_', 'armchair_cozy.png', 48, 56)
]

for prefix, out_name, tw, th in furniture_mapping:
    for f in shop_files:
        if f.startswith(prefix):
            img = Image.open(os.path.join(shop_proc, f))
            resized = img.resize((tw, th), Image.Resampling.LANCZOS)
            arr = np.array(resized)
            arr[:, :, 3] = np.where(arr[:, :, 3] >= 110, 255, 0)
            copy_to_approved(Image.fromarray(arr), 'furniture', out_name)
            break

# 2. ITEMS & POTIONS
potion_proc = os.path.join(PROC_DIR, 'magical_pixel_art_potion_collection')
pot_files = sorted(os.listdir(potion_proc))

items_data = [
    {"id": "moonberry_jam", "name": "Moonberry Jam", "prefix": "sprite_007_", "category": "potion", "price": 18, "stardust": 0, "desc": "Sweet jam made of night-blooming berries."},
    {"id": "dream_candle", "name": "Dream Candle", "prefix": "sprite_001_", "category": "artifact", "price": 24, "stardust": 1, "desc": "Scent of lavender that invites pleasant dreams."},
    {"id": "fairy_dust", "name": "Fairy Dust", "prefix": "sprite_000_", "category": "ingredient", "price": 35, "stardust": 2, "desc": "Glittering powder left by visiting fairies."},
    {"id": "memory_potion", "name": "Memory Potion", "prefix": "sprite_002_", "category": "potion", "price": 42, "stardust": 3, "desc": "Dewdrops and moonflower distilled to recall secrets."},
    {"id": "cloud_in_a_jar", "name": "Cloud-in-a-Jar", "prefix": "sprite_008_", "category": "artifact", "price": 50, "stardust": 4, "desc": "Fluffy sky essence captured in enchanted glass."},
    {"id": "starlight_elixir", "name": "Starlight Elixir", "prefix": "sprite_003_", "category": "potion", "price": 60, "stardust": 5, "desc": "Pure distilled starlight from the night observatory."},
    {"id": "forest_dew", "name": "Forest Dew", "prefix": "sprite_004_", "category": "ingredient", "price": 12, "stardust": 0, "desc": "Morning dew gathered from whispering fern fronds."},
    {"id": "sunberry_tonic", "name": "Sunberry Tonic", "prefix": "sprite_005_", "category": "potion", "price": 22, "stardust": 0, "desc": "Golden tonic bubbling with cheerful daylight energy."}
]

items_manifest = {}
for item in items_data:
    for f in pot_files:
        if f.startswith(item["prefix"]):
            img = Image.open(os.path.join(potion_proc, f))
            icon = fit_icon(img, 32)
            fname = f"item_{item['id']}.png"
            copy_to_approved(icon, 'items', fname)
            item['icon'] = f"items/{fname}"
            items_manifest[item['id']] = item
            break

with open(r'D:\little-things\assets\items_manifest.json', 'w') as f:
    json.dump(items_manifest, f, indent=2)
with open(r'D:\little-things\public\assets\items_manifest.json', 'w') as f:
    json.dump(items_manifest, f, indent=2)

# 3. NATURE ASSETS
nature_proc = os.path.join(PROC_DIR, 'pastel_fantasy_nature_sprite_collection')
nature_files = sorted(os.listdir(nature_proc))

nature_mapping = [
    ('sprite_003_', 'tree_ancient_willow.png', 112, 128),
    ('sprite_000_', 'tree_cherry_fairytale.png', 80, 96),
    ('sprite_001_', 'tree_sage_pine.png', 72, 96),
    ('sprite_004_', 'tree_pastel_broadleaf.png', 80, 96),
    ('sprite_006_', 'bush_lavender.png', 32, 32),
    ('sprite_007_', 'mushrooms_glowing.png', 32, 32)
]

for prefix, out_name, tw, th in nature_mapping:
    for f in nature_files:
        if f.startswith(prefix):
            img = Image.open(os.path.join(nature_proc, f))
            resized = img.resize((tw, th), Image.Resampling.LANCZOS)
            arr = np.array(resized)
            arr[:, :, 3] = np.where(arr[:, :, 3] >= 110, 255, 0)
            copy_to_approved(Image.fromarray(arr), 'nature', out_name)
            break

# 4. MODULAR TILESET (16x16 grid)
# Build a 128x128 tileset texture atlas containing all essential 16x16 tiles:
# Tile 0: Grass base (#9db592)
# Tile 1: Grass flower variation
# Tile 2: Cobblestone path center (#dfd0af)
# Tile 3: Cobblestone path border
# Tile 4: Wood floor interior (#ab7c57)
# Tile 5: Wood floor border (#805537)
# Tile 6: Water frame 0 (#6b8fb4)
# Tile 7: Water frame 1 (#7aa2ca)
# Tile 8: Shop wall timber frame (#4d372c)
# Tile 9: Shop wall stucco cream (#e6d9c2)
# Tile 10: Shop roof slate (#52425b)
# Tile 11: Shop window arched (#e9c878)
# Tile 12: Shop door wooden (#6e4732)
# Tile 13: Garden soil (#5c4232)
# Tile 14: Fence post picket (#ddd2b8)
# Tile 15: Stone bridge / edging (#9c918c)

tileset_img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))

# Sample textures from mallowmere_fantasy_pixel_tileset
tiles_proc = os.path.join(PROC_DIR, 'mallowmere_fantasy_pixel_tileset')

def create_tile(color_base, pattern_type='plain', border_color=None):
    t = Image.new('RGBA', (16, 16), color_base)
    t_arr = np.array(t)
    if pattern_type == 'grass':
        # Add tiny pastel wildflower dots and blade shades
        t_arr[4, 5] = [218, 168, 185, 255]
        t_arr[5, 5] = [218, 168, 185, 255]
        t_arr[10, 11] = [234, 212, 140, 255]
        t_arr[3, 10] = [120, 145, 110, 255]
        t_arr[12, 3] = [120, 145, 110, 255]
    elif pattern_type == 'cobble':
        # Stone joints
        t_arr[7, :] = [185, 168, 135, 255]
        t_arr[:, 7] = [185, 168, 135, 255]
        t_arr[15, :] = [185, 168, 135, 255]
        t_arr[:, 15] = [185, 168, 135, 255]
    elif pattern_type == 'wood':
        t_arr[0, :] = [115, 78, 52, 255]
        t_arr[8, :] = [115, 78, 52, 255]
        t_arr[15, :] = [115, 78, 52, 255]
    elif pattern_type == 'water':
        t_arr[3:5, 4:12] = [150, 195, 225, 255]
        t_arr[10:12, 2:8] = [150, 195, 225, 255]
    elif pattern_type == 'roof':
        t_arr[0:2, :] = [68, 52, 78, 255]
        t_arr[7:9, :] = [68, 52, 78, 255]
        t_arr[14:16, :] = [68, 52, 78, 255]
    elif pattern_type == 'wall':
        t_arr[:, 0:2] = [68, 48, 36, 255]
        t_arr[:, 14:16] = [68, 48, 36, 255]
        t_arr[0:2, :] = [68, 48, 36, 255]
    return Image.fromarray(t_arr)

# Palette:
# Grass: (165, 185, 154, 255)
# Cobble: (230, 218, 188, 255)
# Wood floor: (170, 125, 88, 255)
# Water: (108, 145, 180, 255)
# Roof: (82, 66, 91, 255)
# Wall: (230, 220, 200, 255)
# Door: (110, 72, 50, 255)

tile_defs = [
    (0, 0, (165, 185, 154, 255), 'plain'),      # 0: Plain grass
    (1, 0, (165, 185, 154, 255), 'grass'),      # 1: Wildflower grass
    (2, 0, (230, 218, 188, 255), 'cobble'),     # 2: Cobblestone path
    (3, 0, (170, 125, 88, 255), 'wood'),        # 3: Wood floor
    (0, 1, (108, 145, 180, 255), 'water'),      # 4: Water
    (1, 1, (230, 220, 200, 255), 'wall'),       # 5: Wall timber
    (2, 1, (82, 66, 91, 255), 'roof'),          # 6: Roof tiles
    (3, 1, (110, 72, 50, 255), 'wood'),         # 7: Shop door
]

for col, row, color, ptype in tile_defs:
    tile_img = create_tile(color, ptype)
    tileset_img.paste(tile_img, (col * 16, row * 16), tile_img)

tileset_path = copy_to_approved(tileset_img, 'tiles', 'tileset_mallowmere.png')

# Generate Tileset Preview HTML
tileset_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LITTLE THINGS — Tileset & World Asset Preview</title>
<style>
  body {{ font-family: monospace; background: #261d30; color: #f2deb8; padding: 24px; }}
  h1, h2 {{ color: #e9b7aa; margin: 4px 0 16px 0; }}
  .card {{ background: #342842; border: 1px solid #766184; border-radius: 8px; padding: 16px; margin-bottom: 20px; }}
  .row {{ display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end; }}
  .tile-box {{ background: #443455; padding: 12px; border-radius: 6px; text-align: center; font-size: 11px; }}
  img {{ image-rendering: pixelated; }}
  .preview-grid {{
    display: inline-grid;
    grid-template-columns: repeat(8, 32px);
    grid-gap: 2px;
    background: #1c1524;
    padding: 8px;
    border-radius: 6px;
  }}
</style>
</head>
<body>
<h1>LITTLE THINGS — Tileset & World Asset Preview</h1>

<div class="card">
  <h2>16x16 Master Tileset (Scaled 3x)</h2>
  <img src="approved/tiles/tileset_mallowmere.png" style="width: 384px; height: 384px; border: 2px solid #b987a4; border-radius: 4px;">
</div>

<div class="card">
  <h2>Little Things Emporium Furniture Library</h2>
  <div class="row">
    <div class="tile-box"><img src="approved/furniture/apothecary_shelf_large.png"><br>Apothecary Shelf</div>
    <div class="tile-box"><img src="approved/furniture/shop_counter.png"><br>Shop Counter</div>
    <div class="tile-box"><img src="approved/furniture/cauldron_station.png"><br>Cauldron Station</div>
    <div class="tile-box"><img src="approved/furniture/display_cabinet.png"><br>Display Cabinet</div>
    <div class="tile-box"><img src="approved/furniture/armchair_cozy.png"><br>Cozy Armchair</div>
  </div>
</div>

<div class="card">
  <h2>Mallowmere Nature Library</h2>
  <div class="row">
    <div class="tile-box"><img src="approved/nature/tree_ancient_willow.png"><br>Ancient Willow</div>
    <div class="tile-box"><img src="approved/nature/tree_cherry_fairytale.png"><br>Fairytale Blossom</div>
    <div class="tile-box"><img src="approved/nature/bush_lavender.png"><br>Lavender Bush</div>
    <div class="tile-box"><img src="approved/nature/mushrooms_glowing.png"><br>Glowcap Fungi</div>
  </div>
</div>

<div class="card">
  <h2>Magical Inventory Items</h2>
  <div class="row">
    {"".join(f'<div class="tile-box"><img src="approved/{it["icon"]}"><br>{it["name"]}<br><b>{it["price"]} Petals</b></div>' for it in items_manifest.values())}
  </div>
</div>
</body>
</html>
"""

with open(r'D:\little-things\public\assets\tileset_preview.html', 'w', encoding='utf-8') as f:
    f.write(tileset_html)

print("World assets, furniture, potions, tileset, and preview HTML created successfully!")
