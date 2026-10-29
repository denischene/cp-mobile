import re, os, zipfile, shutil

build = '/app/frontend/build'
os.chdir(build)

s = open('index.html', encoding='utf-8').read()
s = s.replace('<script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>', '')
s = re.sub(r'<script>!function\(e,r\).*?</script>', '', s, flags=re.S)
open('index.html', 'w', encoding='utf-8').write(s)

for f in ['test-modal.html', 'downloads/confort-plus-site-statique-cpm.zip']:
    if os.path.exists(f):
        os.remove(f)

shutil.copy('/app/frontend/public/.htaccess', '.htaccess')
shutil.copy('/app/memory/LISEZ-MOI.txt', 'LISEZ-MOI.txt')

out = '/app/frontend/public/downloads/confort-plus-site-statique-cpm.zip'
if os.path.exists(out):
    os.remove(out)

count = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirnames, filenames in os.walk('.'):
        for name in filenames:
            if name.endswith('.map'):
                continue
            full = os.path.join(dirpath, name)
            z.write(full, os.path.relpath(full, '.'))
            count += 1

names = zipfile.ZipFile(out).namelist()
toolbar = zipfile.ZipFile(out).read('js/toolbar.min.js').decode('utf-8', 'ignore')
expected = [
    'index.html', '.htaccess', 'LISEZ-MOI.txt',
    'downloads/orange-confort-plus-6.0.0-alpha.1-android.xpi',
    'downloads/orange-confort-plus-6.0.0-alpha.1-firefox.xpi',
    'downloads/orange-confort-plus-6.0.0-alpha.1-chrome-edge.zip',
    'js/toolbar.min.js', 'css/styles.min.css', '_locales/fr/messages.json',
    'assets/json/modes-of-use.json',
]
print('files', count, round(os.path.getsize(out) / 1048576, 2), 'Mo')
print('missing', [k for k in expected if k not in names])
print('serveur a jour', all(m in toolbar for m in ['magnifier-viewport', 'ensureTopLayer', 'copyTopLayerElements', 'armClick']))
print('locale loupe', 'full-screen magnifier' in zipfile.ZipFile(out).read('_locales/en/messages.json').decode('utf-8'))
print('clean index', 'posthog' not in s and '/cpm/static' in s)
