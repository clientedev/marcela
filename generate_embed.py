import json

# Read the data
with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Clean the data to remove junk records (header rows that got included)
clean_data = []
for r in data:
    # Skip records that have header values as data
    if r.get('genero', '') in ['Qual é o seu gênero?', 'Qual o seu sexo?', '']:
        if r.get('nome', '') == '' or r.get('idade', '') == '':
            continue
    if r.get('curso', '') == 'Curso' or r.get('regiao', '') == 'Região':
        continue
    clean_data.append(r)

print(f"Clean records: {len(clean_data)} (from {len(data)})")

# Write the JS data file
js_data = json.dumps(clean_data, ensure_ascii=False)

with open('data_embed.js', 'w', encoding='utf-8') as f:
    f.write(f'const RAW_DATA = {js_data};\n')

print(f"Written data_embed.js ({len(js_data)} chars)")
