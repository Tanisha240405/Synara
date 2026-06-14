from PIL import Image
import math

img = Image.open('e:/xeno2.0/public/logo.png').convert("RGBA")
width, height = img.size
pixels = img.load()

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if r > 240 and g > 240 and b > 240:
            pixels[x, y] = (255, 255, 255, 0)
        elif r > 200 and g > 200 and b > 200:
            # anti-aliasing
            alpha = int((255 - r) * 4.5)
            if alpha < 0: alpha = 0
            if alpha > 255: alpha = 255
            pixels[x, y] = (0, 0, 0, alpha)

# To ensure the image is properly cropped to the black box as well
# we can find the bounding box of non-transparent pixels
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

img.save('e:/xeno2.0/public/logo.png')
img.save('e:/xeno2.0/app/icon.png')
img.save('e:/xeno2.0/app/apple-icon.png')
print("Image processed successfully!")
