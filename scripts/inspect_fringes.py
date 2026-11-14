import os
import json
import numpy as np
from PIL import Image

p = r'D:\little-things\public\assets\extracted\little_things__enchanted_sprite_collection\sprite_005_114x156.png'
im = Image.open(p)
arr = np.array(im)
alpha = arr[:, :, 3]
semi_mask = (alpha > 15) & (alpha < 200)
if np.any(semi_mask):
    rgb_semi = arr[semi_mask, :3]
    avg_rgb = np.mean(rgb_semi, axis=0)
    print("Mimi sprite fringe sample avg RGB:", avg_rgb)
    print("Unique alpha values count:", len(np.unique(alpha)))
    print("Alpha values min/max:", alpha.min(), alpha.max())

p2 = r'D:\little-things\public\assets\extracted\magical_pixel_art_potion_collection\sprite_001_140x169.png'
im2 = Image.open(p2)
arr2 = np.array(im2)
alpha2 = arr2[:, :, 3]
semi_mask2 = (alpha2 > 15) & (alpha2 < 200)
if np.any(semi_mask2):
    rgb_semi2 = arr2[semi_mask2, :3]
    print("Potion sprite fringe sample avg RGB:", np.mean(rgb_semi2, axis=0))
