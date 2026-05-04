from PIL import Image
import colorsys
import os

base_path = 'public/avatar_front.png'
male_dir = 'public/avatars/male/'
female_dir = 'public/avatars/female/'

# HSL Hue shift (0.0 to 1.0)
def shift_hue(image, amount):
    image = image.convert('RGBA')
    pixels = image.load()
    for i in range(image.size[0]):
        for j in range(image.size[1]):
            r, g, b, a = pixels[i, j]
            if a == 0: continue
            
            # Simple hue rotation formula for visual variation
            h, l, s = colorsys.rgb_to_hls(r/255.0, g/255.0, b/255.0)
            h = (h + amount) % 1.0
            r_new, g_new, b_new = colorsys.hls_to_rgb(h, l, s)
            
            pixels[i, j] = (int(r_new * 255), int(g_new * 255), int(b_new * 255), a)
    return image

if not os.path.exists(base_path):
    print("Base avatar not found")
    exit(1)

base_img = Image.open(base_path)

# Generate 20 male
for i in range(1, 21):
    amount = i * (1.0 / 20.0) # Full spectrum
    shifted = shift_hue(base_img, amount)
    # Slight brightness adjustment for distinction
    shifted.save(f"{male_dir}male_{i:02d}.png")
    
# Generate 20 female (we will do a subtle flip and different hue mapping to distinguish)
flipped_img = base_img.transpose(Image.FLIP_LEFT_RIGHT)
for i in range(1, 21):
    amount = (i * (1.0 / 20.0)) + 0.5 # Shifted spectrum
    shifted = shift_hue(flipped_img, amount)
    shifted.save(f"{female_dir}female_{i:02d}.png")

print("Generated 40 avatars successfully!")
