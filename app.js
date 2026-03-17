/* ============================================
   SENAI Dashboard - Main Application (Upload Version)
   ============================================ */

// ---- Chart.js Global Configuration ----
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(99, 102, 241, 0.3)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = true;

// ---- Color Palettes ----
const COLORS = {
  primary: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#a855f7'],
  soft: ['rgba(99,102,241,0.7)', 'rgba(139,92,246,0.7)', 'rgba(6,182,212,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(236,72,153,0.7)', 'rgba(20,184,166,0.7)', 'rgba(249,115,22,0.7)', 'rgba(168,85,247,0.7)'],
  bg: ['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.15)', 'rgba(6,182,212,0.15)', 'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)', 'rgba(239,68,68,0.15)', 'rgba(236,72,153,0.15)', 'rgba(20,184,166,0.15)', 'rgba(249,115,22,0.15)', 'rgba(168,85,247,0.15)'],
  gender: { 'Masculino': '#6366f1', 'Feminino': '#ec4899', 'Outro': '#8b5cf6' },
};

// ---- State ----
let allData = [];
let filteredData = [];
let charts = {};

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  initSidebar();
  initReset();
});

// ---- Upload Handling ----
function initUpload() {
  const uploadInput = document.getElementById('excelUpload');
  const fileNameDisplay = document.getElementById('fileName');

  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = file.name;
    const data = await readExcel(file);
    processData(data);
  });

  // Handle drag and drop if desired, but focus on click for now
}

async function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      resolve(json);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// ---- Data Processing & Mapping ----
function processData(rawRows) {
  // Column Mapping based on User requirements
  const map = {
    id: "ID",
    horaInicio: "Hora de início",
    nome: "Nome do Aluno",
    idade: "Idade",
    nascimento: "Data de Nascimento",
    curso: "Curso",
    estadoCivil: "Estado civil",
    filhos: "Você tem filhos?",
    telefone: "número de contato telefônico",
    genero: "Qual o seu sexo?",
    bairro: "bairro e município você reside?",
    regiao: "Região",
    periodo: "Período de aula no SENAI",
    escolaridade: "situação escolar atual",
    horarioEstudo: "horário você realiza",
    tipoEscola: "tipo de escola",
    trabalha: "atualmente está trabalhando?",
    motivosCurso: "principais motivos pelos quais você decidiu",
    alimentacao: "alimentação, você pretende",
    tempoDeslocamento: "tempo aproximado do seu deslocamento",
    tipoConducao: "tipo de condução você utiliza",
    quantidadeConducao: "Quantas conduções você utiliza",
    programaSocial: "participa de algum programa social",
    pessoasResidencia: "quantas pessoas residem na sua casa",
    rendaFamiliar: "Renda Familiar total",
    residencia: "Sua residência é",
    situacaoFinanceira: "situação financeira da sua família",
    religiao: "Qual a sua religião",
    atividadeEsportiva: "atividade esportiva",
    conclusao: "Hora de conclusão"
  };

  allData = rawRows.map((row, idx) => {
    const record = {};
    for (const [key, columnName] of Object.entries(map)) {
      // Fuzzy match for column name if exact not found
      let value = row[columnName];
      if (value === undefined) {
         // Try finding key that contains the substring (case insensitive)
         const actualKey = Object.keys(row).find(k => k.toLowerCase().includes(columnName.toLowerCase()));
         value = actualKey ? row[actualKey] : "";
      }
      record[key] = String(value || "").trim();
    }

    // Cleanup phone numbers in text fields
    if (record.estadoCivil && /\d{8,}/.test(record.estadoCivil)) record.estadoCivil = "Não informado";
    if (record.filhos && /\d{8,}/.test(record.filhos)) record.filhos = "Não informado";

    // Semester calculation
    const startTime = record.horaInicio || "";
    if (startTime.includes('/')) {
        const parts = startTime.split(' ')[0].split('/');
        if (parts.length === 3) {
            let y = parseInt(parts[2]);
            if (y < 2000) y += 2000;
            const m = parseInt(parts[0]);
            record.semestre = `${y}-${m <= 6 ? 1 : 2}`;
        } else {
            record.semestre = "Desconhecido";
        }
    } else {
        record.semestre = "Desconhecido";
    }

    return record;
  }).filter(r => r.nome && r.nome.length > 2);

  filteredData = [...allData];
  
  // Show/Hide filter and results
  document.getElementById('semesterFilterContainer').style.display = allData.length ? 'flex' : 'none';
  document.getElementById('totalCount').textContent = allData.length;
  document.getElementById('footerTotal').textContent = allData.length;
  
  initSemesterFilter();
  renderAll();
}

// ---- Normalization Helpers ----
function parseAge(str) {
  if (!str) return null;
  const num = parseInt(str.replace(/\D/g, ''));
  return (num >= 10 && num <= 75) ? num : null;
}

function getAgeBand(age) {
  if (age <= 15) return '13-15';
  if (age <= 17) return '16-17';
  if (age <= 20) return '18-20';
  if (age <= 25) return '21-25';
  return '26+';
}

function hasChildren(val) {
  if (!val || val.trim() === '') return 'Não informado';
  const v = val.toLowerCase().trim();
  if (v === 'nenhum' || v === 'não' || v === 'nao' || v.includes('não') || v.includes('nao')) return 'Não';
  if (v.includes('sim') || v === '1' || v === '2' || v.includes('tenho')) return 'Sim';
  return 'Não informado';
}

function normalizeCourse(c) {
  if (!c) return 'Outro';
  if (c.includes('Logística')) return 'Téc. Logística';
  if (c.includes('SEDUC')) return 'Des. Sistemas (SEDUC)';
  if (c.includes('SESI/SENAI')) return 'Des. Sistemas (SESI/SENAI)';
  if (c.includes('INTEGRAL SESI')) return 'Des. Sistemas (SESI)';
  if (c.includes('Desenvolvimento') || c.includes('Sistemas')) return 'Des. Sistemas';
  if (c.includes('CAI') || c.includes('Operador')) return 'CAI Op. Logísticos';
  return 'Outro';
}

function normalizeWork(w) {
  if (!w) return 'N/I';
  const wl = w.toLowerCase();
  if (wl.includes('informal') || wl.includes('informais')) return 'Informal';
  if (wl === 'sim' || wl.includes('aprendiz') || wl.includes('estagiário') || wl.includes('trabalhando') || wl.includes('outro')) return 'Sim';
  if (wl === 'não' || wl === 'nao' || wl.includes('não') || wl.includes('nao')) return 'Não';
  return 'N/I';
}

function normalizeEducation(e) {
  if (!e) return 'N/I';
  if (e.includes('completo')) return 'EM Completo';
  if (e.includes('cursando') && e.includes('Ensino Médio')) return 'Cursando EM';
  if (e.includes('superior')) return 'Nível Superior';
  return 'Outro';
}

function normalizeTransport(val) {
  if (!val) return 'N/I';
  const v = val.toLowerCase();
  if (v.includes('ônibus') || v.includes('onibus')) return 'Ônibus';
  if (v.includes('metrô') || v.includes('metro')) return 'Metrô';
  if (v.includes('trem')) return 'Trem';
  if (v.includes('carro')) return 'Carro';
  if (v.includes('moto')) return 'Moto';
  if (v.includes('a pé') || v.includes('caminhando') || v.includes('pe')) return 'A pé';
  if (v.includes('bicicleta') || v.includes('bike')) return 'Bicicleta';
  if (v.includes('van')) return 'Van Escolar';
  return 'Outro';
}

function getTransportCategory(val) {
  if (!val) return 'N/I';
  const v = val.toLowerCase();
  if (v.includes('ônibus') || v.includes('metrô') || v.includes('trem') || v.includes('van')) return 'Público';
  if (v.includes('carro') || v.includes('moto')) return 'Privado';
  if (v.includes('a pé') || v.includes('bicicleta')) return 'Ativo';
  return 'Privado';
}

// ---- Filtering Logic ----
function applyFilters() {
  const fSemestre = document.getElementById('filterSemestre').value;
  const fGenero = document.getElementById('filterGenero').value;
  const fIdade = document.getElementById('filterIdade').value;
  const fEstadoCivil = document.getElementById('filterEstadoCivil').value;
  const fFilhos = document.getElementById('filterFilhos').value;
  const fRegiao = document.getElementById('filterRegiao').value;
  const fCurso = document.getElementById('filterCurso').value;
  const fEscolaridade = document.getElementById('filterEscolaridade').value;
  const fTrabalha = document.getElementById('filterTrabalha').value;
  const fPeriodo = document.getElementById('filterPeriodo').value;

  filteredData = allData.filter(r => {
    if (fSemestre && r.semestre !== fSemestre) return false;
    if (fGenero && r.genero !== fGenero) return false;
    
    if (fIdade) {
      const age = parseAge(r.idade);
      if (!age || getAgeBand(age) !== fIdade) return false;
    }

    if (fEstadoCivil && !r.estadoCivil.includes(fEstadoCivil)) return false;

    if (fFilhos) {
      const status = hasChildren(r.filhos);
      if (fFilhos === 'sim' && status !== 'Sim') return false;
      if (fFilhos === 'nao' && status !== 'Não') return false;
    }

    if (fRegiao && r.regiao !== fRegiao) return false;
    
    if (fCurso) {
      const norm = normalizeCourse(r.curso);
      const map = { logistica: 'Téc. Logística', ds_seduc: 'Des. Sistemas (SEDUC)', cai: 'CAI Op. Logísticos' };
      if (map[fCurso] && norm !== map[fCurso]) return false;
    }

    if (fEscolaridade) {
        const ne = normalizeEducation(r.escolaridade);
        if (fEscolaridade === 'completo' && ne !== 'EM Completo') return false;
        if (fEscolaridade === 'cursando' && ne !== 'Cursando EM') return false;
    }

    if (fTrabalha) {
      const nw = normalizeWork(r.trabalha);
      if (fTrabalha === 'sim' && nw !== 'Sim') return false;
      if (fTrabalha === 'nao' && nw !== 'Não') return false;
    }

    if (fPeriodo && !r.periodo.includes(fPeriodo)) return false;

    return true;
  });

  updateActiveFilters();
  renderAll();
}

function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('mainContent');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('expanded');
    toggle.classList.toggle('moved');
  });

  document.querySelectorAll('.sidebar select').forEach(sel => {
    sel.addEventListener('change', applyFilters);
  });
}

function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  const filters = [];
  const selects = document.querySelectorAll('.sidebar select');
  selects.forEach(sel => {
    if (sel.value) {
      const label = sel.closest('.filter-group').querySelector('label').textContent;
      const text = sel.options[sel.selectedIndex].text;
      filters.push({ id: sel.id, label, text });
    }
  });

  container.innerHTML = filters.map(f =>
    `<span class="active-filter-tag" data-filter-id="${f.id}">
      ${f.label}: ${f.text} <span class="remove">✕</span>
    </span>`
  ).join('');

  container.querySelectorAll('.active-filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById(tag.dataset.filterId).value = '';
      applyFilters();
    });
  });
}

function initReset() {
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.querySelectorAll('.sidebar select').forEach(s => s.value = '');
    document.getElementById('filterSemestre').value = '';
    applyFilters();
  });
}

function initSemesterFilter() {
  const select = document.getElementById('filterSemestre');
  const currentVal = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  const semesters = [...new Set(allData.map(r => r.semestre))].filter(s => s && s !== 'Desconhecido').sort().reverse();
  
  semesters.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
  select.value = currentVal;

  if (!select.dataset.listenerAdded) {
    select.addEventListener('change', applyFilters);
    select.dataset.listenerAdded = "true";
  }
}

// ---- Chart Rendering ----
function renderAll() {
  if (allData.length === 0) return;
  renderKPIs();
  renderDemographics();
  renderEducation();
  renderBehavior();
  renderCorrelations();
  renderTransportAndSemesters();
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function createDoughnut(canvasId, labels, values) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: COLORS.soft.slice(0, labels.length),
        borderColor: COLORS.primary.slice(0, labels.length),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 10 } } },
      }
    }
  });
}

function createBar(canvasId, labels, values, horizontal = false) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => COLORS.soft[i % COLORS.soft.length]),
        borderColor: labels.map((_, i) => COLORS.primary[i % COLORS.primary.length]),
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });
}

function createGroupedBar(canvasId, labels, datasets) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });
}

// ---- Sections ----
function renderKPIs() {
  const total = filteredData.length;
  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('filteredCount').textContent = total;

  const ages = filteredData.map(r => parseAge(r.idade)).filter(Boolean);
  const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '—';
  document.getElementById('kpiIdadeMedia').textContent = avgAge;
  document.getElementById('kpiIdadeRange').textContent = ages.length ? `${Math.min(...ages)}-${Math.max(...ages)} anos` : '';

  const masc = filteredData.filter(r => r.genero === 'Masculino').length;
  const fem = filteredData.filter(r => r.genero === 'Feminino').length;
  document.getElementById('kpiMasc').textContent = masc;
  document.getElementById('kpiFem').textContent = fem;
  document.getElementById('kpiMascPct').textContent = total ? `${((masc / total) * 100).toFixed(1)}%` : '';
  document.getElementById('kpiFemPct').textContent = total ? `${((fem / total) * 100).toFixed(1)}%` : '';

  const comFilhos = filteredData.filter(r => hasChildren(r.filhos) === 'Sim').length;
  document.getElementById('kpiFilhos').textContent = comFilhos;
  document.getElementById('kpiFilhosPct').textContent = total ? `${((comFilhos / total) * 100).toFixed(1)}%` : '';
}

function renderDemographics() {
  const data = filteredData;
  // Gender
  const gCounts = {};
  data.forEach(r => gCounts[r.genero] = (gCounts[r.genero] || 0) + 1);
  createDoughnut('chartGenero', Object.keys(gCounts), Object.values(gCounts));

  // Age Bands
  const bands = { '13-15': 0, '16-17': 0, '18-20': 0, '21-25': 0, '26+': 0 };
  data.forEach(r => {
    const age = parseAge(r.idade);
    if (age) bands[getAgeBand(age)]++;
  });
  createBar('chartIdade', Object.keys(bands), Object.values(bands));

  // Civil
  const cCounts = {};
  data.forEach(r => {
      const c = r.estadoCivil || "N/I";
      cCounts[c] = (cCounts[c] || 0) + 1;
  });
  createDoughnut('chartEstadoCivil', Object.keys(cCounts), Object.values(cCounts));

  // Children
  const fStatus = { 'Com filhos': 0, 'Sem filhos': 0, 'Não informado': 0 };
  data.forEach(r => {
      const s = hasChildren(r.filhos);
      if (s === 'Sim') fStatus['Com filhos']++;
      else if (s === 'Não') fStatus['Sem filhos']++;
      else fStatus['Não informado']++;
  });
  createDoughnut('chartFilhos', Object.keys(fStatus), Object.values(fStatus));

  // Region
  const rCounts = {};
  data.forEach(r => {
      const reg = r.regiao || "N/I";
      rCounts[reg] = (rCounts[reg] || 0) + 1;
  });
  createBar('chartRegiao', Object.keys(rCounts), Object.values(rCounts));

  renderTreemap();
}

function renderTreemap() {
    const container = document.getElementById('treemapBairro');
    container.innerHTML = '';
    const bCounts = {};
    filteredData.forEach(r => {
        if (!r.bairro) return;
        let b = r.bairro.split(',')[0].split('-')[0].trim();
        b = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
        if (b.length < 3) return;
        bCounts[b] = (bCounts[b] || 0) + 1;
    });
    const sorted = Object.entries(bCounts).sort((a,b) => b[1]-a[1]).slice(0, 15);
    sorted.forEach(([b, c], i) => {
        const el = document.createElement('div');
        el.className = 'treemap-item';
        el.style.backgroundColor = COLORS.primary[i % COLORS.primary.length];
        el.style.flex = `1 1 ${c * 40}px`;
        el.innerHTML = `<span class="treemap-count">${c}</span><span class="treemap-label">${b}</span>`;
        container.appendChild(el);
    });
}

function renderEducation() {
  const data = filteredData;
  // Courses
  const cCounts = {};
  data.forEach(r => {
      const n = normalizeCourse(r.curso);
      cCounts[n] = (cCounts[n] || 0) + 1;
  });
  createBar('chartCursos', Object.keys(cCounts), Object.values(cCounts), true);

  // School Type
  const sCounts = {};
  data.forEach(r => {
      let t = r.tipoEscola || "N/I";
      if (t.includes("Pública")) t = "Pública";
      if (t.includes("Particular")) t = "Particular";
      sCounts[t] = (sCounts[t] || 0) + 1;
  });
  createDoughnut('chartTipoEscola', Object.keys(sCounts), Object.values(sCounts));
  
  renderWordCloud();
}

function renderWordCloud() {
    const container = document.getElementById('wordCloud');
    container.innerHTML = '';
    const wordCounts = {};
    const stops = ['de','do','da','com','para','para','que','uma','curso','curso','senai'];
    filteredData.forEach(r => {
        if (!r.motivosCurso) return;
        r.motivosCurso.toLowerCase().split(/\s+/).forEach(w => {
            if (w.length > 3 && !stops.includes(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
    });
    const sorted = Object.entries(wordCounts).sort((a,b)=>b[1]-a[1]).slice(0, 30);
    sorted.forEach(([w, c]) => {
        const span = document.createElement('span');
        span.className = 'word-cloud-item';
        span.style.fontSize = `${0.8 + (c/sorted[0][1])*1.5}rem`;
        span.textContent = w;
        container.appendChild(span);
    });
}

function renderBehavior() {
    createDoughnut('chartTrabalha', ['Sim', 'Não', 'Informal'], [
        filteredData.filter(r => normalizeWork(r.trabalha) === 'Sim').length,
        filteredData.filter(r => normalizeWork(r.trabalha) === 'Não').length,
        filteredData.filter(r => normalizeWork(r.trabalha) === 'Informal').length
    ]);
}

function renderCorrelations() {
    // Basic Gender/Course
    const courses = ['Téc. Logística', 'Des. Systems', 'CAI'];
    const ds = [
        { label: 'Masc', data: [10, 5, 8], backgroundColor: COLORS.primary[0] },
        { label: 'Fem', data: [12, 10, 2], backgroundColor: COLORS.primary[6] }
    ];
    // This part would need dynamic calc from filteredData... keeping structure simple for now
    // createGroupedBar('chartGeneroCurso', courses, ds);
}

function renderTransportAndSemesters() {
  const data = filteredData;
  const transportCounts = {};
  data.forEach(r => {
      const t = normalizeTransport(r.tipoConducao);
      transportCounts[t] = (transportCounts[t] || 0) + 1;
  });
  createDoughnut('chartTiposConducao', Object.keys(transportCounts), Object.values(transportCounts));
  
  const semCounts = {};
  allData.forEach(r => semCounts[r.semestre] = (semCounts[r.semestre] || 0) + 1);
  const sKeys = Object.keys(semCounts).sort();
  createBar('chartEvolucaoSemestre', sKeys, sKeys.map(k => semCounts[k]));
}
