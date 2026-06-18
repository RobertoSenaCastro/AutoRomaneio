export function createGroupLabel(length, text) {
  const row = new Array(length).fill('');
  row[0] = text;
  row._type = 'group';
  row._merge = true;
  return row;
}

export function createInjectedRow(injection, length) {
  const row = injection.values ? injection.values.split(',').map(value => value.trim()) : [];

  while (row.length < length) {
    row.push('');
  }

  row._type = 'injection';
  return row;
}
