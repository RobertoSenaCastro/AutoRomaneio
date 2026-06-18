import { createGroupLabel, createInjectedRow } from './rowFactory.js';

export function groupRows(sourceRows, groupIndexes, fullHeaders, transformRow, options = {}) {
  const { injections = [], materialCatalog = {} } = options;
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

    if (environmentValue !== lastEnvironment) {
      output.push(createGroupLabel(fullHeaders.length, `AMBIENTE: ${environmentValue}`));
      lastEnvironment = environmentValue;
    }

    output.push(createGroupLabel(
      fullHeaders.length,
      buildMaterialGroupLabel(materialCodeValue, materialCatalog)
    ));

    groups[key].forEach(row => output.push(transformRow(row)));

    injections.forEach(injection => {
      if (injection.code === key || parts.includes(injection.code)) {
        output.push(createInjectedRow(injection, fullHeaders.length));
      }
    });
  });

  return output;
}

function buildMaterialGroupLabel(materialCodeValue, materialCatalog) {
  const materialKey = String(materialCodeValue)
    .trim()
    .slice(0, 3);

  const materialName = materialCatalog?.[materialKey] ?? '';

  return materialName
    ? `CÓDIGO MATERIAL: ${materialCodeValue} - ${materialName}`
    : `CÓDIGO MATERIAL: ${materialCodeValue}`;
}
