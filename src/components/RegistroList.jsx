import { exportToExcel } from '../utils/excelExport';

const handleExportToExcel = () => {
  exportToExcel(registros, 'registros_horas.xlsx');
};

<button 
  onClick={handleExportToExcel}
  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
>
  Exportar a Excel
</button> 