import { dom } from './dom.js';
import { state, getTotalLoadedRows, setReferenceFile } from '../state/appState.js';
import { refreshColumnsUI } from './columnsUI.js';
import { refreshGroupsUI, previewGroups } from './groupsUI.js';

export function renderLoadedFiles(onRemoveFile) {
  dom.fileList.className = 'file-list';
  dom.fileList.innerHTML = '';

  state.files.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-icon">📄</span>
      <span class="file-name"></span>
      <span class="file-meta">${file.rows.length} linhas</span>
      <button type="button" title="Remover arquivo">✕</button>
    `;

    item.querySelector('.file-name').textContent = file.name;
    item.querySelector('button').addEventListener('click', () => onRemoveFile(index));
    dom.fileList.appendChild(item);
  });
}

export function updateLoadedFilesSummary() {
  dom.fileName.textContent = `${state.files.length} arquivo(s) carregado(s) — ${getTotalLoadedRows()} linhas no total`;
}

export function enableConfigurationSteps() {
  dom.step1Number.classList.add('done');
  dom.step2.classList.remove('off');
  dom.step3.classList.remove('off');
  dom.runButton.disabled = false;
}

export function disableConfigurationSteps() {
  dom.fileName.textContent = '';
  dom.fileList.innerHTML = '';
  dom.step2.classList.add('off');
  dom.step3.classList.add('off');
  dom.runButton.disabled = true;
  dom.step1Number.classList.remove('done');
  dom.resultCard.style.display = 'none';
}

export function refreshAfterFileRemoval() {
  setReferenceFile();
  updateLoadedFilesSummary();
  refreshColumnsUI();
  refreshGroupsUI();
  previewGroups();
}
