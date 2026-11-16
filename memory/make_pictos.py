import base64, io, urllib.request
from PIL import Image, ImageFilter

BASE = 'https://customer-assets-agu9un31.emergentagent.net/job_mobile-confort-build/artifacts/'
SRC = {
    'cursor': BASE + 'ab31c37c93b6f54e_Cursor-magnify%20pending.png',
    'cursor_vocalize': BASE + '09f59558a6708789_Cursor-magnify%20vocalize%20pending.png',
    'focus': BASE + 'e1bbcab5d4b391da_Magnify-Vocalize_focus.png',
}


def load(url):
    data = urllib.request.urlopen(url).read()
    return Image.open(io.BytesIO(data)).convert('RGBA')


def to_glyph(img):
    """Black glyph on transparent background (white/light pixels dropped)."""
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    px = img.load()
    op = out.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            r, g, b, a = px[x, y]
            if a > 40 and (r + g + b) / 3 < 140:
                op[x, y] = (0, 0, 0, 255)
    return out


def outlined(glyph, size, ring):
    """Thick white ring around the black glyph, so it reads on dark backgrounds."""
    bbox = glyph.getbbox()
    glyph = glyph.crop(bbox)
    inner = size - 2 * ring
    glyph.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    left = (size - glyph.size[0]) // 2
    top = (size - glyph.size[1]) // 2
    alpha = Image.new('L', (size, size), 0)
    alpha.paste(glyph.split()[3], (left, top))
    halo = alpha.filter(ImageFilter.MaxFilter(2 * ring + 1))
    white = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    canvas = Image.composite(white, canvas, halo)
    canvas.paste(Image.new('RGBA', glyph.size, (0, 0, 0, 255)), (left, top), glyph)
    return canvas


def data_url(img):
    buffer = io.BytesIO()
    img.save(buffer, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()


result = {}

for key in ('cursor', 'cursor_vocalize'):
    result[key] = data_url(outlined(to_glyph(load(SRC[key])), 32, 3))

focus = to_glyph(load(SRC['focus']))
width, height = focus.size
# Haut de l'image : bulle de vocalisation a gauche, loupe a droite
bubble = focus.crop((0, 0, int(width * 0.35), int(height * 0.235)))
magnify = focus.crop((int(width * 0.65), 0, width, int(height * 0.235)))
result['badge_vocalize'] = data_url(outlined(bubble, 40, 3))
result['badge_magnify'] = data_url(outlined(magnify, 40, 3))

for key, value in result.items():
    print(key, len(value))

with open('/app/memory/pictos.txt', 'w') as handle:
    for key, value in result.items():
        handle.write(f'{key}\t{value}\n')
