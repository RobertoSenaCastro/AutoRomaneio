function buildWorkbook(result) {
  const rows = result.rows.map(row => result.headers.map((_, index) => row[index] ?? ''));
  const sheet = XLSX.utils.aoa_to_sheet([result.headers, ...rows]);

  result.rows.forEach((row, rowIndex) => {
    const fill = row._type === 'group' ? 'C6EFCE' : row._type === 'injection' ? 'FFEB9C' : null;
    const fontColor = row._type === 'group' ? '276221' : row._type === 'injection' ? '9C5700' : null;

    if (fill) {
      result.headers.forEach((_, columnIndex) => {
        const ref = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex });
        if (!sheet[ref]) sheet[ref] = { v: '', t: 's' };
        sheet[ref].s = {
          fill: { patternType: 'solid', fgColor: { rgb: fill } },
          font: { bold: row._type === 'group', color: { rgb: fontColor } }
        };
      });
    }

    if (row._merge) {
      sheet['!merges'] ??= [];
      sheet['!merges'].push({
        s: { r: rowIndex + 1, c: 0 },
        e: { r: rowIndex + 1, c: result.headers.length - 1 }
      });
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Resultado');
  return workbook;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadResults(results) {
  if (!results?.length) return;

  if (results.length === 1) {
    const workbook = buildWorkbook(results[0]);
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([bytes], { type: 'application/octet-stream' }), results[0].name);
    return;
  }

  const zip = new JSZip();

  results.forEach(result => {
    const workbook = buildWorkbook(result);
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    zip.file(result.name, bytes);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'planilhas_processadas.zip');
}
