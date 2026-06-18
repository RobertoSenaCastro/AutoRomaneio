import { dom } from './dom.js';

export function renderResults(results) {
  dom.resultCard.style.display = 'block';

  const totalRows = results.reduce((sum, result) => sum + result.rows.filter(row => !row._type).length, 0);
  const totalGroups = results.reduce((sum, result) => sum + result.rows.filter(row => row._type === 'group').length, 0);
  const totalInjections = results.reduce((sum, result) => sum + result.rows.filter(row => row._type === 'injection').length, 0);

  dom.stats.innerHTML = `
    <div class="stat"><div class="stat-v">${results.length}</div><div class="stat-l">arquivos</div></div>
    <div class="stat"><div class="stat-v">${totalRows}</div><div class="stat-l">linhas</div></div>
    <div class="stat"><div class="stat-v">${totalGroups}</div><div class="stat-l">grupos</div></div>
    <div class="stat"><div class="stat-v">${totalInjections}</div><div class="stat-l">injetadas</div></div>
  `;

  dom.tabBar.innerHTML = '';
  results.forEach((result, index) => {
    const button = document.createElement('button');
    button.className = `tab-btn ${index === 0 ? 'active' : ''}`;
    button.title = result.name;
    button.textContent = result.name.replace(/\.(xlsx|xls)$/i, '');
    button.addEventListener('click', () => switchResultTab(results, index));
    dom.tabBar.appendChild(button);
  });

  switchResultTab(results, 0);
  dom.resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function switchResultTab(results, selectedIndex) {
  const result = results[selectedIndex];
  document.querySelectorAll('.tab-btn').forEach((button, index) => {
    button.classList.toggle('active', index === selectedIndex);
  });

  const columnWidth = `${Math.max(90, Math.floor(720 / result.headers.length))}px`;
  const thead = `<thead><tr>${result.headers.map(header => `<th style="width:${columnWidth}">${escapeHtml(header)}</th>`).join('')}</tr></thead>`;
  const tbody = result.rows.map(row => {
    const className = row._type === 'group' ? 'grp' : row._type === 'injection' ? 'inj' : '';
    const cells = result.headers.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('');
    return `<tr class="${className}">${cells}</tr>`;
  }).join('');

  dom.resultTable.innerHTML = `${thead}<tbody>${tbody}</tbody>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
