"""
Generate proper pixel-art tileset for LITTLE THINGS - Mallowmere Village.
Creates detailed 16x16 tiles with handcrafted pixel patterns.
"""
from PIL import Image, ImageDraw
import random

random.seed(42)  # Reproducible art

TILE = 16
COLS = 16  # tiles per row
ROWS = 8   # rows
W = COLS * TILE
H = ROWS * TILE

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))

# Palette - Mallowmere dreamy colors
PAL = {
    'grass_dark':   (106, 153, 100),
    'grass_mid':    (133, 175, 124),
    'grass_light':  (165, 185, 154),
    'grass_accent': (146, 196, 125),
    'dirt_dark':    (92, 66, 50),
    'dirt_mid':     (122, 90, 65),
    'dirt_light':   (148, 115, 85),
    'dirt_pebble':  (165, 135, 105),
    'cobble_dark':  (115, 105, 110),
    'cobble_mid':   (145, 135, 138),
    'cobble_light': (170, 162, 165),
    'cobble_grout': (95, 88, 92),
    'wood_dark':    (105, 72, 50),
    'wood_mid':     (135, 95, 65),
    'wood_light':   (158, 118, 82),
    'wood_grain':   (120, 82, 55),
    'water_dark':   (75, 115, 145),
    'water_mid':    (100, 148, 178),
    'water_light':  (135, 178, 205),
    'water_shine':  (195, 220, 240),
    'wall_base':    (155, 140, 150),
    'wall_light':   (178, 165, 172),
    'wall_dark':    (130, 118, 128),
    'wall_timber':  (100, 72, 55),
    'roof_dark':    (141, 101, 116),
    'roof_mid':     (165, 125, 140),
    'roof_light':   (185, 148, 158),
    'roof_edge':    (118, 82, 95),
    'door_dark':    (95, 65, 48),
    'door_mid':     (125, 88, 62),
    'door_light':   (148, 108, 78),
    'door_handle':  (210, 185, 110),
    'fence_main':   (178, 148, 115),
    'fence_dark':   (148, 118, 85),
    'fence_light':  (198, 172, 142),
    'flower_pink':  (225, 155, 175),
    'flower_yellow':(225, 200, 110),
    'flower_blue':  (140, 165, 210),
    'sage':         (165, 185, 154),
    'peach':        (233, 183, 170),
    'lavender':     (145, 125, 168),
    'cream':        (242, 222, 184),
    'night':        (57, 45, 73),
}

def c(name):
    return PAL[name] + (255,)

def draw_tile(tx, ty, pixels_fn):
    """Draw a 16x16 tile at grid position (tx, ty)."""
    ox, oy = tx * TILE, ty * TILE
    for py in range(TILE):
        for px in range(TILE):
            color = pixels_fn(px, py)
            if color:
                img.putpixel((ox + px, oy + py), color)

# =============================================================
# ROW 0: GROUND TILES
# =============================================================

# Tile 0,0: Lush Grass (base)
def grass_base(px, py):
    r = (px * 7 + py * 13) % 37
    if r < 3:
        return c('grass_light')
    elif r < 8:
        return c('grass_accent')
    elif r < 15:
        return c('grass_mid')
    else:
        return c('grass_dark') if r < 20 else c('grass_mid')
draw_tile(0, 0, grass_base)

# Tile 1,0: Grass with wildflowers
def grass_flowers(px, py):
    base = grass_base(px, py)
    r = (px * 11 + py * 7) % 53
    if r == 5 and py > 3:
        return c('flower_pink')
    elif r == 12 and py > 2:
        return c('flower_yellow')
    elif r == 23 and py > 4:
        return c('flower_blue')
    return base
draw_tile(1, 0, grass_flowers)

# Tile 2,0: Cobblestone path
def cobble(px, py):
    # Create irregular stone shapes
    stone_pattern = [
        [1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1],
        [1,2,1,0,1,2,0,2,1,2,0,1,2,1,0,2],
        [1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1],
        [0,2,1,2,0,1,2,1,2,0,2,1,2,0,1,2],
        [0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1],
        [2,1,0,1,2,1,0,2,1,0,1,2,1,0,2,1],
        [1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
        [1,2,1,0,2,1,2,0,1,2,1,0,2,1,0,2],
        [1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ]
    v = stone_pattern[py][px]
    if v == 0:
        return c('cobble_grout')
    elif v == 2:
        return c('cobble_light')
    else:
        return c('cobble_mid') if (px + py) % 3 != 0 else c('cobble_dark')
draw_tile(2, 0, cobble)

# Tile 3,0: Wood floor (planks)
def wood_floor(px, py):
    plank_h = 4
    plank_row = py // plank_h
    local_y = py % plank_h
    # Offset each plank row
    offset = (plank_row * 7) % TILE
    shifted_x = (px + offset) % TILE
    # Plank gaps
    if local_y == 0:
        return c('wood_dark')
    # Vertical joins
    if shifted_x % 8 == 0 and local_y > 1:
        return c('wood_dark')
    # Grain texture
    grain = (shifted_x * 3 + local_y * 5 + plank_row * 11) % 17
    if grain < 2:
        return c('wood_grain')
    elif grain < 5:
        return c('wood_light')
    else:
        return c('wood_mid')
draw_tile(3, 0, wood_floor)

# Tile 4,0: Water (frame 1)
def water_1(px, py):
    wave = ((px + py * 2) % 8)
    if wave < 2:
        return c('water_dark')
    elif wave < 4:
        return c('water_mid')
    elif wave < 6:
        return c('water_light')
    else:
        return c('water_mid')
draw_tile(4, 0, water_1)

# Tile 5,0: Wall / plaster
def wall(px, py):
    r = (px * 5 + py * 9) % 29
    if r < 3:
        return c('wall_dark')
    elif r < 10:
        return c('wall_light')
    else:
        return c('wall_base')
draw_tile(5, 0, wall)

# Tile 6,0: Roof shingles
def roof(px, py):
    shingle_h = 4
    row = py // shingle_h
    local_y = py % shingle_h
    offset = (row * 5) % TILE
    shifted_x = (px + offset) % TILE
    # Shingle edges
    if local_y == 0:
        return c('roof_edge')
    # Shingle body
    overlap = shifted_x % 8
    if overlap < 1:
        return c('roof_dark')
    elif local_y == 1:
        return c('roof_light')
    else:
        return c('roof_mid') if (shifted_x + py) % 5 != 0 else c('roof_dark')
draw_tile(6, 0, roof)

# Tile 7,0: Door
def door(px, py):
    # Door frame
    if px <= 1 or px >= 14:
        return c('door_dark')
    if py <= 1:
        return c('door_dark')
    # Planks
    plank = (px - 2) // 4
    local_x = (px - 2) % 4
    if local_x == 0:
        return c('door_dark')
    grain = (px * 3 + py * 7 + plank * 5) % 13
    if grain < 2:
        return c('door_dark')
    elif grain < 5:
        return c('door_light')
    else:
        col = c('door_mid')
    # Handle
    if px == 11 and py == 8:
        return c('door_handle')
    if px == 11 and py == 9:
        return c('door_handle')
    return col if 'col' in dir() else c('door_mid')
draw_tile(7, 0, door)

# =============================================================
# ROW 1: VARIANT GROUND TILES
# =============================================================

# Tile 0,1: Grass variant 2 (darker, mossy)
def grass_mossy(px, py):
    r = (px * 11 + py * 3) % 31
    if r < 5:
        return c('grass_dark')
    elif r < 12:
        return c('grass_mid')
    elif r < 16:
        return (120, 160, 110, 255)  # mossy tint
    else:
        return c('grass_dark') if r < 22 else c('grass_mid')
draw_tile(0, 1, grass_mossy)

# Tile 1,1: Grass with small stones/pebbles
def grass_pebbles(px, py):
    base = grass_base(px, py)
    r = (px * 17 + py * 3) % 47
    if r == 3 or r == 15:
        return c('cobble_mid')
    elif r == 8:
        return c('cobble_dark')
    return base
draw_tile(1, 1, grass_pebbles)

# Tile 2,1: Dirt / garden soil
def dirt(px, py):
    r = (px * 9 + py * 7) % 23
    if r < 3:
        return c('dirt_pebble')
    elif r < 8:
        return c('dirt_light')
    elif r < 14:
        return c('dirt_mid')
    else:
        return c('dirt_dark')
draw_tile(2, 1, dirt)

# Tile 3,1: Plank floor variant (slightly different color)
def wood_floor_alt(px, py):
    plank_h = 4
    plank_row = py // plank_h
    local_y = py % plank_h
    offset = (plank_row * 5) % TILE
    shifted_x = (px + offset) % TILE
    if local_y == 0:
        return (90, 62, 42, 255)
    if shifted_x % 7 == 0 and local_y > 1:
        return (90, 62, 42, 255)
    grain = (shifted_x * 7 + local_y * 3 + plank_row * 5) % 19
    if grain < 3:
        return (112, 78, 50, 255)
    elif grain < 7:
        return (150, 112, 78, 255)
    else:
        return (130, 92, 62, 255)
draw_tile(3, 1, wood_floor_alt)

# Tile 4,1: Water frame 2 (shifted wave)
def water_2(px, py):
    wave = ((px + 2 + py * 2) % 8)
    if wave < 2:
        return c('water_dark')
    elif wave < 4:
        return c('water_mid')
    elif wave < 6:
        return c('water_light')
    else:
        # Sparkle
        if (px * 5 + py * 3) % 19 == 0:
            return c('water_shine')
        return c('water_mid')
draw_tile(4, 1, water_2)

# Tile 5,1: Wall with timber beam
def wall_timber(px, py):
    # Horizontal beam
    if py == 7 or py == 8:
        return c('wall_timber')
    # Vertical beam
    if px == 7 or px == 8:
        return c('wall_timber')
    return wall(px, py)
draw_tile(5, 1, wall_timber)

# Tile 6,1: Roof edge (bottom)
def roof_edge(px, py):
    if py < 4:
        return roof(px, py)
    if py == 4:
        return c('roof_edge')
    # Eaves shadow
    if py == 5:
        return (80, 65, 78, 200)
    return (0, 0, 0, 0)
draw_tile(6, 1, roof_edge)

# Tile 7,1: Window
def window(px, py):
    # Frame
    if px <= 1 or px >= 14 or py <= 1 or py >= 14:
        return c('wall_timber')
    # Cross bars
    if px == 7 or px == 8:
        return c('wall_timber')
    if py == 7 or py == 8:
        return c('wall_timber')
    # Glass with light
    glass_r = (px * 3 + py * 5) % 11
    if glass_r < 3:
        return (180, 210, 235, 220)
    elif glass_r < 6:
        return (160, 195, 225, 220)
    else:
        return (200, 225, 245, 220)
draw_tile(7, 1, window)

# =============================================================
# ROW 2: FENCE & EDGE TILES
# =============================================================

# Tile 0,2: Fence (vertical pickets)
def fence_v(px, py):
    # Rails
    if py == 5 or py == 11:
        if px > 0 and px < 15:
            return c('fence_dark')
    # Pickets
    picket = px % 4
    if picket <= 1 and px < 15:
        if py < 14:
            if py == 0:
                return c('fence_light')  # pointed top
            return c('fence_main') if picket == 0 else c('fence_light')
    return (0, 0, 0, 0)  # transparent between pickets
draw_tile(0, 2, fence_v)

# Tile 1,2: Fence horizontal rail
def fence_h(px, py):
    if py >= 4 and py <= 6:
        return c('fence_main') if py != 5 else c('fence_light')
    if py >= 10 and py <= 12:
        return c('fence_main') if py != 11 else c('fence_light')
    # Post at edges
    if (px <= 2 or px >= 13) and py < 14:
        return c('fence_dark')
    return (0, 0, 0, 0)
draw_tile(1, 2, fence_h)

# Tile 2,2: Grass-to-dirt edge (top)
def grass_dirt_top(px, py):
    if py < 6:
        return grass_base(px, py)
    elif py < 9:
        # Ragged edge
        threshold = 7 + ((px * 3) % 3) - 1
        if py < threshold:
            return grass_base(px, py)
        else:
            return dirt(px, py)
    else:
        return dirt(px, py)
draw_tile(2, 2, grass_dirt_top)

# Tile 3,2: Cobble-to-grass edge
def cobble_grass(px, py):
    if py < 8:
        return cobble(px, py)
    elif py < 10:
        threshold = 8 + ((px * 5) % 3)
        if py < threshold:
            return cobble(px, py)
        return grass_base(px, py)
    return grass_base(px, py)
draw_tile(3, 2, cobble_grass)

# Tile 4,2: Water edge (grass to water, top)
def water_edge_top(px, py):
    if py < 5:
        return grass_base(px, py)
    elif py < 8:
        threshold = 5 + ((px * 7 + 3) % 4)
        if py < threshold:
            base = grass_base(px, py)
            return (base[0], base[1], base[2], 200)
        return c('water_mid')
    return water_1(px, py)
draw_tile(4, 2, water_edge_top)

# Tile 5,2: Water edge (grass to water, left)
def water_edge_left(px, py):
    if px < 5:
        return grass_base(px, py)
    elif px < 8:
        threshold = 5 + ((py * 7 + 3) % 4)
        if px < threshold:
            return grass_base(px, py)
        return c('water_mid')
    return water_1(px, py)
draw_tile(5, 2, water_edge_left)

# Tile 6,2: Rug / carpet center
def rug(px, py):
    # Border
    if px == 0 or px == 15 or py == 0 or py == 15:
        return (141, 101, 116, 255)  # berry
    if px == 1 or px == 14 or py == 1 or py == 14:
        return (185, 148, 158, 255)  # lighter border
    # Interior pattern
    r = (px + py) % 4
    if r == 0:
        return (185, 135, 165, 255)
    elif r == 1:
        return (200, 155, 178, 255)
    elif r == 2:
        return (175, 128, 155, 255)
    else:
        return (190, 145, 170, 255)
draw_tile(6, 2, rug)

# Tile 7,2: Welcome mat
def welcome_mat(px, py):
    if px < 2 or px > 13 or py < 4 or py > 11:
        return (0, 0, 0, 0)
    if px == 2 or px == 13 or py == 4 or py == 11:
        return c('dirt_dark')
    r = ((px - 3) * 5 + (py - 5) * 3) % 7
    if r < 2:
        return (141, 101, 116, 255)
    elif r < 4:
        return (165, 125, 140, 255)
    else:
        return (155, 115, 132, 255)
draw_tile(7, 2, welcome_mat)

# =============================================================
# ROW 3: INTERIOR DECOR TILES
# =============================================================

# Tile 0,3: Bookshelf front
def bookshelf(px, py):
    # Shelf frame
    if px == 0 or px == 15:
        return c('wood_dark')
    if py == 0 or py == 5 or py == 10 or py == 15:
        return c('wood_mid')
    # Books
    book_w = 2
    book_idx = (px - 1) // book_w
    shelf_row = py // 5
    book_h = (book_idx * 3 + shelf_row * 7) % 4 + 1
    local_y = py % 5
    if local_y > (5 - book_h) and local_y < 5:
        colors = [
            (180, 90, 90, 255), (90, 120, 170, 255), (140, 170, 95, 255),
            (180, 150, 90, 255), (150, 100, 150, 255), (100, 160, 150, 255),
            (200, 130, 100, 255)
        ]
        ci = (book_idx + shelf_row * 3) % len(colors)
        return colors[ci]
    return c('wood_dark')
draw_tile(0, 3, bookshelf)

# Tile 1,3: Hanging herbs (wall decoration)
def hanging_herbs(px, py):
    base = wall(px, py)
    # Hooks
    if py == 1 and px % 5 == 2:
        return c('wall_timber')
    # Hanging strings
    herb_centers = [3, 8, 13]
    for hx in herb_centers:
        if abs(px - hx) <= 1:
            if py >= 2 and py <= 5:
                return c('wood_grain')
            if py >= 6 and py <= 9:
                # Herb cluster
                dist = abs(px - hx)
                if py < 8 - dist:
                    return (110, 155, 100, 255) if (px + py) % 2 == 0 else (90, 135, 85, 255)
    return base
draw_tile(1, 3, hanging_herbs)

# Tile 2,3: Stone/brick wall
def stone_wall(px, py):
    brick_h = 4
    row = py // brick_h
    offset = (row % 2) * 6
    bx = (px + offset) % 12
    local_y = py % brick_h
    if local_y == 0 or bx == 0:
        return (95, 88, 95, 255)  # mortar
    r = (px * 3 + py * 7 + row * 11) % 13
    if r < 3:
        return (135, 125, 130, 255)
    elif r < 7:
        return (155, 145, 150, 255)
    else:
        return (145, 135, 140, 255)
draw_tile(2, 3, stone_wall)

# Tile 3,3: Floor rug pattern (different)
def floor_rug_alt(px, py):
    if px == 0 or px == 15 or py == 0 or py == 15:
        return (100, 72, 55, 255)
    if px == 1 or px == 14 or py == 1 or py == 14:
        return (214, 185, 111, 255)  # honey border
    cx, cy = abs(px - 8), abs(py - 8)
    if cx + cy < 5:
        return (233, 183, 170, 255)  # peach center
    return (185, 148, 158, 255)
draw_tile(3, 3, floor_rug_alt)

# Tile 4,3: Water frame 3
def water_3(px, py):
    wave = ((px + 4 + py * 2) % 8)
    sparkle = (px * 7 + py * 11) % 23
    if sparkle == 0:
        return c('water_shine')
    if wave < 2:
        return c('water_dark')
    elif wave < 4:
        return c('water_mid')
    elif wave < 6:
        return c('water_light')
    else:
        return c('water_mid')
draw_tile(4, 3, water_3)

# Tile 5,3: Bridge/wooden platform
def bridge(px, py):
    if px == 0 or px == 15:
        return (85, 60, 40, 255)  # rail
    if py == 0 or py == 15:
        return (85, 60, 40, 255)
    plank = px // 3
    grain = (plank * 5 + py * 3) % 11
    if grain < 2:
        return (115, 80, 52, 255)
    elif grain < 5:
        return (145, 105, 72, 255)
    else:
        return (130, 92, 60, 255)
draw_tile(5, 3, bridge)

# Tile 6,3: Grass edge (bottom)
def grass_edge_bottom(px, py):
    if py < 8:
        return grass_base(px, py)
    elif py < 11:
        threshold = 8 + ((px * 7 + 1) % 4)
        if py < threshold:
            return grass_base(px, py)
        return c('dirt_mid')
    return c('dirt_mid')
draw_tile(6, 3, grass_edge_bottom)

# Tile 7,3: Dark grass (forest floor)
def forest_floor(px, py):
    r = (px * 13 + py * 7) % 41
    if r < 4:
        return (75, 110, 75, 255)
    elif r < 10:
        return (85, 125, 85, 255)
    elif r < 18:
        return (95, 138, 92, 255)
    elif r < 25:
        return (80, 118, 80, 255)
    else:
        return (90, 130, 88, 255)
draw_tile(7, 3, forest_floor)

# =============================================================
# ROW 4: MORE VARIANTS
# =============================================================

# Tile 0,4: Flower bed (garden soil with flowers)
def flower_bed(px, py):
    base = dirt(px, py)
    r = (px * 19 + py * 11) % 37
    if r == 2 and py > 2 and py < 14:
        return c('flower_pink')
    elif r == 7 and py > 1 and py < 13:
        return c('flower_yellow')
    elif r == 15 and py > 3:
        return (130, 190, 120, 255)  # leaf
    return base
draw_tile(0, 4, flower_bed)

# Tile 1,4: Cobble dark variant
def cobble_dark(px, py):
    v = cobble(px, py)
    if v == c('cobble_grout'):
        return (75, 68, 72, 255)
    elif v == c('cobble_light'):
        return (130, 122, 128, 255)
    elif v == c('cobble_mid'):
        return (115, 108, 115, 255)
    return (100, 92, 98, 255)
draw_tile(1, 4, cobble_dark)

# Tile 2,4: Interior wall bottom edge
def wall_bottom(px, py):
    if py < 10:
        return wall(px, py)
    if py == 10:
        return c('wall_timber')
    # Baseboard
    return c('wood_mid')
draw_tile(2, 4, wall_bottom)

# Tile 3,4: Checkered floor
def checker_floor(px, py):
    cx = px // 4
    cy = py // 4
    if (cx + cy) % 2 == 0:
        r = (px * 3 + py * 5) % 7
        if r < 2:
            return (165, 155, 160, 255)
        return (175, 165, 170, 255)
    else:
        r = (px * 5 + py * 3) % 7
        if r < 2:
            return (145, 135, 140, 255)
        return (155, 145, 150, 255)
draw_tile(3, 4, checker_floor)

# Tile 4,4: Water edge right
def water_edge_right(px, py):
    if px > 10:
        return grass_base(px, py)
    elif px > 7:
        threshold = 8 + ((py * 5 + 3) % 4)
        if px > threshold:
            return grass_base(px, py)
        return c('water_mid')
    return water_1(px, py)
draw_tile(4, 4, water_edge_right)

# Tile 5,4: Water edge bottom
def water_edge_bottom(px, py):
    if py > 10:
        return grass_base(px, py)
    elif py > 7:
        threshold = 8 + ((px * 3 + 1) % 4)
        if py > threshold:
            return grass_base(px, py)
        return c('water_mid')
    return water_1(px, py)
draw_tile(5, 4, water_edge_bottom)

# Tile 6,4: Chimney bricks
def chimney(px, py):
    if px < 3 or px > 12:
        return (0, 0, 0, 0)
    brick_h = 3
    row = py // brick_h
    offset = (row % 2) * 4
    bx = (px - 3 + offset) % 7
    local_y = py % brick_h
    if local_y == 0 or bx == 0:
        return (95, 78, 72, 255)
    return (165, 108, 88, 255) if (px + py) % 3 != 0 else (148, 95, 78, 255)
draw_tile(6, 4, chimney)

# Tile 7,4: Path stones (stepping stones)
def stepping_stones(px, py):
    base = grass_base(px, py)
    # Draw 3 irregular stones
    stones = [(4, 4, 3), (8, 8, 2), (12, 12, 3)]
    for sx, sy, sr in stones:
        dist = abs(px - sx) + abs(py - sy)
        if dist <= sr:
            return c('cobble_mid') if dist < sr else c('cobble_dark')
    return base
draw_tile(7, 4, stepping_stones)

# =============================================================
# ROWS 5-7: Reserved for future tiles - fill with useful variants
# =============================================================

# Row 5: Edge tiles for water and transitions
for col in range(COLS):
    if col < 8:
        # Various grass tint variants
        def make_tinted_grass(col_idx):
            def tinted_grass(px, py):
                base = grass_base(px, py)
                tint = col_idx * 3
                r = min(255, base[0] + tint)
                g = min(255, base[1] - tint)
                b = min(255, base[2] + tint * 2)
                return (r, g, b, 255)
            return tinted_grass
        draw_tile(col, 5, make_tinted_grass(col))
    else:
        # Dark variants for forest
        def make_forest_variant(col_idx):
            def fv(px, py):
                r = (px * (col_idx + 3) + py * 7) % 31
                if r < 5:
                    return (65, 95, 65, 255)
                elif r < 12:
                    return (78, 112, 78, 255)
                elif r < 18:
                    return (88, 128, 85, 255)
                else:
                    return (72, 105, 72, 255)
            return fv
        draw_tile(col, 5, make_forest_variant(col))

# Row 6: Interior tiles
for col in range(COLS):
    if col < 4:
        # Wood floor variants
        def make_wood_var(ci):
            def wv(px, py):
                base = wood_floor(px, py)
                shift = ci * 5
                return (max(0, base[0] - shift), max(0, base[1] - shift), max(0, base[2] - shift), 255)
            return wv
        draw_tile(col, 6, make_wood_var(col))
    elif col < 8:
        # Wall variants
        def make_wall_var(ci):
            def wlv(px, py):
                base = wall(px, py)
                shift = (ci - 4) * 8
                return (min(255, base[0] + shift), min(255, base[1] + shift - 3), min(255, base[2] + shift), 255)
            return wlv
        draw_tile(col, 6, make_wall_var(col))
    else:
        # Dark interior
        def make_dark_floor(ci):
            def df(px, py):
                r = (px * 5 + py * (ci + 1)) % 19
                if r < 4:
                    return (82, 58, 42, 255)
                elif r < 9:
                    return (95, 68, 48, 255)
                else:
                    return (88, 62, 45, 255)
            return df
        draw_tile(col, 6, make_dark_floor(col))

# Row 7: Special tiles
for col in range(COLS):
    if col < 4:
        # Roof color variants  
        def make_roof_var(ci):
            def rv(px, py):
                base = roof(px, py)
                shift = ci * 10
                return (min(255, base[0] + shift), max(0, base[1] - shift), min(255, base[2] + shift // 2), 255)
            return rv
        draw_tile(col, 7, make_roof_var(col))
    elif col < 8:
        # Cobble variants
        def make_cobble_var(ci):
            def cv(px, py):
                base = cobble(px, py)
                shift = (ci - 4) * 6
                return (min(255, base[0] + shift), min(255, base[1] + shift), min(255, base[2] + shift), 255)
            return cv
        draw_tile(col, 7, make_cobble_var(col))
    else:
        # Placeholder: solid with subtle texture
        def make_placeholder(ci):
            def ph(px, py):
                v = 50 + ci * 8 + ((px + py) % 3) * 5
                return (v, v - 5, v + 5, 255)
            return ph
        draw_tile(col, 7, make_placeholder(col))

# Save tileset
output_path = r'D:\little-things\public\assets\approved\tiles\tileset_mallowmere.png'
img.save(output_path, 'PNG')
print(f'Generated tileset: {W}x{H} ({COLS}x{ROWS} tiles of {TILE}x{TILE})')
print(f'Saved to: {output_path}')

# Also generate a preview HTML
preview_html = f'''<!DOCTYPE html>
<html><head><title>Tileset Preview</title>
<style>body{{background:#231A30;color:#F2DEB8;font-family:monospace;padding:20px}}
img{{image-rendering:pixelated;width:{W*4}px;border:2px solid #766184}}
.grid{{display:grid;grid-template-columns:repeat({COLS},64px);gap:2px;margin-top:20px}}
.tile{{width:64px;height:64px;image-rendering:pixelated;border:1px solid #392D49}}
</style></head><body>
<h1>LITTLE THINGS — Tileset Mallowmere</h1>
<p>{COLS}x{ROWS} tiles, {TILE}x{TILE}px each</p>
<img src="tileset_mallowmere.png" alt="Full tileset">
<h2>Individual Tiles</h2>
<div class="grid" id="tiles"></div>
<script>
const img=new Image();img.src="tileset_mallowmere.png";img.onload=()=>{{
const g=document.getElementById("tiles");
for(let r=0;r<{ROWS};r++)for(let c=0;c<{COLS};c++){{
const cv=document.createElement("canvas");cv.width=cv.height={TILE};
cv.getContext("2d").drawImage(img,c*{TILE},r*{TILE},{TILE},{TILE},0,0,{TILE},{TILE});
cv.className="tile";cv.title=`Tile (${{c}},${{r}}) Frame ${{r*{COLS}+c}}`;
cv.style.imageRendering="pixelated";g.appendChild(cv);
}}
}};
</script></body></html>'''

with open(r'D:\little-things\public\assets\approved\tiles\tileset_preview.html', 'w') as f:
    f.write(preview_html)
print('Generated tileset preview HTML')
