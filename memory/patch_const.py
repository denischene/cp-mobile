import re

pictos = dict(line.strip().split('\t') for line in open('/app/memory/pictos.txt'))
path = '/app/confort-src/src/app/core/constantes.core.ts'
src = open(path, encoding='utf-8').read()

mapping = {
    'MAGNIFIER_BADGE_MAGNIFY': pictos['badge_magnify'],
    'MAGNIFIER_BADGE_VOCALIZE': pictos['badge_vocalize'],
    'MAGNIFIER_CURSOR': pictos['cursor'],
    'MAGNIFIER_CURSOR_VOCALIZE': pictos['cursor_vocalize'],
}

for name, value in mapping.items():
    pattern = re.compile(r"^const %s = '.*?';$" % name, re.M)
    assert pattern.search(src), name
    src = pattern.sub(lambda m: "const %s = '%s';" % (name, value), src, count=1)

old = """const MAGNIFIER_BADGE_WIDTH = 44;
const MAGNIFIER_BADGE_HEIGHT = 41;"""
new = """const MAGNIFIER_BADGE_WIDTH = 40;
const MAGNIFIER_BADGE_HEIGHT = 40;
/* Cadre pose sur l'element focalise en attente, et textes rendus focalisables */
const MAGNIFIER_FRAME_PADDING = 6;
const MAGNIFIER_TEXT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, blockquote, caption, td, th';
const MAGNIFIER_TEXT_MAX = 600;
/* Copie de page : delai normal et rafraichissement rapide apres une activation */
const MAGNIFIER_CLONE_DELAY = 160;
const MAGNIFIER_CLONE_FAST = 60;
const MAGNIFIER_CLONE_SETTLE = 450;"""
assert old in src
src = src.replace(old, new)

open(path, 'w', encoding='utf-8').write(src)
print('ok')
