import { EDGE_COLUMNS } from '../config.js';

export function processFile(file, options) {
  const { referenceHeaders, deletedColumns, groupColumns, injections, materialCatalog } = options;

  const deletedNames = new Set([...deletedColumns].map(index => referenceHeaders[index]));
  const resultHeaders = [...file.headers];
  const normalizedRows = file.rows.map(row => file.headers.map((_, index) => row[index] ?? ''));

  const pieceDescriptionIndex = resultHeaders.indexOf('PEÇA DESCRIÇÃO');
  const machiningIndex = resultHeaders.length;
  const headersWithMachining = [...resultHeaders, 'PROCESSO'];

  const groupColumnNames = groupColumns.map(index => referenceHeaders[index]);
  const mappedGroupColumns = groupColumnNames
    .map(name => resultHeaders.indexOf(name))
    .filter(index => index >= 0);

  const edgeColumnIndexes = EDGE_COLUMNS
    .map(name => resultHeaders.indexOf(name))
    .filter(index => index >= 0);

  const rows = mappedGroupColumns.length > 0
    ? groupRows(normalizedRows, mappedGroupColumns, headersWithMachining, buildMachiningColumn)
    : normalizedRows.map(buildMachiningColumn);

  const keepIndexes = headersWithMachining
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => !deletedNames.has(header))
    .map(({ index }) => index);

  const finalHeaders = keepIndexes.map(index => headersWithMachining[index]);
  const finalRows = rows.map(row => {
    const newRow = keepIndexes.map(index => row[index] ?? '');
    newRow._type = row._type;
    newRow._merge = row._merge;
    return newRow;
  });

  const numberColumnResult = addNumberColumn(finalHeaders, finalRows);

  const groupedRepeatedRows = getProcessRows(
    finalHeaders,
    finalRows,
    'COLAR'
  );

  const machiningRows = getProcessRows(finalHeaders, finalRows, 'USINAGEM');
  const sectionedRows = getProcessRows(finalHeaders, finalRows, 'SECCIONADA');

  return {
    headers: finalHeaders,
    rows: numberColumnResult.uniqueRows,
    repeatedRows: groupedRepeatedRows,
    machiningRows,
    sectionedRows
  };

  function buildMachiningColumn(row) {
    const newRow = [...row, ''];
    const machiningValues = [];
    const description = String(row[pieceDescriptionIndex] ?? '');
    const descriptionUpper = description.toUpperCase();

    edgeColumnIndexes
      .map(index => String(row[index] ?? '').trim())
      .filter(value => value.length > 0 && value === value.toUpperCase())
      .forEach(value => machiningValues.push(value));

    const hasUsiInDescription = descriptionUpper.includes('USI');
    const hasMachiningEdge = hasMachiningCodeInEdgeColumns(row, edgeColumnIndexes);

    if (pieceDescriptionIndex >= 0 && descriptionUpper.includes('SEC')) {
      machiningValues.push('SECCIONADA');
    }

    if (hasUsiInDescription || hasMachiningEdge) {
      machiningValues.push('USINAGEM');
    }

    if (machiningValues.length > 0) {
      newRow[machiningIndex] = machiningValues.join(' / ');
    }

    return newRow;
  }

  function hasMachiningCodeInEdgeColumns(row, edgeColumnIndexes) {
    const machiningCodes = ['4023', '4030', 'RM416', 'RM_416'];

    return edgeColumnIndexes.some(columnIndex => {
      const value = String(row[columnIndex] ?? '')
        .toUpperCase()
        .replace(/\s+/g, '');

      return machiningCodes.some(code => value.includes(code));
    });
  }

  function groupRows(sourceRows, groupIndexes, fullHeaders, transformRow) {
    const groupOrder = [];
    const groups = {};

    sourceRows.forEach(row => {
      const key = groupIndexes.map(index => String(row[index] ?? '')).join(' | ');
      if (!groups[key]) {
        groups[key] = [];
        groupOrder.push(key);
      }
      groups[key].push(row);
    });

    const output = [];
    let lastEnvironment = null;

    groupOrder.forEach(key => {
      const parts = key.split(' | ');
      const environmentIndex = groupIndexes.findIndex(index => fullHeaders[index] === 'AMBIENTE');
      const materialCodeIndex = groupIndexes.findIndex(index => fullHeaders[index] === 'CÓDIGO MATERIAL');

      const environmentValue = environmentIndex >= 0 ? (parts[environmentIndex] ?? '') : '';
      const materialCodeValue = materialCodeIndex >= 0 ? (parts[materialCodeIndex] ?? '') : parts[0];

      const materialKey = String(materialCodeValue)
        .trim()
        .slice(0, 3);

      const materialName = materialCatalog?.[materialKey] ?? '';

      if (environmentValue !== lastEnvironment) {
        output.push(createGroupLabel(fullHeaders.length, `AMBIENTE: ${environmentValue}`));
        lastEnvironment = environmentValue;
      }

      output.push(
        createGroupLabel(
          fullHeaders.length,
          materialName
            ? `CÓDIGO MATERIAL: ${materialCodeValue} - ${materialName}`
            : `CÓDIGO MATERIAL: ${materialCodeValue}`
        )
      );
      groups[key].forEach(row => output.push(transformRow(row)));

      injections.forEach(injection => {
        if (injection.code === key || parts.includes(injection.code)) {
          output.push(createInjectedRow(injection, fullHeaders.length));
        }
      });
    });

    return output;
  }
}

function createGroupLabel(length, text) {
  const row = new Array(length).fill('');
  row[0] = text;
  row._type = 'group';
  row._merge = true;
  return row;
}

function createInjectedRow(injection, length) {
  const row = injection.values ? injection.values.split(',').map(value => value.trim()) : [];
  while (row.length < length) row.push('');
  row._type = 'injection';
  return row;
}

function addNumberColumn(headers, rows) {
  headers.push('Nº');

  const processColumnIndex = headers.indexOf('PROCESSO');

  const countedKeys = new Set();
  const duplicatedKeys = new Set();

  let counter = 1;

  rows.forEach(row => {
    if (row._type) {
      row.push('');
      return;
    }

    const process = String(row[processColumnIndex] ?? '').trim().toUpperCase();

    if (!process.includes('COLAR')) {
      row.push(counter++);
      return;
    }

    const environment = getCurrentGroupValue(row, rows, 'AMBIENTE');
    const key = `${environment}::${process}`;

    if (countedKeys.has(key)) {
      row.push('');
      duplicatedKeys.add(key);
      return;
    }

    countedKeys.add(key);
    row.push(counter++);
  });

  const repeatedRows = rows
    .filter(row => !row._type)
    .filter(row => {
      const process = String(row[processColumnIndex] ?? '').toUpperCase();
      return process.includes('COLAR');
    })
    .map(row => [...row]);

  const uniqueRows = rows.filter(row => {
    if (row._type) return true;

    const process = String(row[processColumnIndex] ?? '').toUpperCase();

    if (!process.includes('COLAR')) {
      return true;
    }

    const numberValue = String(row[headers.indexOf('Nº')] ?? '').trim();

    return numberValue !== '';
  });

  return {
    uniqueRows,
    repeatedRows
  };
}

function getCurrentGroupValue(targetRow, rows, groupName) {
  let currentValue = '';

  for (const row of rows) {
    if (row === targetRow) {
      return currentValue;
    }

    if (row._type === 'group') {
      const label = String(row[0] ?? '');

      if (label.toUpperCase().startsWith(`${groupName}:`)) {
        currentValue = label.split(':').slice(1).join(':').trim();
      }
    }
  }

  return currentValue;
}

function groupRepeatedRows(headers, repeatedRows) {
  const processColumnIndex = headers.indexOf('PROCESSO');
  const environmentColumnIndex = headers.indexOf('AMBIENTE');
  const machiningColumnIndex = headers.indexOf('USINAGEM');

  const groupMap = new Map();

  repeatedRows.forEach(row => {
    const environment = String(row[environmentColumnIndex] ?? '').trim();
    const machining = String(row[machiningColumnIndex] ?? '').trim().toUpperCase();

    const key = `${environment}::${machining}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        environment,
        machining,
        rows: []
      });
    }

    const colagemRow = [...row];

    if (processColumnIndex >= 0) {
      const processValue = String(
        colagemRow[processColumnIndex] ?? ''
      );

      colagemRow[processColumnIndex] = processValue
        .split('/')
        .map(value => value.trim())
        .filter(value =>
          value.toUpperCase().includes('COLAR')
        )
        .join(' / ');
    }

    groupMap.get(key).rows.push(colagemRow);
  });

  const outputRows = [];
  let lastEnvironment = null;

  [...groupMap.values()]
    .sort((a, b) =>
      a.environment.localeCompare(b.environment) ||
      a.machining.localeCompare(b.machining)
    )
    .forEach(group => {
      if (group.environment !== lastEnvironment) {
        const environmentLabel = createGroupLabel(
          headers.length,
          group.environment.toUpperCase()
        );

        outputRows.push(environmentLabel);
        lastEnvironment = group.environment;
      }

      outputRows.push(...group.rows);
    });

  return outputRows;
}

function hasGlueInEdgeColumns(row, edgeColumnIndexes) {
  return edgeColumnIndexes.some(columnIndex => {
    const value = String(row[columnIndex] ?? '').toUpperCase();
    return value.includes('COLAR');
  });
}

function getProcessRows(headers, rows, processName) {
  const processColumnIndex = headers.indexOf('PROCESSO');

  const outputRows = [];
  let currentEnvironmentLabel = null;
  let currentMaterialLabel = null;

  rows.forEach(row => {
    if (row._type === 'group') {
      const label = String(row[0] ?? '');

      if (label.toUpperCase().startsWith('AMBIENTE:')) {
        currentEnvironmentLabel = row;
        currentMaterialLabel = null;
      }

      if (label.toUpperCase().startsWith('CÓDIGO MATERIAL:')) {
        currentMaterialLabel = row;
      }

      return;
    }

    const process = String(row[processColumnIndex] ?? '').toUpperCase();

    if (!process.includes(processName)) return;

    const alreadyAddedEnvironment =
      outputRows.includes(currentEnvironmentLabel);

    const alreadyAddedMaterial =
      outputRows.includes(currentMaterialLabel);

    if (currentEnvironmentLabel && !alreadyAddedEnvironment) {
      outputRows.push([...currentEnvironmentLabel]);
    }

    if (currentMaterialLabel && !alreadyAddedMaterial) {
      outputRows.push([...currentMaterialLabel]);
    }

    const newRow = [...row];

    newRow[processColumnIndex] = String(newRow[processColumnIndex] ?? '')
      .split('/')
      .map(value => value.trim())
      .filter(value => value.toUpperCase().includes(processName))
      .join(' / ');

    outputRows.push(newRow);
  });

  return outputRows;
}