"""
Extract character sprites from the original artwork sheets.

The first asset pass cut the wrong boxes out of the sheets (several
"customers" and the cat and fairy NPCs all came out as Mimi), so this script
re-extracts every non-player character from hand-checked regions.

Usage (from the repository root):
    python scripts/extract_characters.py            # writes the sprites
    python scripts/extract_characters.py --preview  # also writes a contact sheet

Regions are given in the coordinates of the 1536x1024 source sheets.
Writes to public/assets/approved/{customers,characters}/.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "approved"

CUSTOMER_SHEET = ROOT / "assets" / "Whimsical Pixel Customer Sprite Sheet-2.png"
NPC_SHEET = ROOT / "assets" / "Little Things_ Enchanted Sprite Collection.png"

# name: (sheet, (left, top, right, bottom), output folder, target height in px)
SPRITES: dict[str, tuple[Path, tuple[int, int, int, int], str, int]] = {
    # Customers: the front-facing pose of each character.
    "customer_frog": (CUSTOMER_SHEET, (20, 222, 84, 315), "customers", 40),
    "customer_fox": (CUSTOMER_SHEET, (334, 206, 430, 320), "customers", 42),
    "customer_bear": (CUSTOMER_SHEET, (612, 228, 676, 326), "customers", 42),
    "customer_cat": (CUSTOMER_SHEET, (908, 228, 972, 326), "customers", 42),
    "customer_bird": (CUSTOMER_SHEET, (26, 376, 94, 468), "customers", 40),
    "customer_hedgehog": (CUSTOMER_SHEET, (278, 376, 348, 468), "customers", 38),
    "customer_ghost": (CUSTOMER_SHEET, (502, 380, 566, 468), "customers", 40),
    "customer_deer": (CUSTOMER_SHEET, (712, 376, 786, 472), "customers", 44),
    "customer_unicorn": (CUSTOMER_SHEET, (942, 376, 1022, 472), "customers", 42),
    "customer_bunny": (CUSTOMER_SHEET, (630, 70, 688, 166), "customers", 42),
    "customer_fairy": (CUSTOMER_SHEET, (334, 70, 424, 166), "customers", 40),
    "customer_mushroom": (CUSTOMER_SHEET, (828, 66, 900, 166), "customers", 40),
    # Village characters
    "pickles": (NPC_SHEET, (332, 398, 412, 488), "characters", 26),
    "pip": (NPC_SHEET, (328, 612, 424, 702), "characters", 28),
    "willow_deer": (NPC_SHEET, (300, 836, 458, 1010), "characters", 40),
}

ALPHA_SOLID = 150  # the sheets have soft glows behind each sprite; drop them
MIN_PART = 40  # ignore stray sparkles smaller than this many pixels


def clear_opaque_background(crop: np.ndarray, tolerance: float = 26.0) -> None:
    """
    Some sheets have no transparency. Flood-fill inwards from the edges of the
    crop and make everything close to the background colour transparent.
    """
    rgb = crop[..., :3].astype(np.float32)
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    background = np.median(edge, axis=0)
    close = np.linalg.norm(rgb - background, axis=-1) < tolerance
    labels, _ = ndimage.label(close)
    border_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border_labels = border_labels[border_labels > 0]
    crop[np.isin(labels, border_labels), 3] = 0


def extract(sheet: Image.Image, box: tuple[int, int, int, int], height: int) -> Image.Image:
    crop = np.array(sheet.crop(box).convert("RGBA"))
    edges = np.concatenate([crop[0, :, 3], crop[-1, :, 3], crop[:, 0, 3], crop[:, -1, 3]])
    if (edges >= ALPHA_SOLID).mean() > 0.9:
        clear_opaque_background(crop)
    solid = crop[..., 3] >= ALPHA_SOLID

    # Keep only the main body: the largest connected part plus anything
    # touching it (tails, wings), but not floating sparkles.
    labels, count = ndimage.label(ndimage.binary_dilation(solid, iterations=2))
    if count == 0:
        raise ValueError(f"nothing found in {box}")
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    keep = np.zeros_like(solid)
    biggest = int(np.argmax(sizes)) + 1
    for index, size in enumerate(sizes, start=1):
        if index == biggest or size >= max(MIN_PART, sizes.max() * 0.15):
            keep |= labels == index
    mask = solid & keep

    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    crop[..., 3] = np.where(mask, 255, 0)
    crop = crop[rows[0] : rows[-1] + 1, cols[0] : cols[-1] + 1]

    image = Image.fromarray(crop, "RGBA")
    width = max(1, round(image.width * height / image.height))
    # Downscale smoothly, then snap alpha back to fully on/off for crisp edges.
    small = image.resize((width, height), Image.LANCZOS)
    pixels = np.array(small)
    pixels[..., 3] = np.where(pixels[..., 3] >= 128, 255, 0)
    return Image.fromarray(pixels, "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--preview", type=Path, help="also write a contact sheet to this path")
    args = parser.parse_args()

    sheets: dict[Path, Image.Image] = {}
    results: list[tuple[str, Image.Image]] = []
    for name, (sheet_path, box, folder, height) in SPRITES.items():
        sheet = sheets.setdefault(sheet_path, Image.open(sheet_path))
        sprite = extract(sheet, box, height)
        target = OUT / folder / f"{name}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(target, optimize=True)
        results.append((name, sprite))
        print(f"{target.relative_to(ROOT)}  {sprite.width}x{sprite.height}")

    if args.preview:
        scale = 3
        cell = 52 * scale
        sheet = Image.new("RGBA", (cell * len(results), cell), (58, 42, 71, 255))
        for i, (_, sprite) in enumerate(results):
            big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.NEAREST)
            sheet.alpha_composite(big, (i * cell + (cell - big.width) // 2, cell - big.height - 6))
        sheet.save(args.preview)
        print(f"preview: {args.preview}")


if __name__ == "__main__":
    main()
