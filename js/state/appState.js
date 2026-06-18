export const state = {
  files: [],
  referenceHeaders: [],
  referenceRows: [],
  deletedColumns: new Set(),
  groupColumns: [],
  injections: [],
  results: [],
  copyResults: [],
  materialCatalog: {}
};

export function setReferenceFile() {
  const firstFile = state.files[0];
  state.referenceHeaders = firstFile?.headers ?? [];
  state.referenceRows = firstFile?.rows ?? [];
}

export function resetConfiguration() {
  state.deletedColumns = new Set();
  state.groupColumns = [];
  state.injections = [];
  state.results = [];
  state.copyResults = [];
}

export function getTotalLoadedRows() {
  return state.files.reduce((total, file) => total + file.rows.length, 0);
}
