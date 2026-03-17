import csv
import json
import urllib.request
import io

url = "https://docs.google.com/spreadsheets/d/1WTxdX8v0DLfWKaZn8K1-sYB00KLqonBeetkXXnv4X5I/export?format=csv&gid=0"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, timeout=30)
content = response.read().decode('utf-8')
reader = csv.DictReader(io.StringIO(content))
rows = list(reader)

# Extract relevant fields
data = []
for row in rows:
    # Find relevant columns by checking partial matches
    record = {}
    for key, value in row.items():
        if not value or value.strip() == '':
            continue
        # Skip "Pontos" and "Comentários" columns  
        k = key.strip()
        if k.startswith('Pontos') or k.startswith('Comentários'):
            continue
        record[k] = value.strip()
    data.append(record)

# Print column names (non-Pontos, non-Comentários)
all_keys = set()
for d in data:
    all_keys.update(d.keys())

print("=== Relevant Column Names ===")
for k in sorted(all_keys):
    if not k.startswith('Pontos') and not k.startswith('Comentários'):
        print(f"  {k}")

print(f"\n=== Total Records: {len(data)} ===")

# Print first 3 records as sample
for i, d in enumerate(data[:3]):
    print(f"\n--- Record {i+1} ---")
    for k, v in d.items():
        print(f"  {k}: {v[:80] if len(v) > 80 else v}")

# Export normalized data
normalized = []
for row in data:
    r = {}
    # Map to consistent field names
    def get_by_pattern(patterns):
        for p in patterns:
            p_lower = p.lower()
            for k in row.keys():
                if p_lower in k.lower():
                    val = row.get(k, '')
                    if val and val.strip() and not val.startswith('#ERROR'):
                        return val.strip()
        return ''

    r['id'] = row.get('ID', '')
    r['horaInicio'] = row.get('Hora de início', '')
    r['horaConclusao'] = row.get('Hora de conclusão', '')
    r['nome'] = get_by_pattern(['Nome do Aluno'])
    r['idade'] = get_by_pattern(['Idade'])
    r['curso'] = get_by_pattern(['Curso'])
    r['estadoCivil'] = get_by_pattern(['Estado civil'])
    r['filhos'] = get_by_pattern(['Você tem filhos?'])
    r['genero'] = get_by_pattern(['Qual é o seu gênero', 'Qual o seu gênero', 'Qual o seu sexo?'])
    r['bairro'] = get_by_pattern(['Em qual bairro', 'Onde você mora'])
    r['regiao'] = row.get('Região', '')
    r['periodo'] = get_by_pattern(['Período de aula'])
    r['escolaridade'] = get_by_pattern(['situação escolar atual', 'situação atual de escolaridade'])
    r['horarioEstudo'] = get_by_pattern(['horário você realiza', 'horário você costuma estudar'])
    r['trabalha'] = get_by_pattern(['atualmente você trabalha', 'você é aprendiz, estagiário'])
    r['motivosCurso'] = get_by_pattern(['principais motivos'])
    r['alimentacao'] = get_by_pattern(['relação a alimentação', 'alimentação no campus'])
    r['totalPontos'] = row.get('Total de pontos', '')
    r['rendaFamiliar'] = get_by_pattern(['Renda Familiar total'])
    r['residencia'] = get_by_pattern(['Sua residência é'])
    r['situacaoFinanceira'] = get_by_pattern(['situação financeira da sua família'])
    r['atividadeEsportiva'] = get_by_pattern(['atividade esportiva'])
    r['tipoEscola'] = get_by_pattern(['tipo de escola'])
    r['tempoDeslocamento'] = get_by_pattern(['tempo aproximado do seu deslocamento'])
    r['tipoConducao'] = get_by_pattern(['tipo de condução'])
    r['programaSocial'] = get_by_pattern(['participa de algum programa social'])
    r['pessoasResidencia'] = get_by_pattern(['quantas pessoas residem na sua casa'])
    r['religiao'] = get_by_pattern(['Qual a sua religião ou culto'])
    # Semester calculation
    # Semester Atual: 2026/1
    # Semester Anterior: 2025/2, 2025/1 or 2024
    # Since current date is March 2026, let's group by YYYY-S
    conclusao = r['horaConclusao']
    if conclusao and '/' in conclusao:
        parts = conclusao.split(' ')[0].split('/')
        if len(parts) == 3:
            # Handle MM/DD/YY or DD/MM/YY - based on sample it looks like M/D/Y
            m = int(parts[0])
            y = int(parts[2])
            if y < 2000: y += 2000
            s = 1 if m <= 6 else 2
            r['semestre'] = f"{y}-{s}"
        else:
            r['semestre'] = 'Desconhecido'
    else:
        r['semestre'] = 'Desconhecido'
    
    normalized.append(r)

# Filter out empty records or records with clearly junk names
normalized = [r for r in normalized if r.get('nome') and len(r['nome']) > 2 and r['nome'] != 'Nome do Aluno']

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(normalized, f, ensure_ascii=False, indent=2)

print(f"\n=== Exported {len(normalized)} records to data.json ===")

# Print stats
semestres = {}
for r in normalized:
    s = r.get('semestre', 'N/I')
    semestres[s] = semestres.get(s, 0) + 1
print(f"Semesters: {semestres}")
