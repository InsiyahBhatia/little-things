"""
Extract environment, furniture, decoration and ingredient sprites from the
original artwork sheets.

The first asset pass mislabelled most of these (the "cauldron" was a potion
shelf, the "glowcap" a gramophone, the "mailbox" a bellflower), so this
script re-extracts everything from hand-checked regions.

Usage (from the repository root):
    python scripts/extract_environment.py
    python scripts/extract_environment.py --boxes out_dir   # draw the regions for checking

Regions are written in the coordinates of a 1400px-wide preview of each
1536x1024 sheet and scaled up here, because that is how they were measured.
Writes to public/assets/approved/<folder>/<name>.png.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from extract_characters import OUT, ROOT, extract

VILLAGE = ROOT / "assets" / "Little Things_ Enchanted Witchlife Spritesheet.png"
GARDEN = ROOT / "assets" / "Little Things_ Magical Garden Sprite Sheet.png"
NATURE = ROOT / "assets" / "Pastel Fantasy Nature Sprite Collection.png"
INTERIOR = ROOT / "assets" / "Cozy Pixel-Art Witchy Shop Asset Sheet.png"
POTIONS = ROOT / "assets" / "Magical Pixel Art Potion Collection.png"

PREVIEW_WIDTH = 1400

# name: (sheet, (left, top, right, bottom) in preview coordinates, folder, height in game pixels)
SPRITES: dict[str, tuple[Path, tuple[int, int, int, int], str, int]] = {
    # --- Trees and big plants ------------------------------------------------
    "tree_blossom": (NATURE, (10, 8, 232, 228), "nature", 96),
    "tree_apple": (NATURE, (234, 8, 422, 228), "nature", 92),
    "tree_autumn": (NATURE, (424, 8, 612, 228), "nature", 92),
    "tree_wisteria": (NATURE, (616, 8, 802, 228), "nature", 108),
    "tree_lantern": (NATURE, (804, 8, 992, 228), "nature", 104),
    "tree_willow": (NATURE, (994, 8, 1182, 228), "nature", 104),
    "mushroom_giant": (NATURE, (1184, 8, 1392, 228), "nature", 76),
    # --- Bushes and rocks ----------------------------------------------------
    "bush_hydrangea": (NATURE, (8, 248, 158, 372), "nature", 30),
    "bush_rose": (NATURE, (162, 248, 298, 372), "nature", 28),
    "bush_daisy": (NATURE, (298, 248, 428, 372), "nature", 28),
    "bush_berry": (NATURE, (428, 248, 544, 372), "nature", 26),
    "bush_green": (NATURE, (652, 248, 772, 372), "nature", 26),
    "bush_marigold": (NATURE, (892, 248, 1012, 372), "nature", 26),
    "rock_mossy": (NATURE, (1016, 236, 1184, 366), "nature", 30),
    "rock_rune": (NATURE, (1186, 232, 1394, 384), "nature", 36),
    # --- Small flowers and ground cover -------------------------------------
    "flower_lavender": (NATURE, (8, 384, 134, 504), "nature", 20),
    "flower_daisies": (NATURE, (136, 384, 248, 504), "nature", 16),
    "flower_foxglove": (NATURE, (248, 384, 342, 504), "nature", 22),
    "flower_lily": (NATURE, (342, 384, 444, 504), "nature", 18),
    "mushrooms_red": (NATURE, (902, 384, 1028, 504), "nature", 18),
    "mushrooms_purple": (NATURE, (1132, 384, 1254, 504), "nature", 20),
    "mushroom_red": (NATURE, (8, 516, 148, 644), "nature", 26),
    "mushroom_purple": (NATURE, (152, 516, 284, 644), "nature", 26),
    "mushroom_pale": (NATURE, (284, 516, 404, 644), "nature", 22),
    "fungus_shelf": (NATURE, (528, 516, 668, 644), "nature", 22),
    "stump": (NATURE, (676, 516, 824, 644), "nature", 24),
    "log_hollow": (NATURE, (866, 516, 1014, 644), "nature", 22),
    "log_flowers": (NATURE, (1036, 516, 1214, 644), "nature", 22),
    "crystals": (NATURE, (1240, 500, 1390, 644), "nature", 28),
    "grass_tuft": (NATURE, (12, 664, 104, 752), "nature", 10),
    "sprout_clover": (NATURE, (182, 664, 264, 752), "nature", 10),
    "pebbles": (NATURE, (610, 664, 676, 752), "nature", 7),
    "rocks_small": (NATURE, (692, 652, 854, 752), "nature", 16),
    "rocks_cluster": (NATURE, (862, 648, 1064, 752), "nature", 22),
    "pond": (NATURE, (1072, 636, 1390, 754), "nature", 44),
    # --- Village props -------------------------------------------------------
    "fence_post": (NATURE, (8, 764, 142, 920), "props", 22),
    "fence_rope": (NATURE, (144, 764, 262, 920), "props", 18),
    "signpost": (NATURE, (398, 760, 494, 884), "props", 30),
    "lamppost": (NATURE, (500, 756, 606, 912), "props", 44),
    "arch_flowers": (NATURE, (612, 756, 774, 924), "props", 52),
    "arch_stone": (NATURE, (782, 756, 944, 924), "props", 52),
    "bridge_stone": (NATURE, (952, 786, 1174, 914), "props", 34),
    "waterfall": (NATURE, (1174, 756, 1394, 924), "props", 60),
    "cottage": (VILLAGE, (322, 106, 664, 358), "props", 128),
    "flower_box": (VILLAGE, (772, 382, 872, 448), "props", 18),
    "barrel": (VILLAGE, (1166, 386, 1238, 458), "props", 22),
    "lantern_stand": (VILLAGE, (712, 496, 778, 598), "props", 32),
    "planter": (VILLAGE, (108, 762, 222, 836), "props", 16),
    "crystal_cluster": (VILLAGE, (1252, 712, 1394, 842), "props", 34),
    # --- Shop interior -------------------------------------------------------
    "shop_counter": (INTERIOR, (8, 30, 378, 254), "furniture", 52),
    "potion_shelf": (INTERIOR, (382, 14, 574, 254), "furniture", 66),
    "potion_cabinet": (INTERIOR, (588, 24, 758, 254), "furniture", 66),
    "bookshelf": (INTERIOR, (762, 8, 1004, 254), "furniture", 68),
    "crystal_cabinet": (INTERIOR, (1008, 4, 1208, 254), "furniture", 66),
    "cauldron": (INTERIOR, (1216, 18, 1394, 254), "furniture", 50),
    "table_round": (INTERIOR, (22, 274, 198, 444), "furniture", 34),
    "table_long": (INTERIOR, (216, 276, 458, 422), "furniture", 30),
    "table_tea": (INTERIOR, (492, 290, 584, 422), "furniture", 22),
    "armchair": (INTERIOR, (958, 278, 1098, 424), "furniture", 34),
    "chair": (INTERIOR, (1112, 280, 1218, 424), "furniture", 32),
    "planter_lavender": (INTERIOR, (12, 470, 128, 590), "furniture", 18),
    "planter_hydrangea": (INTERIOR, (132, 452, 278, 590), "furniture", 20),
    "potted_plant": (INTERIOR, (398, 450, 508, 594), "furniture", 26),
    "hanging_herbs": (INTERIOR, (684, 452, 832, 560), "furniture", 22),
    "window_big": (INTERIOR, (1192, 428, 1390, 612), "furniture", 46),
    "window_small": (INTERIOR, (1082, 452, 1194, 608), "furniture", 40),
    "rug_oval": (INTERIOR, (718, 650, 888, 734), "furniture", 30),
    "banner_moon": (INTERIOR, (1022, 626, 1108, 762), "furniture", 30),
    "painting_castle": (INTERIOR, (1192, 640, 1308, 728), "furniture", 18),
    "shop_sign": (INTERIOR, (362, 766, 502, 908), "furniture", 30),
    "chalkboard": (INTERIOR, (502, 794, 594, 910), "furniture", 26),
    # --- Decorations you can buy ---------------------------------------------
    "decor_fairy_lantern": (INTERIOR, (1118, 762, 1214, 912), "decor", 28),
    "decor_crystal_ball": (GARDEN, (734, 108, 802, 190), "decor", 24),
    "decor_gramophone": (GARDEN, (804, 102, 884, 192), "decor", 28),
    "decor_star_globe": (INTERIOR, (508, 622, 614, 750), "decor", 26),
    "decor_magic_mirror": (INTERIOR, (622, 620, 718, 744), "decor", 30),
    "decor_rose_barrel": (INTERIOR, (282, 456, 390, 594), "decor", 22),
    # --- Ingredients (bag icons and plants in the world) ----------------------
    "flower_moonflower": (NATURE, (764, 384, 884, 504), "flowers", 20),
    "flower_sunberry": (NATURE, (552, 380, 648, 504), "flowers", 22),
    "flower_dream_tulip": (NATURE, (648, 384, 762, 504), "flowers", 20),
    "flower_whisper_fern": (NATURE, (440, 384, 552, 504), "flowers", 22),
    "flower_glowcap": (NATURE, (402, 516, 528, 644), "flowers", 22),
    # --- New ingredients --------------------------------------------------------
    "herb_lavender": (POTIONS, (12, 352, 160, 500), "flowers", 22),
    "forage_toadstool": (POTIONS, (18, 508, 146, 622), "flowers", 20),
    "forage_berries": (POTIONS, (160, 632, 284, 742), "flowers", 18),
    "forage_star_crystal": (POTIONS, (930, 504, 1034, 622), "flowers", 22),
    # --- New potions -------------------------------------------------------------
    "potion_dream": (POTIONS, (174, 18, 304, 172), "items", 26),
    "potion_glow": (POTIONS, (318, 18, 448, 172), "items", 26),
    "potion_sunny": (POTIONS, (462, 18, 596, 172), "items", 26),
    "potion_starlight": (POTIONS, (1004, 18, 1134, 172), "items", 26),
    "potion_moonberry": (POTIONS, (326, 188, 454, 344), "items", 26),
    "potion_love": (POTIONS, (20, 18, 162, 172), "items", 26),
    "potion_lavender_tea": (POTIONS, (606, 18, 738, 172), "items", 26),
    "potion_rainbow": (POTIONS, (1134, 18, 1262, 172), "items", 26),
    "potion_toadstool": (POTIONS, (1262, 18, 1392, 172), "items", 26),
    "potion_berry_jam": (POTIONS, (18, 188, 166, 344), "items", 26),
    "potion_ember": (POTIONS, (466, 188, 596, 344), "items", 26),
    "potion_cloud": (POTIONS, (602, 188, 734, 344), "items", 26),
    "potion_frost": (POTIONS, (876, 188, 1004, 344), "items", 26),
    "potion_fairy_dust": (POTIONS, (1140, 188, 1264, 344), "items", 26),
}


def scaled(box: tuple[int, int, int, int], sheet: Image.Image) -> tuple[int, int, int, int]:
    factor = sheet.width / PREVIEW_WIDTH
    return tuple(round(v * factor) for v in box)  # type: ignore[return-value]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--boxes", type=Path, help="draw the regions on each sheet into this folder and stop")
    args = parser.parse_args()

    sheets: dict[Path, Image.Image] = {}
    for sheet_path, *_ in SPRITES.values():
        sheets.setdefault(sheet_path, Image.open(sheet_path))

    if args.boxes:
        args.boxes.mkdir(parents=True, exist_ok=True)
        for sheet_path, sheet in sheets.items():
            canvas = sheet.convert("RGB")
            draw = ImageDraw.Draw(canvas)
            for name, (path, box, _, _) in SPRITES.items():
                if path == sheet_path:
                    rect = scaled(box, sheet)
                    draw.rectangle(rect, outline=(0, 255, 0), width=3)
                    draw.text((rect[0] + 3, rect[1] + 2), name, fill=(255, 255, 0))
            canvas.save(args.boxes / f"boxes_{sheet_path.stem.split(' ')[0]}_{sheet_path.stem.split(' ')[-1]}.png")
        return

    for name, (sheet_path, box, folder, height) in SPRITES.items():
        sheet = sheets[sheet_path]
        sprite = extract(sheet, scaled(box, sheet), height)
        target = OUT / folder / f"{name}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(target, optimize=True)
        print(f"{target.relative_to(ROOT)}  {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    main()
