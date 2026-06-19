import { state, resetConfiguration, setReferenceFile } from './state/appState.js';
import { readSpreadsheetFile } from './services/excelReader.js';
import { processFile } from './services/spreadsheetProcessor.js';
import { downloadResults } from './services/exporter.js';
import { dom } from './ui/dom.js';
import {
  renderLoadedFiles,
  updateLoadedFilesSummary,
  enableConfigurationSteps,
  disableConfigurationSteps,
  refreshAfterFileRemoval
} from './ui/filesUI.js';
import { refreshColumnsUI, setColumnChangedHandler } from './ui/columnsUI.js';
import { applyDefaultGroupColumns, refreshGroupsUI, addGroupColumn, previewGroups } from './ui/groupsUI.js';
import { renderResults } from './ui/resultsUI.js';
import { APP_VERSION } from './config.js';

setColumnChangedHandler(previewGroups);

async function loadFiles(input) {
  const selectedFiles = Array.from(input.files);
  if (!selectedFiles.length) return;

  try {
    const newFiles = selectedFiles.filter(file => !state.files.some(loaded => loaded.name === file.name));
    const parsedFiles = await Promise.all(newFiles.map(readSpreadsheetFile));

    state.files.push(...parsedFiles);
    onAllLoaded();
  } catch (error) {
    alert(error.message);
  } finally {
    input.value = '';
  }
}

function onAllLoaded() {
  setReferenceFile();
  resetConfiguration();

  updateLoadedFilesSummary();
  renderLoadedFiles(removeFile);
  enableConfigurationSteps();

  refreshColumnsUI();
  applyDefaultGroupColumns();
  refreshGroupsUI();
  previewGroups();
}

function removeFile(index) {
  state.files.splice(index, 1);

  if (state.files.length === 0) {
    disableConfigurationSteps();
    return;
  }

  renderLoadedFiles(removeFile);
  refreshAfterFileRemoval();
}

function runProcessing() {
  state.results = state.files.map(file => ({
    name: file.name,
    ...processFile(file, {
      referenceHeaders: state.referenceHeaders,
      deletedColumns: state.deletedColumns,
      groupColumns: state.groupColumns,
      injections: state.injections,
      materialCatalog: state.materialCatalog
    })
  }));

  const repeatedResults = state.results
    .map(result => ({
      name: result.name.replace(/\.xlsx?$/i, ' Colagem.xlsx'),
      headers: result.headers,
      rows: result.repeatedRows ?? []
    }))
    .filter(result => result.rows.length > 0);

  const machiningResults = state.results
    .map(result => ({
      name: result.name.replace(/\.xlsx?$/i, ' Usinagem.xlsx'),
      headers: result.headers,
      rows: result.machiningRows ?? []
    }))
    .filter(result => result.rows.length > 0);

  const sectionedResults = state.results
    .map(result => ({
      name: result.name.replace(/\.xlsx?$/i, ' Seccionada.xlsx'),
      headers: result.headers,
      rows: result.sectionedRows ?? []
    }))
    .filter(result => result.rows.length > 0);

  const handleResults = state.results
    .map(result => ({
      name: result.name.replace(/\.xlsx?$/i, ' Puxadores.xlsx'),
      headers: result.headers,
      rows: result.handleRows ?? []
    }))
    .filter(result => result.rows.length > 0);

  const edgebander45Results = state.results
    .map(result => ({
      name: result.name.replace(/\.xlsx?$/i, ' Coladeira.xlsx'),
      headers: result.headers,
      rows: result.edgebander45Rows ?? []
    }))
    .filter(result => result.rows.length > 0);

  state.results = [
    ...state.results,
    ...repeatedResults,
    ...machiningResults,
    ...sectionedResults,
    ...handleResults,
    ...edgebander45Results
  ];

  renderResults(state.results);
  dom.step2Number.classList.add('done');
  dom.step3Number.classList.add('done');
}

function setupEvents() {
  dom.fileInput.addEventListener('change', event => loadFiles(event.target));
  dom.runButton.addEventListener('click', runProcessing);
  document.getElementById('add-group-btn').addEventListener('click', addGroupColumn);
  document.getElementById('download-btn').addEventListener('click', () => downloadResults([
    ...state.results,
    ...state.copyResults
  ]));

  dom.dropZone.addEventListener('click', () => dom.fileInput.click());
  dom.dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    dom.dropZone.style.background = '#E1F5EE';
  });
  dom.dropZone.addEventListener('dragleave', () => {
    dom.dropZone.style.background = '';
  });
  dom.dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dom.dropZone.style.background = '';
    if (event.dataTransfer.files.length) {
      loadFiles({ files: event.dataTransfer.files, value: '' });
    }
  });
}

async function loadMaterialCatalog() {
  const response = await fetch('./data/materials.json');
  state.materialCatalog = await response.json();
}

await loadMaterialCatalog();
setupEvents();
document.getElementById('app-version').textContent =
  `AutoRomaneio v${APP_VERSION}`;
