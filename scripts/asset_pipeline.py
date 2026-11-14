import os
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

RAW_DIR = r'D:\little-things\assets\raw'
PROCESSED_DIR = r'D:\little-things\assets\processed'
APPROVED_DIR = r'D:\little-things\assets\approved'
PUBLIC_DIR = r'D:\little-things\public\assets\approved'

for d in [PROCESSED_DIR, APPROVED_DIR, PUBLIC_DIR]:
    os.makedirs(d, exist_ok=True)

def decontaminate_and_clean(arr, bg_rgb=(109, 68, 72), alpha_thresh=110):
    """
    Decontaminates edge halos against the background matte color
    and enforces crisp binary alpha for clean pixel-art rendering.
    """
    h, w, c = arr.shape
    if c < 4:
        return arr
    
    alpha = arr[:, :, 3].copy()
    rgb = arr[:, :, :3].astype(np.float32)
    bg = np.array(bg_rgb, dtype=np.float32)
    
    # 1. Binary alpha mask
    clean_alpha = np.zeros((h, w), dtype=np.uint8)
    clean_alpha[alpha >= alpha_thresh] = 255
    
    # 2. Decontamination for boundary pixels
    # For pixels where alpha was between 30 and 240, color was blended with bg
    semi_mask = (alpha > 30) & (alpha < 240)
    if np.any(semi_mask):
        norm_alpha = alpha[semi_mask, None].astype(np.float32) / 255.0
        norm_alpha = np.maximum(norm_alpha, 0.2)
        # Un-premultiply against bg
        unblended = (rgb[semi_mask] - (1.0 - norm_alpha) * bg) / norm_alpha
        unblended = np.clip(unblended, 0, 255)
        rgb[semi_mask] = unblended
        
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = clean_alpha
    return out

print("Starting asset extraction, decontamination, and segmentation...")

manifest = {}
validation_report = []
dimension_report = []

raw_files = sorted(os.listdir(RAW_DIR))
for fname in raw_files:
    if not fname.endswith('.png'): continue
    category = fname.replace('.png', '').replace(' ', '_').lower()
    cat_proc_dir = os.path.join(PROCESSED_DIR, category)
    os.makedirs(cat_proc_dir, exist_ok=True)
    
    im_path = os.path.join(RAW_DIR, fname)
    im = Image.open(im_path)
    arr = np.array(im)
    
    if arr.shape[-1] < 4:
        # Full scene reference
        ref_out = os.path.join(cat_proc_dir, 'reference_full.png')
        im.save(ref_out)
        manifest[category] = [{
            'id': 'reference_full',
            'file': ref_out,
            'width': im.width,
            'height': im.height,
            'type': 'scene_reference'
        }]
        continue
        
    # Sample background color from low alpha regions or borders
    alpha = arr[:, :, 3]
    low_a = (alpha > 10) & (alpha < 80)
    if np.any(low_a):
        bg_rgb = arr[low_a, :3].mean(axis=0)
    else:
        bg_rgb = [109, 68, 72]
        
    # Segment blobs
    mask = alpha > 40
    labeled, num_objs = label(mask)
    objs = find_objects(labeled)
    
    cat_sprites = []
    sprite_idx = 0
    for sl in objs:
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        w = x1 - x0
        h = y1 - y0
        if w < 16 or h < 16:
            continue
            
        blob = arr[y0:y1, x0:x1].copy()
        cleaned_blob = decontaminate_and_clean(blob, bg_rgb)
        
        # Verify blob has visible content
        if not np.any(cleaned_blob[:, :, 3] > 0):
            continue
            
        # Crop tight to cleaned alpha bounding box
        nz_y, nz_x = np.nonzero(cleaned_blob[:, :, 3])
        if len(nz_y) == 0:
            continue
        cy0, cy1 = nz_y.min(), nz_y.max() + 1
        cx0, cx1 = nz_x.min(), nz_x.max() + 1
        tight_blob = cleaned_blob[cy0:cy1, cx0:cx1]
        
        tw, th = tight_blob.shape[1], tight_blob.shape[0]
        if tw < 12 or th < 12:
            continue
            
        sprite_img = Image.fromarray(tight_blob)
        sname = f"sprite_{sprite_idx:03d}_{tw}x{th}.png"
        out_path = os.path.join(cat_proc_dir, sname)
        sprite_img.save(out_path)
        
        # Validation checks
        unique_alphas = np.unique(tight_blob[:, :, 3]).tolist()
        is_binary_alpha = set(unique_alphas).issubset({0, 255})
        
        entry = {
            'index': sprite_idx,
            'name': sname,
            'category': category,
            'path': out_path,
            'orig_x': int(x0 + cx0),
            'orig_y': int(y0 + cy0),
            'width': tw,
            'height': th,
            'is_binary_alpha': is_binary_alpha,
            'unique_alphas': unique_alphas
        }
        cat_sprites.append(entry)
        dimension_report.append({'category': category, 'name': sname, 'width': tw, 'height': th})
        validation_report.append({
            'name': sname,
            'category': category,
            'width': tw,
            'height': th,
            'binary_alpha': is_binary_alpha,
            'semi_transparent_pixels': int(np.sum((tight_blob[:, :, 3] > 0) & (tight_blob[:, :, 3] < 255)))
        })
        sprite_idx += 1
        
    cat_sprites.sort(key=lambda s: (s['orig_y'] // 40, s['orig_x']))
    manifest[category] = cat_sprites
    print(f"Processed {category}: {len(cat_sprites)} decontaminated sprites")

# Save reports
with open(r'D:\little-things\assets\asset_inventory.json', 'w') as f:
    json.dump(manifest, f, indent=2)

with open(r'D:\little-things\assets\transparent_png_validation_report.json', 'w') as f:
    json.dump(validation_report, f, indent=2)

with open(r'D:\little-things\assets\sprite_dimensions_report.json', 'w') as f:
    json.dump(dimension_report, f, indent=2)

print("Baseline segmentation & decontamination complete!")
