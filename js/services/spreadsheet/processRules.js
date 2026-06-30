import {
  GLUE_EDGE_VALUES,
  GLUE_DESCRIPTION_VALUES,
  MACHINING_EDGE_VALUES,
  MACHINING_DESCRIPTION_VALUES,
  SECTIONING_DESCRIPTION_VALUES,
  EDGEBANDER45_DESCRIPTION_VALUES,
  EDGEBANDER45_EDGE_VALUES
} from '../../config.js';

export function buildProcessColumn(row, options) {
  const {
    pieceDescriptionIndex,
    processColumnIndex,
    edgeColumnIndexes
  } = options;

  const newRow = [...row, ''];
  const processValues = [];
  const description = String(row[pieceDescriptionIndex] ?? '');
  const descriptionUpper = description.toUpperCase();


  getGlueProcessesFromEdgeColumns(row, edgeColumnIndexes)
    .forEach(value => processValues.push(value));

  const hasEdgebander45InDescription =
    EDGEBANDER45_DESCRIPTION_VALUES.some(value =>
      descriptionUpper.includes(value.toUpperCase())
    );

  const hasEdgebander45InEdge =
    hasEdgebander45InEdgeColumns(row, edgeColumnIndexes);

  const hasGlueInDescription = GLUE_DESCRIPTION_VALUES.some(value =>
    descriptionUpper.includes(value.toUpperCase())
  );

  const hasMachiningInDescription = MACHINING_DESCRIPTION_VALUES.some(value =>
    descriptionUpper.includes(value.toUpperCase())
  );

  const hasSectioning = SECTIONING_DESCRIPTION_VALUES.some(value =>
    descriptionUpper.includes(value.toUpperCase())
  );

  const hasMachiningEdge = hasMachiningCodeInEdgeColumns(row, edgeColumnIndexes);

  if (hasEdgebander45InDescription || hasEdgebander45InEdge) {
    processValues.push('COLADEIRA_45');
  }

  if (hasGlueInDescription) {
    processValues.push('COLAR');
  }

  if (hasSectioning) {
    processValues.push('SECCIONADA');
  }

  if (hasMachiningInDescription || hasMachiningEdge) {
    processValues.push('USINAGEM');
  }

  if (processValues.length > 0) {
    newRow[processColumnIndex] = processValues.join(' / ');
  }

  return newRow;
}

function getGlueProcessesFromEdgeColumns(row, edgeColumnIndexes) {
  const processes = [];

  edgeColumnIndexes.forEach(columnIndex => {
    const value = String(row[columnIndex] ?? '').trim();

    if (GLUE_EDGE_VALUES.some(glueValue =>
      value.toUpperCase().includes(glueValue.toUpperCase())
    )) {
      processes.push(value);
    }
  });

  return processes;
}

function hasMachiningCodeInEdgeColumns(row, edgeColumnIndexes) {
  return edgeColumnIndexes.some(columnIndex => {
    const value = normalizeProcessText(row[columnIndex]);

    return MACHINING_EDGE_VALUES.some(code => {
      const normalizedCode = normalizeProcessText(code);
      return value.includes(normalizedCode);
    });
  });
}

function normalizeProcessText(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function hasEdgebander45InEdgeColumns(row, edgeColumnIndexes) {
  return edgeColumnIndexes.some(columnIndex => {
    const value = String(row[columnIndex] ?? '')
      .toUpperCase()
      .replace(/\s+/g, '');

    return EDGEBANDER45_EDGE_VALUES.some(code =>
      value.includes(code.toUpperCase())
    );
  });
}
