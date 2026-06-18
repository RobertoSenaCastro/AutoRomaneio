export function getProcessRows(headers, rows, processName) {
  const processColumnIndex = headers.indexOf('PROCESSO');
  const outputRows = [];
  const addedLabelKeys = new Set();

  let currentEnvironmentLabel = null;
  let currentMaterialLabel = null;

  rows.forEach(row => {
    if (row._type === 'group') {
      const label = String(row[0] ?? '').toUpperCase();

      if (label.startsWith('AMBIENTE:')) {
        currentEnvironmentLabel = row;
        currentMaterialLabel = null;
      }

      if (label.startsWith('CÓDIGO MATERIAL:')) {
        currentMaterialLabel = row;
      }

      return;
    }

    const process = String(row[processColumnIndex] ?? '').toUpperCase();

    if (!process.includes(processName)) return;

    addCurrentLabels(outputRows, addedLabelKeys, currentEnvironmentLabel, currentMaterialLabel);
    outputRows.push(cleanProcessColumn(row, processColumnIndex, processName));
  });

  return outputRows;
}

function addCurrentLabels(outputRows, addedLabelKeys, currentEnvironmentLabel, currentMaterialLabel) {
  const environmentText = String(currentEnvironmentLabel?.[0] ?? '');
  const materialText = String(currentMaterialLabel?.[0] ?? '');
  const environmentKey = `environment::${environmentText}`;
  const materialKey = `material::${environmentText}::${materialText}`;

  if (currentEnvironmentLabel && !addedLabelKeys.has(environmentKey)) {
    outputRows.push([...currentEnvironmentLabel]);
    addedLabelKeys.add(environmentKey);
  }

  if (currentMaterialLabel && !addedLabelKeys.has(materialKey)) {
    outputRows.push([...currentMaterialLabel]);
    addedLabelKeys.add(materialKey);
  }
}

function cleanProcessColumn(row, processColumnIndex, processName) {
  const newRow = [...row];

  newRow[processColumnIndex] = String(newRow[processColumnIndex] ?? '')
    .split('/')
    .map(value => value.trim())
    .filter(value => value.toUpperCase().includes(processName))
    .join(' / ');

  return newRow;
}

export function getDescriptionRows(headers, rows, searchValue) {
  const descriptionColumnIndex = headers.indexOf('PEÇA DESCRIÇÃO');

  const outputRows = [];
  let currentEnvironmentLabel = null;
  let currentMaterialLabel = null;

  let lastEnvironmentLabelText = null;
  let lastMaterialLabelText = null;

  rows.forEach(row => {
    if (row._type === 'group') {
      const label = String(row[0] ?? '');
      const labelUpper = label.toUpperCase();

      if (labelUpper.startsWith('AMBIENTE:')) {
        currentEnvironmentLabel = row;
        currentMaterialLabel = null;
      }

      if (
        labelUpper.startsWith('CÓDIGO MATERIAL:') ||
        labelUpper.startsWith('CÓDIGO DA PEÇA:')
      ) {
        currentMaterialLabel = row;
      }

      return;
    }

    const description = String(row[descriptionColumnIndex] ?? '').toUpperCase();

    if (!description.includes(searchValue.toUpperCase())) return;

    const environmentLabelText = String(currentEnvironmentLabel?.[0] ?? '');
    const materialLabelText = String(currentMaterialLabel?.[0] ?? '');

    if (environmentLabelText && environmentLabelText !== lastEnvironmentLabelText) {
      outputRows.push([...currentEnvironmentLabel]);
      lastEnvironmentLabelText = environmentLabelText;
      lastMaterialLabelText = null;
    }

    if (materialLabelText && materialLabelText !== lastMaterialLabelText) {
      outputRows.push([...currentMaterialLabel]);
      lastMaterialLabelText = materialLabelText;
    }

    outputRows.push([...row]);
  });

  return outputRows;
}
