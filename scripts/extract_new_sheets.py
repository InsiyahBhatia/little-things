import os
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

raw_dir = r'D:\little-things\assets\raw'
proc_new_dir = r'D:\little-things\assets\processed\new_sheets'
os.makedirs(proc_new_dir, exist_ok=True)

sheets = ['sheet1_core_world.jpg', 'sheet2_flowers_interactions.jpg', 'sheet3_funny_customers.jpg']

for sheet_name in sheets:
    sheet_base = sheet_name.replace('.jpg', '')
    cat_dir = os.path.join(proc_new_dir, sheet_base)
    os.makedirs(cat_dir, exist_ok=True)
    
    im = Image.open(os.path.join(raw_dir, sheet_name))
    arr = np.array(im)
    
    # Calculate brightness to find non-background pixels
    brightness = np.max(arr, axis=-1)
    
    # Threshold background: if max channel > 28, it's foreground
    fg_mask = brightness > 26
    
    labeled, num_features = label(fg_mask)
    objs = find_objects(labeled)
    
    valid_blobs = []
    for i, sl in enumerate(objs):
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        w = x1 - x0
        h = y1 - y0
        area = np.sum(labeled[sl] == (i + 1))
        
        if w >= 12 and h >= 12 and area >= 80:
            blob = arr[y0:y1, x0:x1]
            blob_mask = (labeled[sl] == (i + 1))
            
            # Create RGBA sprite
            rgba = np.zeros((h, w, 4), dtype=np.uint8)
            rgba[:, :, :3] = blob
            rgba[:, :, 3] = np.where(blob_mask, 255, 0)
            
            valid_blobs.append((x0, y0, w, h, rgba))
            
    # Sort blobs top-to-bottom, left-to-right
    valid_blobs.sort(key=lambda b: (b[1] // 30, b[0]))
    
    print(f"=== {sheet_name} ===")
    print(f"Total extracted foreground blobs: {len(valid_blobs)}")
    for idx, (bx, by, bw, bh, bimg) in enumerate(valid_blobs):
        sname = f"sprite_{idx:03d}_{bw}x{bh}.png"
        Image.fromarray(bimg).save(os.path.join(cat_dir, sname))
        if idx < 12:
            print(f"  #{idx}: {bw}x{bh} at ({bx}, {by})")
    if len(valid_blobs) > 12:
        print(f"  ... and {len(valid_blobs) - 12} more")

print("New sheets segmented successfully!")
