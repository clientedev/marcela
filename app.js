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
      let value = row[columnName];
      if (value === undefined) {
         const actualKey = Object.keys(row).find(k => k.toLowerCase().includes(columnName.toLowerCase()));
         value = actualKey ? row[actualKey] : "";
      }
      record[key] = String(value || "").trim();
    }

    // STRICT CLEANUP
    if (record.estadoCivil && /\d{8,}/.test(record.estadoCivil)) record.estadoCivil = "Não informado";
    if (record.filhos && /\d{8,}/.test(record.filhos)) record.filhos = "Não informado";

    // Semester calculation
    const startTime = record.horaInicio || "";
    if (startTime.includes('/')) {
        const parts = startTime.split(' ')[0].split('/');
        if (parts.length === 3) {
            let y = parseInt(parts[2]);
            if (y < 2000) y += 2000;
            const m = parseInt(parts[1]); // Fixed month index (MM/DD or DD/MM - assuming MM/DD for Semester)
            record.semestre = `${y}-${m <= 6 ? 1 : 2}`;
        } else record.semestre = "Desconhecido";
    } else record.semestre = "Desconhecido";

    return record;
  }).filter(r => r.nome && r.nome.length > 2);

  filteredData = [...allData];
  
  document.getElementById('semesterFilterContainer').style.display = allData.length ? 'flex' : 'none';
  document.getElementById('totalCount').textContent = allData.length;
  document.getElementById('footerTotal').textContent = allData.length;
  
  initSemesterFilter();
  renderAll();
}

// ---- Normalization Helpers (STRICT) ----
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
  if (!val) return 'Não';
  const v = val.toLowerCase().trim();
  if (v === 'sim' || v === '1' || v.includes('tenho') || v === 'yes') return 'Sim';
  return 'Não';
}

function normalizeCourse(c) {
  if (!c) return 'Outro';
  if (c.includes('Logística')) return 'Téc. Logística';
  if (c.includes('Desenvolvimento') || c.includes('Sistemas')) return 'Des. Sistemas';
  if (c.includes('CAI')) return 'CAI';
  return 'Outro';
}

function normalizeWork(w) {
  if (!w) return 'Não';
  const wl = w.toLowerCase();
  if (wl === 'sim' || wl.includes('estágio') || wl.includes('aprendiz') || wl.includes('trabalhando')) return 'Sim';
  return 'Não';
}

function normalizeEducation(e) {
  if (!e) return 'N/I';
  if (e.includes('completo')) return 'EM Completo';
  if (e.includes('cursando')) return 'Cursando EM';
  if (e.includes('superior')) return 'Superior';
  return 'Outro';
}

function normalizeTransport(val) {
  if (!val) return 'Outro';
  const v = val.toLowerCase();
  if (v.includes('ônibus') || v.includes('onibus') || v.includes('metrô') || v.includes('metro') || v.includes('trem')) return 'Público';
  if (v.includes('carro') || v.includes('moto')) return 'Privado';
  if (v.includes('pé') || v.includes('bicicleta') || v.includes('bike')) return 'Ativo';
  return 'Outro';
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
      const status = hasChildren(r.filhos).toLowerCase();
      if (fFilhos !== status) return false;
    }
    if (fRegiao && r.regiao !== fRegiao) return false;
    if (fCurso) {
      const norm = normalizeCourse(r.curso).toLowerCase();
      if (!norm.includes(fCurso)) return false;
    }
    if (fEscolaridade) {
        const ne = normalizeEducation(r.escolaridade);
        if (fEscolaridade === 'completo' && ne !== 'EM Completo') return false;
        if (fEscolaridade === 'cursando' && ne !== 'Cursando EM') return false;
    }
    if (fTrabalha) {
      const nw = normalizeWork(r.trabalha).toLowerCase();
      if (fTrabalha !== nw) return false;
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
  document.querySelectorAll('.sidebar select').forEach(sel => {
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

// ---- Chart Rendering (Simplified) ----
function renderAll() {
  if (allData.length === 0) return;
  renderKPIs();
  renderSection1();
  renderSection2();
  renderSection3();
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
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
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
        backgroundColor: COLORS.soft[0],
        borderColor: COLORS.primary[0],
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 9 } } },
        x: { ticks: { font: { size: 9 } } }
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

  const masc = filteredData.filter(r => r.genero === 'Masculino').length;
  const fem = filteredData.filter(r => r.genero === 'Feminino').length;
  document.getElementById('kpiMascPct').textContent = total ? `${((masc / total) * 100).toFixed(0)}%` : '0%';
  document.getElementById('kpiFemPct').textContent = total ? `${((fem / total) * 100).toFixed(0)}%` : '0%';

  const trabalha = filteredData.filter(r => normalizeWork(r.trabalha) === 'Sim').length;
  document.getElementById('kpiTrabPct').textContent = total ? `${((trabalha / total) * 100).toFixed(0)}%` : '0%';

  const filhos = filteredData.filter(r => hasChildren(r.filhos) === 'Sim').length;
  document.getElementById('kpiFilhosPct').textContent = total ? `${((filhos / total) * 100).toFixed(0)}%` : '0%';
}

function renderSection1() {
  const data = filteredData;
  const gCounts = { 'Masculino': 0, 'Feminino': 0, 'Outro': 0 };
  data.forEach(r => gCounts[r.genero] = (gCounts[r.genero] || 0) + 1);
  createDoughnut('chartGenero', Object.keys(gCounts), Object.values(gCounts));

  const ageBands = { '13-15': 0, '16-17': 0, '18-20': 0, '21-25': 0, '26+': 0 };
  data.forEach(r => { const a = parseAge(r.idade); if(a) ageBands[getAgeBand(a)]++; });
  createBar('chartIdade', Object.keys(ageBands), Object.values(ageBands));

  const ecCounts = {};
  data.forEach(r => { const ec = r.estadoCivil || 'N/I'; ecCounts[ec] = (ecCounts[ec] || 0) + 1; });
  createDoughnut('chartEstadoCivil', Object.keys(ecCounts), Object.values(ecCounts));

  const courseCounts = {};
  data.forEach(r => { const c = normalizeCourse(r.curso); courseCounts[c] = (courseCounts[c] || 0) + 1; });
  createBar('chartCursos', Object.keys(courseCounts), Object.values(courseCounts), true);

  const edCounts = {};
  data.forEach(r => { const ed = normalizeEducation(r.escolaridade); edCounts[ed] = (edCounts[ed] || 0) + 1; });
  createDoughnut('chartEscolaridade', Object.keys(edCounts), Object.values(edCounts));
}

function renderSection2() {
  const data = filteredData;
  const transCounts = { 'Público': 0, 'Privado': 0, 'Ativo': 0, 'Outro': 0 };
  data.forEach(r => transCounts[normalizeTransport(r.tipoConducao)]++);
  createDoughnut('chartTiposConducao', Object.keys(transCounts), Object.values(transCounts));

  const timeCounts = {};
  data.forEach(r => { const t = r.tempoDeslocamento || 'N/I'; timeCounts[t] = (timeCounts[t] || 0) + 1; });
  createBar('chartDeslocamento', Object.keys(timeCounts), Object.values(timeCounts));

  const perCounts = {};
  data.forEach(r => { const p = r.periodo || 'N/I'; perCounts[p] = (perCounts[p] || 0) + 1; });
  createDoughnut('chartPeriodo', Object.keys(perCounts), Object.values(perCounts));

  const workCounts = { 'Trabalha': 0, 'Não Trabalha': 0 };
  data.forEach(r => normalizeWork(r.trabalha) === 'Sim' ? workCounts['Trabalha']++ : workCounts['Não Trabalha']++);
  createDoughnut('chartTrabalha', Object.keys(workCounts), Object.values(workCounts));

  const schoolType = {};
  data.forEach(r => { const t = r.tipoEscola || 'N/I'; schoolType[t] = (schoolType[t] || 0) + 1; });
  createBar('chartTipoEscola', Object.keys(schoolType), Object.values(schoolType), true);
}

function renderSection3() {
  const data = filteredData;
  const childCounts = { 'Sim': 0, 'Não': 0 };
  data.forEach(r => hasChildren(r.filhos) === 'Sim' ? childCounts['Sim']++ : childCounts['Não']++);
  createDoughnut('chartFilhos', Object.keys(childCounts), Object.values(childCounts));

  const incomeCounts = {};
  data.forEach(r => { const i = r.rendaFamiliar || 'N/I'; incomeCounts[i] = (incomeCounts[i] || 0) + 1; });
  createBar('chartRenda', Object.keys(incomeCounts), Object.values(incomeCounts), true);

  const finCounts = {};
  data.forEach(r => { const f = r.situacaoFinanceira || 'N/I'; finCounts[f] = (finCounts[f] || 0) + 1; });
  createBar('chartFinanceira', Object.keys(finCounts), Object.values(finCounts));

  const regCounts = {};
  data.forEach(r => { const reg = r.regiao || 'N/I'; regCounts[reg] = (regCounts[reg] || 0) + 1; });
  createBar('chartRegiao', Object.keys(regCounts), Object.values(regCounts));

  const resCounts = {};
  data.forEach(r => { const res = r.residencia || 'N/I'; resCounts[res] = (resCounts[res] || 0) + 1; });
  createDoughnut('chartResidencia', Object.keys(resCounts), Object.values(resCounts));

  const relCounts = {};
  data.forEach(r => { const rel = r.religiao || 'N/I'; relCounts[rel] = (relCounts[rel] || 0) + 1; });
  createBar('chartReligiao', Object.keys(relCounts), Object.values(relCounts), true);
}
