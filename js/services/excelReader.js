export function readSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const headers = (data[0] || []).map(String);
        const rows = data
          .slice(1)
          .filter(row => row.some(cell => cell !== '' && cell !== undefined));

        resolve({ name: file.name, headers, rows });
      } catch (error) {
        reject(new Error(`Não foi possível ler o arquivo ${file.name}.`));
      }
    };

    reader.onerror = () => reject(new Error(`Erro ao carregar o arquivo ${file.name}.`));
    reader.readAsArrayBuffer(file);
  });
}
