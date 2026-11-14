import os
import json
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

RAW_DIR = r'D:\little-things\assets\raw'
APPROVED_DIR = r'D:\little-things\assets\approved'
PUBLIC_DIR = r'D:\little-things\public\assets\approved'

for sub in ['customers', 'flowers', 'decor']:
    os.makedirs(os.path.join(APPROVED_DIR, sub), exist_ok=True)
    os.makedirs(os.path.join(PUBLIC_DIR, sub), exist_ok=True)

def copy_to_approved(img, subfolder, name):
    p1 = os.path.join(APPROVED_DIR, subfolder, name)
    p2 = os.path.join(PUBLIC_DIR, subfolder, name)
    img.save(p1)
    img.save(p2)
    return p1

def clean_dark_bg(arr, thresh=28):
    """Clean dark background from JPG and make transparent PNG."""
    h, w, c = arr.shape
    brightness = np.max(arr, axis=-1)
    alpha = np.where(brightness > thresh, 255, 0).astype(np.uint8)
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = arr
    out[:, :, 3] = alpha
    return out

# 1. PROCESS SHEET 3: CUSTOMERS
print("Processing Sheet 3: Funny Customers...")
im3 = Image.open(os.path.join(RAW_DIR, 'sheet3_funny_customers.jpg'))
arr3 = np.array(im3)
fg_mask3 = np.max(arr3, axis=-1) > 26

labeled3, num3 = label(fg_mask3)
objs3 = find_objects(labeled3)

blobs3 = []
for i, sl in enumerate(objs3):
    w = sl[1].stop - sl[1].start
    h = sl[0].stop - sl[0].start
    area = np.sum(labeled3[sl] == (i + 1))
    if w >= 25 and h >= 35 and area >= 200:
        blobs3.append((sl[1].start, sl[0].start, w, h, sl, i + 1))

blobs3.sort(key=lambda b: (b[1] // 45, b[0]))

# Key customer sprites from top row
# Let's crop and standardize to 40x48 px
customer_names = [
    'bunny', 'bear', 'frog', 'fox', 'mushroom', 'fairy', 'bird', 'cat', 'hedgehog', 'ghost'
]

customer_manifest = []

# Take the top row characters
top_row = [b for b in blobs3 if 35 <= b[1] <= 80 and b[2] <= 100]
print(f"Top row customer candidates: {len(top_row)}")

for idx, b in enumerate(top_row[:len(customer_names)]):
    x, y, w, h, sl, obj_id = b
    cname = customer_names[idx]
    
    crop_arr = arr3[sl[0].start:sl[0].stop, sl[1].start:sl[1].stop].copy()
    mask = (labeled3[sl] == obj_id)
    
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = crop_arr
    rgba[:, :, 3] = np.where(mask, 255, 0)
    
    # Standardize size
    cimg = Image.fromarray(rgba)
    scale = min(36 / w, 44 / h)
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    cimg_res = cimg.resize((nw, nh), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', (40, 48), (0, 0, 0, 0))
    canvas.paste(cimg_res, ((40 - nw) // 2, 48 - nh), cimg_res)
    
    fname = f"customer_{cname}.png"
    copy_to_approved(canvas, 'customers', fname)
    
    customer_manifest.append({
        'id': cname,
        'name': cname.capitalize(),
        'sprite': f"customers/{fname}",
        'width': 40,
        'height': 48
    })

# 2. PROCESS SHEET 2: FLOWERS & GARDEN
print("Processing Sheet 2: Flowers & Garden...")
im2 = Image.open(os.path.join(RAW_DIR, 'sheet2_flowers_interactions.jpg'))
arr2 = np.array(im2, dtype=float)

# Background color distance
bg2 = np.array([117, 75, 88], dtype=float)
dist_bg2 = np.linalg.norm(arr2 - bg2, axis=-1)
dist_dark2 = np.linalg.norm(arr2 - np.array([15, 12, 12]), axis=-1)
fg_mask2 = (dist_bg2 > 30) & (dist_dark2 > 25)

labeled2, num2 = label(fg_mask2)
objs2 = find_objects(labeled2)

flower_blobs = []
for i, sl in enumerate(objs2):
    w = sl[1].stop - sl[1].start
    h = sl[0].stop - sl[0].start
    area = np.sum(labeled2[sl] == (i + 1))
    if 18 <= w <= 80 and 18 <= h <= 80 and area >= 120:
        flower_blobs.append((sl[1].start, sl[0].start, w, h, sl, i + 1))

flower_blobs.sort(key=lambda b: (b[1] // 40, b[0]))
print(f"Flower & prop candidates: {len(flower_blobs)}")

flower_types = [
    ('moonflower', 'Moonflower', 'Glowing lavender flower that opens under moonlight', 0),
    ('sunberry', 'Sunberry Bloom', 'Golden blossom filled with warm sunny nectar', 1),
    ('dream_tulip', 'Dream Tulip', 'Soft pink tulip that whispers dreamy secrets', 2),
    ('glowcap', 'Glowcap Mushroom', 'Bioluminescent cap that lights dark paths', 3),
    ('whisper_fern', 'Whisper Fern', 'Silver fern whose fronds rustle in still air', 4)
]

flowers_manifest = []
for f_id, f_name, f_desc, blob_idx in flower_types:
    if blob_idx < len(flower_blobs):
        x, y, w, h, sl, obj_id = flower_blobs[blob_idx + 1] # skip corner blob
        crop_arr = arr2[sl[0].start:sl[0].stop, sl[1].start:sl[1].stop].copy().astype(np.uint8)
        mask = (labeled2[sl] == obj_id)
        
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[:, :, :3] = crop_arr
        rgba[:, :, 3] = np.where(mask, 255, 0)
        
        fimg = Image.fromarray(rgba)
        scale = min(24 / w, 24 / h)
        nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
        fimg_res = fimg.resize((nw, nh), Image.Resampling.LANCZOS)
        
        canvas = Image.new('RGBA', (28, 28), (0, 0, 0, 0))
        canvas.paste(fimg_res, ((28 - nw) // 2, 28 - nh), fimg_res)
        
        fname = f"flower_{f_id}.png"
        copy_to_approved(canvas, 'flowers', fname)
        
        flowers_manifest.append({
            'id': f_id,
            'name': f_name,
            'desc': f_desc,
            'sprite': f"flowers/{fname}",
            'price': 10
        })

# 3. INTERACTIVE DECOR PROPS
decor_types = [
    ('crystal_ball', 'Crystal Ball', 'A swirling glass orb that predicts visitor wishes', 65, 5),
    ('gramophone', 'Enchanted Gramophone', 'Plays cheerful 16-bit melodies for visitors', 90, 6),
    ('mailbox', 'Cottage Mailbox', 'A sweet wooden box for village correspondence', 40, 7),
    ('fairy_lantern', 'Fairy Lantern', 'Casts a gentle lavender glow across the room', 50, 8)
]

decor_manifest = []
for d_id, d_name, d_desc, cost, blob_idx in decor_types:
    if blob_idx < len(flower_blobs):
        x, y, w, h, sl, obj_id = flower_blobs[blob_idx + 5]
        crop_arr = arr2[sl[0].start:sl[0].stop, sl[1].start:sl[1].stop].copy().astype(np.uint8)
        mask = (labeled2[sl] == obj_id)
        
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[:, :, :3] = crop_arr
        rgba[:, :, 3] = np.where(mask, 255, 0)
        
        dimg = Image.fromarray(rgba)
        scale = min(32 / w, 32 / h)
        nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
        dimg_res = dimg.resize((nw, nh), Image.Resampling.LANCZOS)
        
        canvas = Image.new('RGBA', (36, 36), (0, 0, 0, 0))
        canvas.paste(dimg_res, ((36 - nw) // 2, 36 - nh), dimg_res)
        
        fname = f"decor_{d_id}.png"
        copy_to_approved(canvas, 'decor', fname)
        
        decor_manifest.append({
            'id': d_id,
            'name': d_name,
            'desc': d_desc,
            'price': cost,
            'sprite': f"decor/{fname}"
        })

# Save manifests
with open(r'D:\little-things\public\assets\customers_manifest.json', 'w') as f:
    json.dump(customer_manifest, f, indent=2)
with open(r'D:\little-things\public\assets\flowers_manifest.json', 'w') as f:
    json.dump(flowers_manifest, f, indent=2)
with open(r'D:\little-things\public\assets\decor_manifest.json', 'w') as f:
    json.dump(decor_manifest, f, indent=2)

print("Processed and approved new customer, flower, and decor assets!")
