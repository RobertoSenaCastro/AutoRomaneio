import { DEFAULT_GROUP_COLUMNS } from '../config.js';
import { state } from '../state/appState.js';
import { dom } from './dom.js';

export function applyDefaultGroupColumns() {
  DEFAULT_GROUP_COLUMNS.forEach(name => {
    const columnIndex = state.referenceHeaders.indexOf(name);
    if (columnIndex >= 0 && !state.groupColumns.includes(columnIndex)) {
      state.groupColumns.push(columnIndex);
    }
  });
}

export function refreshGroupsUI() {
  renderGroupColumns();
  buildGroupSelect();
}

export function buildGroupSelect() {
  const currentValue = dom.groupSelect.value;
  dom.groupSelect.innerHTML = '<option value="">— selecione uma coluna —</option>';

  state.referenceHeaders.forEach((header, index) => {
    if (!state.deletedColumns.has(index) && !state.groupColumns.includes(index)) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = header;
      if (String(index) === String(currentValue)) option.selected = true;
      dom.groupSelect.appendChild(option);
    }
  });
}

export function addGroupColumn() {
  const columnIndex = Number.parseInt(dom.groupSelect.value, 10);
  if (Number.isNaN(columnIndex) || state.groupColumns.includes(columnIndex)) return;

  state.groupColumns.push(columnIndex);
  refreshGroupsUI();
  previewGroups();
}

export function removeGroupColumn(columnIndex) {
  state.groupColumns = state.groupColumns.filter(index => index !== columnIndex);
  refreshGroupsUI();
  previewGroups();
}

export function renderGroupColumns() {
  dom.groupList.innerHTML = '';

  state.groupColumns.forEach((columnIndex, position) => {
    const item = document.createElement('div');
    item.className = 'inj-item';
    item.innerHTML = `
      <span><b style="color:var(--muted);margin-right:6px">#${position + 1}</b>${state.referenceHeaders[columnIndex]}</span>
      <button type="button">✕</button>
    `;
    item.querySelector('button').addEventListener('click', () => removeGroupColumn(columnIndex));
    dom.groupList.appendChild(item);
  });
}

export function previewGroups() {
  if (!state.groupColumns.length) {
    dom.previewInfo.textContent = '';
    return;
  }

  const keys = state.referenceRows.map(row =>
    state.groupColumns.map(columnIndex => String(row[columnIndex] ?? '')).join(' | ')
  );

  const uniqueGroups = [...new Set(keys)].filter(Boolean);
  const groupNames = state.groupColumns.map(columnIndex => state.referenceHeaders[columnIndex]).join(' + ');

  dom.previewInfo.textContent = `${uniqueGroups.length} grupos por "${groupNames}": ${uniqueGroups.slice(0, 6).join(', ')}${uniqueGroups.length > 6 ? '…' : ''}`;
}
