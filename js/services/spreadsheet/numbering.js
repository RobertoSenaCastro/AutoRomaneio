export function addNumberColumn(headers, rows) {
  headers.push('Nº');

  const processColumnIndex = headers.indexOf('PROCESSO');
  const countedKeys = new Set();
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
