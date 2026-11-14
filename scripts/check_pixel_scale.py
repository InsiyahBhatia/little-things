import os
import numpy as np
from PIL import Image

# Analyze horizontal & vertical autocorrelation / gradient differences to find the texel scale (block size)
im = Image.open(r'D:\little-things\public\assets\extracted\little_things__enchanted_sprite_collection\sprite_005_114x156.png').convert('RGB')
arr = np.array(im, dtype=float)

dx = np.abs(arr[:, 1:, :] - arr[:, :-1, :]).mean(axis=-1)
dy = np.abs(arr[1:, :, :] - arr[:-1, :, :]).mean(axis=-1)

# Check zero or near-zero diff runs
print("Analyzing texel / pixel cluster size for sprite_005 (Mimi)...")
print(f"Original sprite size: {im.size}")

# Test resampling to standard game heights:
# If character sprite logical size in game is 32x32 or 24x32:
# The extracted sprite is 114x156 (approx ~4.5x scale of a 24x36 sprite or ~3.5x scale of 32x48 sprite)
for scale in [0.25, 0.3, 0.333, 0.5]:
    w = int(round(im.width * scale))
    h = int(round(im.height * scale))
    print(f"Scale {scale}: {w}x{h} px")
