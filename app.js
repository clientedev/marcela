/* ============================================
   SENAI Dashboard - Main Application
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

// ---- Helpers ----
function parseAge(str) {
  if (!str) return null;
  const num = parseInt(str.replace(/\D/g, ''));
  return (num >= 10 && num <= 70) ? num : null;
}

function getAgeBand(age) {
  if (age <= 15) return '13-15';
  if (age <= 17) return '16-17';
  if (age <= 20) return '18-20';
  if (age <= 25) return '21-25';
  return '26+';
}

function hasChildren(val) {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v !== 'nenhum' && v !== 'não' && v !== 'nao' && v !== '';
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

function matchesCourseFilter(curso, filterValue) {
  if (!filterValue) return true;
  const n = normalizeCourse(curso);
  const map = {
    'logistica': 'Téc. Logística',
    'ds_seduc': 'Des. Sistemas (SEDUC)',
    'ds_sesi_senai': 'Des. Sistemas (SESI/SENAI)',
    'ds_sesi': 'Des. Sistemas (SESI)',
    'ds_regular': 'Des. Sistemas',
    'cai': 'CAI Op. Logísticos'
  };
  return n === map[filterValue];
}

function normalizeWork(w) {
  if (!w) return 'N/I';
  const wl = w.toLowerCase();
  if (wl.includes('informal') || wl.includes('informais')) return 'Informal';
  if (wl === 'sim' || wl.includes('aprendiz') || wl.includes('estagiário') || wl.includes('outro')) return 'Sim';
  if (wl === 'não' || wl === 'nao') return 'Não';
  if (wl.includes('não') || wl.includes('nao')) return 'Não';
  return 'N/I';
}

function normalizeEducation(e) {
  if (!e) return 'N/I';
  if (e.includes('completo')) return 'EM Completo';
  if (e.includes('1º ano')) return 'Cursando 1º EM';
  if (e.includes('2º ano')) return 'Cursando 2º EM';
  if (e.includes('3º ano')) return 'Cursando 3º EM';
  if (e.includes('superior')) return 'Nível Superior';
  if (e.includes('conclu')) return 'Concluiu';
  return 'Outro';
}

function normalizeFood(a) {
  if (!a) return [];
  const items = [];
  if (a.includes('própria refeição') || a.includes('almoço ou jantar')) items.push('Trazer refeição');
  if (a.includes('lanches') && a.includes('casa')) items.push('Lanches de casa');
  if (a.includes('cantina') || a.includes('produtos da cantina')) items.push('Cantina');
  if (a.includes('comércio fora')) items.push('Comércio externo');
  if (items.length === 0 && a.trim()) items.push('Outro');
  return items;
}

function normalizeRenda(r) {
  if (!r) return 'N/I';
  if (r.includes('Menos de R$2') || r.includes('Menos de R$3')) return '< R$3k';
  if (r.includes('2.000') && r.includes('4.000')) return 'R$2k-4k';
  if (r.includes('3.000') && r.includes('5.000')) return 'R$3k-5k';
  if (r.includes('4.000') && r.includes('6.000')) return 'R$4k-6k';
  if (r.includes('6.000') && r.includes('8.000')) return 'R$6k-8k';
  if (r.includes('8.000') && r.includes('10.000')) return 'R$8k-10k';
  if (r.includes('Acima')) return '> R$10k';
  return 'N/I';
}

function normalizeRegion(r) {
  if (!r) return 'N/I';
  if (r === 'Região') return 'N/I';
  return r;
}

function countBy(arr, fn) {
  const counts = {};
  arr.forEach(item => {
    const key = fn(item);
    if (key && key !== 'N/I' && key !== 'Outro') counts[key] = (counts[key] || 0) + 1;
  });
  // Sort by count descending
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function countByMulti(arr, fn) {
  const counts = {};
  arr.forEach(item => {
    const keys = fn(item);
    keys.forEach(key => {
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

// ---- Data Loading ----
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    // Filter out junk records
    allData = data.filter(r => {
      if (r.genero === 'Qual é o seu gênero?' || r.genero === 'Qual o seu sexo?') return false;
      if (r.curso === 'Curso' || r.regiao === 'Região') return false;
      if (!r.nome && !r.idade) return false;
      return true;
    });
    filteredData = [...allData];
    document.getElementById('totalCount').textContent = allData.length;
    document.getElementById('footerTotal').textContent = allData.length;
    renderAll();
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// ---- Filtering ----
function applyFilters() {
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
    // Gender
    if (fGenero && r.genero !== fGenero) return false;

    // Age band
    if (fIdade) {
      const age = parseAge(r.idade);
      if (!age) return false;
      const band = getAgeBand(age);
      if (band !== fIdade) return false;
    }

    // Civil status
    if (fEstadoCivil && r.estadoCivil !== fEstadoCivil) return false;

    // Children
    if (fFilhos) {
      const has = hasChildren(r.filhos);
      if (fFilhos === 'sim' && !has) return false;
      if (fFilhos === 'nao' && has) return false;
    }

    // Region
    if (fRegiao && normalizeRegion(r.regiao) !== fRegiao) return false;

    // Course
    if (fCurso && !matchesCourseFilter(r.curso, fCurso)) return false;

    // Education
    if (fEscolaridade) {
      const ne = normalizeEducation(r.escolaridade);
      if (fEscolaridade === 'completo' && ne !== 'EM Completo' && ne !== 'Concluiu') return false;
      if (fEscolaridade === 'cursando' && !ne.includes('Cursando')) return false;
      if (fEscolaridade === 'superior' && ne !== 'Nível Superior') return false;
    }

    // Work
    if (fTrabalha) {
      const nw = normalizeWork(r.trabalha);
      if (fTrabalha === 'sim' && nw !== 'Sim') return false;
      if (fTrabalha === 'nao' && nw !== 'Não') return false;
      if (fTrabalha === 'informal' && nw !== 'Informal') return false;
    }

    // Period
    if (fPeriodo) {
      if (!r.periodo) return false;
      if (fPeriodo === 'Integral' && !r.periodo.includes('Integral')) return false;
      if (fPeriodo === 'Manhã' && r.periodo !== 'Manhã') return false;
      if (fPeriodo === 'Tarde' && r.periodo !== 'Tarde') return false;
    }

    return true;
  });

  updateActiveFilters();
  renderAll();
}

function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  const filters = [];
  const selects = document.querySelectorAll('.filter-group select');
  selects.forEach(sel => {
    if (sel.value) {
      const label = sel.closest('.filter-group').querySelector('label').textContent;
      const text = sel.options[sel.selectedIndex].text;
      filters.push({ id: sel.id, label, text });
    }
  });

  container.innerHTML = filters.map(f =>
    `<span class="active-filter-tag" data-filter-id="${f.id}">
      ${f.label}: ${f.text}
      <span class="remove">✕</span>
    </span>`
  ).join('');

  container.querySelectorAll('.active-filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById(tag.dataset.filterId).value = '';
      applyFilters();
    });
  });
}

function resetFilters() {
  document.querySelectorAll('.filter-group select').forEach(s => s.value = '');
  applyFilters();
}

// ---- Chart Helpers ----
function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function createDoughnut(canvasId, labels, values, title) {
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
        hoverBorderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function createBar(canvasId, labels, values, color, horizontal = false) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const bgColors = labels.map((_, i) => COLORS.soft[i % COLORS.soft.length]);
  const borderColors = labels.map((_, i) => COLORS.primary[i % COLORS.primary.length]);

  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Quantidade',
        data: values,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.raw} alunos (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: !horizontal }, ticks: { font: { size: 10 } } },
        y: { grid: { display: horizontal }, ticks: { font: { size: 10 } }, beginAtZero: true }
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
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } }
      },
      scales: {
        x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
        y: { beginAtZero: true, ticks: { font: { size: 10 } } }
      }
    }
  });
}

// ---- Render KPIs ----
function renderKPIs() {
  const data = filteredData;
  const total = data.length;
  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('filteredCount').textContent = total;

  // Age stats
  const ages = data.map(r => parseAge(r.idade)).filter(Boolean);
  const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '—';
  const minAge = ages.length ? Math.min(...ages) : '—';
  const maxAge = ages.length ? Math.max(...ages) : '—';
  document.getElementById('kpiIdadeMedia').textContent = avgAge;
  document.getElementById('kpiIdadeRange').textContent = ages.length ? `${minAge} – ${maxAge} anos` : '';

  // Gender
  const masc = data.filter(r => r.genero === 'Masculino').length;
  const fem = data.filter(r => r.genero === 'Feminino').length;
  document.getElementById('kpiMasc').textContent = masc;
  document.getElementById('kpiFem').textContent = fem;
  document.getElementById('kpiMascPct').textContent = total ? `${((masc / total) * 100).toFixed(1)}%` : '';
  document.getElementById('kpiFemPct').textContent = total ? `${((fem / total) * 100).toFixed(1)}%` : '';

  // Work
  const trabalham = data.filter(r => {
    const nw = normalizeWork(r.trabalha);
    return nw === 'Sim' || nw === 'Informal';
  }).length;
  document.getElementById('kpiTrabalham').textContent = trabalham;
  document.getElementById('kpiTrabPct').textContent = total ? `${((trabalham / total) * 100).toFixed(1)}%` : '';

  // Children
  const comFilhos = data.filter(r => hasChildren(r.filhos)).length;
  document.getElementById('kpiFilhos').textContent = comFilhos;
  document.getElementById('kpiFilhosPct').textContent = total ? `${((comFilhos / total) * 100).toFixed(1)}%` : '';
}

// ---- Render Demographics ----
function renderDemographics() {
  const data = filteredData;

  // Gender donut
  const genderCounts = countBy(data, r => r.genero || 'N/I');
  const genderLabels = genderCounts.map(e => e[0]);
  const genderValues = genderCounts.map(e => e[1]);
  createDoughnut('chartGenero', genderLabels, genderValues);

  // Age histogram
  const ageBands = { '13-15': 0, '16-17': 0, '18-20': 0, '21-25': 0, '26+': 0 };
  data.forEach(r => {
    const age = parseAge(r.idade);
    if (age) ageBands[getAgeBand(age)]++;
  });
  createBar('chartIdade', Object.keys(ageBands), Object.values(ageBands));

  // Civil status
  const civilCounts = countBy(data, r => r.estadoCivil || 'N/I');
  createDoughnut('chartEstadoCivil', civilCounts.map(e => e[0]), civilCounts.map(e => e[1]));

  // Children
  const childYes = data.filter(r => hasChildren(r.filhos)).length;
  const childNo = data.filter(r => !hasChildren(r.filhos)).length;
  createDoughnut('chartFilhos', ['Sem filhos', 'Com filhos'], [childNo, childYes]);

  // Region
  const regionCounts = countBy(data, r => normalizeRegion(r.regiao));
  createBar('chartRegiao', regionCounts.map(e => e[0]), regionCounts.map(e => e[1]));

  // Treemap
  renderTreemap();
}

function renderTreemap() {
  const container = document.getElementById('treemapBairro');
  container.innerHTML = '';
  
  const bairroCounts = {};
  filteredData.forEach(r => {
    if (!r.bairro) return;
    // Normalize bairro to title case and strip city
    let b = r.bairro.trim();
    // Take just the neighborhood part
    b = b.split(',')[0].split('-')[0].trim();
    b = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
    if (b.length < 3) return;
    bairroCounts[b] = (bairroCounts[b] || 0) + 1;
  });

  const sorted = Object.entries(bairroCounts).sort((a, b) => b[1] - a[1]).slice(0, 25);
  const maxCount = sorted[0] ? sorted[0][1] : 1;
  const totalItems = sorted.reduce((s, e) => s + e[1], 0);

  sorted.forEach(([bairro, count], i) => {
    const pct = Math.max((count / totalItems) * 100, 4);
    const el = document.createElement('div');
    el.className = 'treemap-item';
    const colorIdx = i % COLORS.primary.length;
    el.style.backgroundColor = COLORS.primary[colorIdx];
    el.style.width = `${Math.max(pct * 3, 60)}px`;
    el.style.height = `${Math.max(30 + (count / maxCount) * 50, 40)}px`;
    el.style.flexGrow = count;
    el.innerHTML = `<span class="treemap-count">${count}</span><span class="treemap-label">${bairro}</span>`;
    el.title = `${bairro}: ${count} alunos`;
    container.appendChild(el);
  });
}

// ---- Render Education ----
function renderEducation() {
  const data = filteredData;

  // Courses
  const courseCounts = countBy(data, r => normalizeCourse(r.curso));
  createBar('chartCursos', courseCounts.map(e => e[0]), courseCounts.map(e => e[1]), null, true);

  // Education level
  const eduCounts = countBy(data, r => normalizeEducation(r.escolaridade));
  createDoughnut('chartEscolaridade', eduCounts.map(e => e[0]), eduCounts.map(e => e[1]));

  // Period
  const periodCounts = {};
  data.forEach(r => {
    if (!r.periodo) return;
    let p = r.periodo;
    if (p.includes('Integral')) p = 'Integral';
    periodCounts[p] = (periodCounts[p] || 0) + 1;
  });
  const pSorted = Object.entries(periodCounts).sort((a, b) => b[1] - a[1]);
  createDoughnut('chartPeriodo', pSorted.map(e => e[0]), pSorted.map(e => e[1]));

  // Work status
  const workCounts = countBy(data, r => normalizeWork(r.trabalha));
  createDoughnut('chartTrabalha', workCounts.map(e => e[0]), workCounts.map(e => e[1]));

  // School type
  const schoolCounts = {};
  data.forEach(r => {
    if (!r.tipoEscola) return;
    let s = r.tipoEscola;
    if (s.includes('Pública')) s = 'Pública';
    else if (s.includes('Particular')) s = 'Particular';
    else if (s.includes('Não estou')) s = 'Não estuda';
    else s = 'Outro';
    schoolCounts[s] = (schoolCounts[s] || 0) + 1;
  });
  const sSorted = Object.entries(schoolCounts).sort((a, b) => b[1] - a[1]);
  createDoughnut('chartTipoEscola', sSorted.map(e => e[0]), sSorted.map(e => e[1]));

  // Word cloud
  renderWordCloud();
}

function renderWordCloud() {
  const container = document.getElementById('wordCloud');
  container.innerHTML = '';

  // Extract words from motivosCurso
  const wordCounts = {};
  const stopWords = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em', 'um', 'uma', 'o', 'a', 'os', 'as',
    'para', 'por', 'com', 'no', 'na', 'nos', 'nas', 'que', 'mais', 'eu', 'me', 'meu', 'minha',
    'se', 'ter', 'já', 'muito', 'como', 'também', 'este', 'esse', 'esta', 'essa', 'não', 'nao',
    'é', 'são', 'foi', 'ser', 'ou', 'ao', 'pelo', 'pela', 'pra', 'pro', 'meus', 'minhas',
    'isso', 'mas', 'pois', 'porque', 'quando', 'sobre', 'ele', 'ela', 'eles', 'elas', 'nos',
    'vou', 'vai', 'tem', 'bem', 'sua', 'seu', 'suas', 'seus', 'um', 'uma', 'uns', 'umas',
    'lo', 'la', 'lhe', 'te', 'ti', 'si', 'lá', 'cá', 'aqui', 'ali', 'aí',
    'depois', 'então', 'assim', 'ainda', 'já', 'sempre', 'nunca', 'nada', 'tudo',
    'conseguir', 'poder', 'querer', 'fazer', 'ter', 'sair', 'entrar', 'ir']);

  filteredData.forEach(r => {
    if (!r.motivosCurso) return;
    const words = r.motivosCurso.toLowerCase()
      .replace(/[.,;:!?()"""'']/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    
    words.forEach(w => {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });

  // Also extract bigrams for better context
  filteredData.forEach(r => {
    if (!r.motivosCurso) return;
    const words = r.motivosCurso.toLowerCase()
      .replace(/[.,;:!?()"""'']/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!stopWords.has(words[i]) || !stopWords.has(words[i + 1])) {
        if (bigram.length > 8) {
          wordCounts[bigram] = (wordCounts[bigram] || 0) + 0.8;
        }
      }
    }
  });

  const sorted = Object.entries(wordCounts)
    .filter(e => e[1] >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  if (sorted.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Sem dados suficientes para gerar nuvem de palavras</p>';
    return;
  }

  const maxCount = sorted[0][1];
  const minCount = sorted[sorted.length - 1][1];
  const range = maxCount - minCount || 1;

  sorted.forEach(([word, count], i) => {
    const el = document.createElement('span');
    el.className = 'word-cloud-item';
    const normalized = (count - minCount) / range;
    const fontSize = 0.7 + normalized * 1.8;
    const colorIdx = i % COLORS.primary.length;
    el.style.fontSize = `${fontSize}rem`;
    el.style.color = COLORS.primary[colorIdx];
    el.style.backgroundColor = COLORS.bg[colorIdx];
    el.textContent = word;
    el.title = `"${word}" — ${Math.round(count)} menções`;
    container.appendChild(el);
  });
}

// ---- Render Behavior ----
function renderBehavior() {
  const data = filteredData;

  // Food
  const foodCounts = countByMulti(data, r => normalizeFood(r.alimentacao));
  createBar('chartAlimentacao', foodCounts.map(e => e[0]), foodCounts.map(e => e[1]), null, true);

  // Commute time
  const commuteCounts = {};
  data.forEach(r => {
    if (!r.tempoDeslocamento) return;
    let t = r.tempoDeslocamento;
    if (t.includes('Menos')) t = '< 1 hora';
    else if (t.includes('uma') && t.includes('duas')) t = '1 - 2 horas';
    else if (t.includes('duas') && t.includes('três')) t = '2 - 3 horas';
    else if (t.includes('Mais')) t = '> 3 horas';
    else t = 'Outro';
    commuteCounts[t] = (commuteCounts[t] || 0) + 1;
  });
  const cSorted = Object.entries(commuteCounts).sort((a, b) => b[1] - a[1]).filter(e => e[0] !== 'Outro');
  createDoughnut('chartDeslocamento', cSorted.map(e => e[0]), cSorted.map(e => e[1]));

  // Sports
  const sportCounts = {};
  data.forEach(r => {
    if (!r.atividadeEsportiva) return;
    let s = r.atividadeEsportiva;
    if (s.includes('frequência') || s.includes('02 vezes')) s = 'Com frequência';
    else if (s.includes('final')) s = 'Finais de semana';
    else if (s.includes('Raramente')) s = 'Raramente';
    else s = 'Outro';
    sportCounts[s] = (sportCounts[s] || 0) + 1;
  });
  const spSorted = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]).filter(e => e[0] !== 'Outro');
  createDoughnut('chartEsporte', spSorted.map(e => e[0]), spSorted.map(e => e[1]));

  // Income
  const rendaOrder = ['< R$3k', 'R$2k-4k', 'R$3k-5k', 'R$4k-6k', 'R$6k-8k', 'R$8k-10k', '> R$10k'];
  const rendaCounts = {};
  data.forEach(r => {
    const nr = normalizeRenda(r.rendaFamiliar);
    if (nr !== 'N/I') rendaCounts[nr] = (rendaCounts[nr] || 0) + 1;
  });
  const rendaLabels = rendaOrder.filter(k => rendaCounts[k]);
  const rendaValues = rendaLabels.map(k => rendaCounts[k] || 0);
  createBar('chartRenda', rendaLabels, rendaValues);

  // Residence
  const resCounts = countBy(data, r => r.residencia || 'N/I');
  createDoughnut('chartResidencia', resCounts.map(e => e[0]), resCounts.map(e => e[1]));

  // Financial situation
  const finCounts = {};
  const finOrder = ['Ótima', 'Boa', 'Regular', 'Ruim'];
  data.forEach(r => {
    if (!r.situacaoFinanceira) return;
    let f = r.situacaoFinanceira;
    if (!finOrder.includes(f)) return;
    finCounts[f] = (finCounts[f] || 0) + 1;
  });
  const finLabels = finOrder.filter(k => finCounts[k]);
  const finValues = finLabels.map(k => finCounts[k] || 0);
  createBar('chartFinanceira', finLabels, finValues);

  // Religion
  const relCounts = {};
  data.forEach(r => {
    if (!r.religiao) return;
    let rel = r.religiao;
    if (rel.includes('Católica')) rel = 'Católica';
    else if (rel.includes('Evangélica') || rel.includes('Protestante')) rel = 'Evangélica';
    else if (rel.includes('Espírita')) rel = 'Espírita';
    else if (rel.includes('Afro') || rel.includes('Umbanda') || rel.includes('Candomblé')) rel = 'Afro-brasileira';
    else if (rel.includes('Não tenho') || rel.includes('não tenho')) rel = 'Sem religião';
    else if (rel.includes('Prefiro') || rel.includes('prefiro')) rel = 'Prefere não dizer';
    else rel = 'Outra';
    relCounts[rel] = (relCounts[rel] || 0) + 1;
  });
  const relSorted = Object.entries(relCounts).sort((a, b) => b[1] - a[1]);
  createDoughnut('chartReligiao', relSorted.map(e => e[0]), relSorted.map(e => e[1]));
}

// ---- Render Correlations ----
function renderCorrelations() {
  const data = filteredData;

  // Gender by Course (grouped bar)
  const courses = [...new Set(data.map(r => normalizeCourse(r.curso)).filter(c => c !== 'Outro'))];
  const genderByCourse = {};
  courses.forEach(c => genderByCourse[c] = { Masculino: 0, Feminino: 0 });
  data.forEach(r => {
    const c = normalizeCourse(r.curso);
    if (!genderByCourse[c]) return;
    const g = r.genero;
    if (g === 'Masculino' || g === 'Feminino') genderByCourse[c][g]++;
  });
  const courseLabels = courses;
  createGroupedBar('chartGeneroCurso', courseLabels, [
    {
      label: 'Masculino',
      data: courseLabels.map(c => genderByCourse[c].Masculino),
      backgroundColor: 'rgba(99,102,241,0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Feminino',
      data: courseLabels.map(c => genderByCourse[c].Feminino),
      backgroundColor: 'rgba(236,72,153,0.6)',
      borderColor: '#ec4899',
      borderWidth: 1,
      borderRadius: 4,
    }
  ]);

  // Age by Course (bar)
  const ageByCourse = {};
  courses.forEach(c => ageByCourse[c] = []);
  data.forEach(r => {
    const c = normalizeCourse(r.curso);
    const age = parseAge(r.idade);
    if (age && ageByCourse[c]) ageByCourse[c].push(age);
  });
  const avgAgeByCourse = courses.map(c => {
    const ages = ageByCourse[c];
    return ages.length ? +(ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 0;
  });
  destroyChart('chartIdadeCurso');
  const ctxIdadeCurso = document.getElementById('chartIdadeCurso');
  if (ctxIdadeCurso) {
    charts['chartIdadeCurso'] = new Chart(ctxIdadeCurso, {
      type: 'bar',
      data: {
        labels: courseLabels,
        datasets: [{
          label: 'Idade Média',
          data: avgAgeByCourse,
          backgroundColor: 'rgba(6,182,212,0.6)',
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Idade média: ${ctx.raw} anos`
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          y: { beginAtZero: false, min: 10, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // People in house
  const peopleCounts = {};
  data.forEach(r => {
    if (!r.pessoasResidencia) return;
    let p = r.pessoasResidencia.trim();
    if (p.includes('Acima') || p.includes('6') || parseInt(p) >= 6) p = '6+';
    else if (['1', '2', '3', '4', '5'].includes(p)) p = p;
    else return;
    peopleCounts[p] = (peopleCounts[p] || 0) + 1;
  });
  const pOrder = ['1', '2', '3', '4', '5', '6+'];
  const pLabels = pOrder.filter(k => peopleCounts[k]);
  createBar('chartPessoasResidencia', pLabels, pLabels.map(k => peopleCounts[k] || 0));

  // Social program by region
  const regions = [...new Set(data.map(r => normalizeRegion(r.regiao)).filter(r => r !== 'N/I'))];
  const socialByRegion = {};
  regions.forEach(r => socialByRegion[r] = { Sim: 0, Não: 0 });
  data.forEach(r => {
    const reg = normalizeRegion(r.regiao);
    if (!socialByRegion[reg]) return;
    const prog = r.programaSocial;
    if (prog && (prog.toLowerCase() === 'sim' || prog.toLowerCase().includes('sim'))) {
      socialByRegion[reg].Sim++;
    } else {
      socialByRegion[reg].Não++;
    }
  });

  const regLabels = regions.sort((a, b) => {
    const totalA = socialByRegion[a].Sim + socialByRegion[a].Não;
    const totalB = socialByRegion[b].Sim + socialByRegion[b].Não;
    return totalB - totalA;
  });

  createGroupedBar('chartProgramaSocial', regLabels, [
    {
      label: 'Sim',
      data: regLabels.map(r => socialByRegion[r].Sim),
      backgroundColor: 'rgba(16,185,129,0.6)',
      borderColor: '#10b981',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Não',
      data: regLabels.map(r => socialByRegion[r].Não),
      backgroundColor: 'rgba(239,68,68,0.4)',
      borderColor: '#ef4444',
      borderWidth: 1,
      borderRadius: 4,
    }
  ]);
}

// ---- Render Transport & Semester (New Section) ----
function normalizeTransport(val) {
  if (!val) return 'N/I';
  const v = val.toLowerCase();
  const types = [];
  if (v.includes('ônibus')) types.push('Ônibus');
  if (v.includes('metrô')) types.push('Metrô');
  if (v.includes('trem')) types.push('Trem');
  if (v.includes('carro')) types.push('Carro');
  if (v.includes('moto')) types.push('Moto');
  if (v.includes('a pé') || v.includes('caminhando')) types.push('A pé');
  if (v.includes('bicicleta')) types.push('Bicicleta');
  if (v.includes('van')) types.push('Van Escolar');
  if (v.includes('carona')) types.push('Carona');
  return types.length ? types[0] : 'Outro'; // Just take the primary one for charts
}

/**
 * Categorizes transport into Public, Private, or Active.
 */
function getTransportCategory(val) {
  if (!val) return 'N/I';
  const v = val.toLowerCase();
  if (v.includes('ônibus') || v.includes('metrô') || v.includes('trem') || v.includes('van')) return 'Público';
  if (v.includes('carro') || v.includes('moto') || v.includes('carona')) return 'Privado';
  if (v.includes('a pé') || v.includes('bicicleta')) return 'Ativo';
  return 'Privado'; // Default to private/other
}

function renderTransportAndSemesters() {
  const data = filteredData;
  const total = data.length;

  // KPIs
  const publicCount = data.filter(r => getTransportCategory(r.tipoConducao) === 'Público').length;
  const activeCount = data.filter(r => getTransportCategory(r.tipoConducao) === 'Ativo').length;
  
  document.getElementById('kpiPublicTransport').textContent = publicCount;
  document.getElementById('kpiPublicPct').textContent = total ? `${((publicCount / total) * 100).toFixed(1)}% dos alunos` : '';
  document.getElementById('kpiActiveTransport').textContent = activeCount;
  document.getElementById('kpiActivePct').textContent = total ? `${((activeCount / total) * 100).toFixed(1)}% dos alunos` : '';

  // 1. Tipos de Condução (Donut)
  const transportCounts = countBy(data, r => normalizeTransport(r.tipoConducao));
  createDoughnut('chartTiposConducao', transportCounts.map(e => e[0]), transportCounts.map(e => e[1]));

  // 2. Evolução do Número de Alunos (Bar)
  // Semesters are YYYY-S
  const semOrder = ['2024-1', '2024-2', '2025-1', '2025-2', '2026-1'];
  const semCounts = {};
  allData.forEach(r => {
    const s = r.semestre || 'N/I';
    semCounts[s] = (semCounts[s] || 0) + 1;
  });
  const semLabels = semOrder.filter(s => semCounts[s]);
  createBar('chartEvolucaoSemestre', semLabels, semLabels.map(s => semCounts[s]));

  // 3. Uso de Transporte Público por Semestre (Grouped Bar)
  const transportBySem = {};
  semLabels.forEach(s => transportBySem[s] = { Público: 0, Outros: 0 });
  allData.forEach(r => {
    const s = r.semestre;
    if (!transportBySem[s]) return;
    const cat = getTransportCategory(r.tipoConducao);
    if (cat === 'Público') transportBySem[s].Público++;
    else transportBySem[s].Outros++;
  });

  createGroupedBar('chartTransporteSemestre', semLabels, [
    {
      label: 'Transp. Público',
      data: semLabels.map(s => transportBySem[s].Público),
      backgroundColor: 'rgba(99,102,241,0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Outros Meios',
      data: semLabels.map(s => transportBySem[s].Outros),
      backgroundColor: 'rgba(148,163,184,0.4)',
      borderColor: '#94a3b8',
      borderWidth: 1,
      borderRadius: 4,
    }
  ]);

  // 4. Tempo de Deslocamento Médio por Semestre (Line chart simulation via Bar)
  const timeMap = { '< 1 hora': 0.5, '1 - 2 horas': 1.5, '2 - 3 horas': 2.5, '> 3 horas': 3.5 };
  const timeBySem = {};
  semLabels.forEach(s => timeBySem[s] = []);
  
  allData.forEach(r => {
    const s = r.semestre;
    if (!timeBySem[s]) return;
    let t = r.tempoDeslocamento;
    let val = 0;
    if (t) {
       if (t.includes('Menos')) val = 0.5;
       else if (t.includes('uma') && t.includes('duas')) val = 1.5;
       else if (t.includes('duas') && t.includes('três')) val = 2.5;
       else if (t.includes('Mais')) val = 3.5;
    }
    if (val) timeBySem[s].push(val);
  });

  const avgTimeBySem = semLabels.map(s => {
    const vals = timeBySem[s];
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0;
  });

  destroyChart('chartDeslocamentoSemestre');
  const ctxTime = document.getElementById('chartDeslocamentoSemestre');
  if (ctxTime) {
    charts['chartDeslocamentoSemestre'] = new Chart(ctxTime, {
      type: 'line',
      data: {
        labels: semLabels,
        datasets: [{
          label: 'Horas Médias',
          data: avgTimeBySem,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Média: ${ctx.raw} horas`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

// ---- Render All ----
function renderAll() {
  renderKPIs();
  renderDemographics();
  renderEducation();
  renderBehavior();
  renderCorrelations();
  renderTransportAndSemesters();
}

// ---- Event Listeners ----
document.querySelectorAll('.filter-group select').forEach(select => {
  select.addEventListener('change', applyFilters);
});

document.getElementById('resetFilters').addEventListener('click', resetFilters);

// Sidebar toggle
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
  sidebarToggle.classList.toggle('moved');
});

// ---- Init ----
loadData();
