import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'registros.xlsx') => {
  // Crear la hoja de cálculo directamente con los datos
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();
  
  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');

  // Guardar el archivo
  XLSX.writeFile(workbook, fileName);
}; 