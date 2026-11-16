import json
import collections
import io

# 1. Nouveau reglage de duree dans chaque mode, et version pour forcer la mise a jour du stockage
path = '/app/confort-src/src/assets/json/modes-of-use.json'
with open(path, encoding='utf-8') as handle:
    data = json.load(handle, object_pairs_hook=collections.OrderedDict)

always = ('visionPlusPlus', 'lecturePlusPlus')

for mode in data['modes']:
    name = list(mode)[0]
    settings = mode[name]
    names = [list(setting)[0] for setting in settings]

    if 'readAloud' not in names or 'readAloudDuration' in names:
        continue

    entry = collections.OrderedDict()
    entry['readAloudDuration'] = collections.OrderedDict([
        ('values', 'onDemand,always'),
        ('valueSelected', 1 if name in always else 0),
        ('isTool', False),
        ('order', None),
    ])
    settings.insert(names.index('readAloud') + 1, entry)

data['version'] = '1.0.50'

with open(path, 'w', encoding='utf-8') as handle:
    json.dump(data, handle, ensure_ascii=False, indent='\t')
    handle.write('\n')

print('modes', [(list(m)[0], [list(s)[0] for s in m[list(m)[0]] if list(s)[0] == 'readAloudDuration']) for m in data['modes']])

# 2. Libelles
messages = {
    'fr': {
        'readAloud_scope_label': 'Étendue :',
        'readAloud_duration_label': 'Durée :',
        'readAloudDuration_onDemand': 'Sur demande (Clic, Entrée)',
        'readAloudDuration_always': 'À chaque fois (Clic, Tabulation)',
    },
    'en': {
        'readAloud_scope_label': 'Scope:',
        'readAloud_duration_label': 'Duration:',
        'readAloudDuration_onDemand': 'On request (Click, Enter)',
        'readAloudDuration_always': 'Every time (Click, Tab)',
    },
    'es': {
        'readAloud_scope_label': 'Alcance:',
        'readAloud_duration_label': 'Duración:',
        'readAloudDuration_onDemand': 'A petición (Clic, Intro)',
        'readAloudDuration_always': 'Cada vez (Clic, Tabulador)',
    },
    'it': {
        'readAloud_scope_label': 'Ambito:',
        'readAloud_duration_label': 'Durata:',
        'readAloudDuration_onDemand': 'Su richiesta (Clic, Invio)',
        'readAloudDuration_always': 'Ogni volta (Clic, Tab)',
    },
    'pl': {
        'readAloud_scope_label': 'Zakres:',
        'readAloud_duration_label': 'Czas trwania:',
        'readAloudDuration_onDemand': 'Na żądanie (Kliknięcie, Enter)',
        'readAloudDuration_always': 'Za każdym razem (Kliknięcie, Tab)',
    },
}

for locale, entries in messages.items():
    file = f'/app/confort-src/src/_locales/{locale}/messages.json'
    with open(file, encoding='utf-8') as handle:
        content = json.load(handle, object_pairs_hook=collections.OrderedDict)

    for key, value in entries.items():
        content[key] = collections.OrderedDict([('message', value)])

    with open(file, 'w', encoding='utf-8') as handle:
        json.dump(content, handle, ensure_ascii=False, indent='\t')
        handle.write('\n')

    print(locale, 'ok')
