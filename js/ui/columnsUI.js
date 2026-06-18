import { DEFAULT_KEEP_COLUMNS } from '../config.js';
import { state } from '../state/appState.js';
import { dom } from './dom.js';
import { refreshGroupsUI } from './groupsUI.js';

let onColumnChanged = () => {};

export function setColumnChangedHandler(handler) {
  onColumnChanged = handler;
}

export function refreshColumnsUI() {
  dom.columnTags.innerHTML = '';
  state.deletedColumns = new Set();

  state.referenceHeaders.forEach((header, index) => {
    const tag = document.createElement('div');
    tag.id = `tg${index}`;
    tag.innerHTML = `<span class="icon">☰</span>${header}<span class="icon">✕</span>`;
    tag.className = DEFAULT_KEEP_COLUMNS.includes(header) ? 'tag' : 'tag del';

    if (!DEFAULT_KEEP_COLUMNS.includes(header)) {
      state.deletedColumns.add(index);
    }

    tag.addEventListener('click', () => toggleDeletedColumn(index));
    dom.columnTags.appendChild(tag);
  });
}

function toggleDeletedColumn(index) {
  const tag = document.getElementById(`tg${index}`);

  if (state.deletedColumns.has(index)) {
    state.deletedColumns.delete(index);
    tag.className = 'tag';
  } else {
    state.deletedColumns.add(index);
    tag.className = 'tag del';
    state.groupColumns = state.groupColumns.filter(columnIndex => columnIndex !== index);
  }

  refreshGroupsUI();
  onColumnChanged();
}
