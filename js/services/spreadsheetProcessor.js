import { EDGE_COLUMNS } from '../config.js';
import { groupRows } from './spreadsheet/grouping.js';
import { addNumberColumn } from './spreadsheet/numbering.js';
import { buildProcessColumn } from './spreadsheet/processRules.js';
import { getDescriptionRows, getProcessRows } from './spreadsheet/processSheets.js';

export function processFile(file, options) {
  const {
    referenceHeaders,
    deletedColumns,
    groupColumns,
    injections,
    materialCatalog
  } = options;

  const deletedNames = new Set([...deletedColumns].map(index => referenceHeaders[index]));
  const sourceHeaders = [...file.headers];
  const sourceRows = normalizeRows(file.rows, sourceHeaders);

  const processColumnIndex = sourceHeaders.length;
  const headersWithProcess = [...sourceHeaders, 'PROCESSO'];
  const edgeColumnIndexes = getColumnIndexes(sourceHeaders, EDGE_COLUMNS);
  const mappedGroupColumns = mapGroupColumns(referenceHeaders, sourceHeaders, groupColumns);
  const pieceDescriptionIndex = sourceHeaders.indexOf('PEÇA DESCRIÇÃO');

  const addProcessColumn = row => buildProcessColumn(row, {
    pieceDescriptionIndex,
    processColumnIndex,
    edgeColumnIndexes
  });

  const processedRows = mappedGroupColumns.length > 0
    ? groupRows(sourceRows, mappedGroupColumns, headersWithProcess, addProcessColumn, {
      injections,
      materialCatalog
    })
    : sourceRows.map(addProcessColumn);

  const { finalHeaders, finalRows } = applyDeletedColumns(
    headersWithProcess,
    processedRows,
    deletedNames
  );

  const numberColumnResult = addNumberColumn(finalHeaders, finalRows);

  return {
    headers: finalHeaders,
    rows: numberColumnResult.uniqueRows,
    repeatedRows: getProcessRows(finalHeaders, finalRows, 'COLAR'),
    machiningRows: getProcessRows(finalHeaders, finalRows, 'USINAGEM'),
    sectionedRows: getProcessRows(finalHeaders, finalRows, 'SECCIONADA'),
    handleRows: getDescriptionRows(finalHeaders, finalRows, "PUX"),
    edgebander45Rows: getProcessRows(finalHeaders, finalRows,"COLADEIRA_45")
  };
}

function normalizeRows(rows, headers) {
  return rows.map(row => headers.map((_, index) => row[index] ?? ''));
}

function getColumnIndexes(headers, columnNames) {
  return columnNames
    .map(name => headers.indexOf(name))
    .filter(index => index >= 0);
}

function mapGroupColumns(referenceHeaders, sourceHeaders, groupColumns) {
  return groupColumns
    .map(index => referenceHeaders[index])
    .map(name => sourceHeaders.indexOf(name))
    .filter(index => index >= 0);
}

function applyDeletedColumns(headers, rows, deletedNames) {
  const keepIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => !deletedNames.has(header))
    .map(({ index }) => index);

  const finalHeaders = keepIndexes.map(index => headers[index]);
  const finalRows = rows.map(row => {
    const newRow = keepIndexes.map(index => row[index] ?? '');
    newRow._type = row._type;
    newRow._merge = row._merge;
    return newRow;
  });

  return { finalHeaders, finalRows };
}
