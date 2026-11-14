import urllib.request

urls = [
    'http://localhost:3000/assets/approved/characters/mimi_walk_sheet.png',
    'http://localhost:3000/assets/approved/characters/pickles_sheet.png',
    'http://localhost:3000/assets/approved/furniture/apothecary_shelf_large.png',
    'http://localhost:3000/assets/approved/furniture/shop_counter.png',
    'http://localhost:3000/assets/approved/furniture/cauldron_station.png',
    'http://localhost:3000/assets/approved/tiles/tileset_mallowmere.png',
    'http://localhost:3000/assets/approved/nature/tree_ancient_willow.png',
    'http://localhost:3000/assets/character_animation_preview.html',
    'http://localhost:3000/assets/tileset_preview.html'
]

print("Testing asset loading from running Next.js server...")
for u in urls:
    try:
        r = urllib.request.urlopen(u)
        name = u.split('/')[-1]
        print(f"200 OK: {name} ({len(r.read())} bytes)")
    except Exception as e:
        print(f"FAILED: {u} -> {e}")
