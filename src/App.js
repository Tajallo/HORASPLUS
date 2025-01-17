import React, { useState, useEffect } from 'react';

function App() {
  // Estados originales para la tabla de entradas
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: "09/10/24",
      hours: 4,
      timeRange: "21:00 - 01:00",
      description: "Mig fil-ics-4",
      month: "Octubre 2024",
    },
    // ... resto de los entries iniciales ...
  ]);

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: "",
    hours: "",
    horaInicio: "",
    horaFin: "",
    description: "",
  });

  // Constantes
  const minDate = "2024-01-01";
  const maxDate = "2025-12-31";
  const months = [...new Set(entries.map((entry) => entry.month))];
  const FACTOR_MULTIPLICADOR = 1.75;
  const HORAS_POR_DIA = 7.3;

  // Función para obtener registros
  const obtenerRegistros = async () => {
    try {
      const response = await fetch('http://localhost:3001/registros');
      if (!response.ok) throw new Error('Error al obtener registros');
      
      const data = await response.json();
      console.log('Registros obtenidos:', data); // Para debugging
      setEntries(data);
    } catch (error) {
      console.error("Error al obtener registros:", error);
    }
  };

  const handleEditClick = (entry) => {
    setEditingId(entry.id);
    const [day, month, year] = entry.date.split('/');
    const formattedDate = `20${year}-${month}-${day}`;

    setNewEntry({
      date: formattedDate,
      hours: entry.hours,
      horaInicio: entry.timeRange.split(' - ')[0],
      horaFin: entry.timeRange.split(' - ')[1],
      description: entry.description,
    });
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    try {
      const date = new Date(newEntry.date);
      const formattedDate = date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      const updatedEntry = {
        id: editingId, // Asegurarnos de incluir el ID
        date: formattedDate,
        hours: parseFloat(newEntry.hours),
        horaInicio: newEntry.horaInicio,
        horaFin: newEntry.horaFin,
        description: newEntry.description,
        month: date.toLocaleString("es-ES", {
          month: "long",
          year: "numeric",
        })
      };

      const response = await fetch(`http://localhost:3001/registros/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEntry)
      });

      if (!response.ok) throw new Error('Error al actualizar');

      // Recargar todos los registros después de actualizar
      obtenerRegistros();

      // Limpiar el formulario y estado de edición
      setEditingId(null);
      setNewEntry({
        date: "",
        hours: "",
        horaInicio: "",
        horaFin: "",
        description: "",
      });

    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el registro");
    }
  };

  const calcularHorasTrabajadas = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);
    
    let horas = horaFin - horaInicio;
    let minutos = minFin - minInicio;
    
    // Si la hora fin es menor que la hora inicio, asumimos que es del día siguiente
    if (horas < 0) {
      horas += 24;
    }
    
    if (minutos < 0) {
      horas--;
      minutos += 60;
    }
    
    return horas + (minutos / 60);
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      const date = new Date(newEntry.date);
      const month = date.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
      });
      
      const formattedDate = date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      // Calcular las horas automáticamente
      const horasTrabajadas = calcularHorasTrabajadas(newEntry.horaInicio, newEntry.horaFin);
      const timeRange = `${newEntry.horaInicio} - ${newEntry.horaFin}`;

      const nuevoRegistro = {
        date: formattedDate,
        hours: horasTrabajadas,
        timeRange: timeRange,
        description: newEntry.description,
        month: month
      };

      const response = await fetch('http://localhost:3001/registros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoRegistro)
      });

      if (!response.ok) throw new Error('Error al guardar');

      // Recargar todos los registros después de añadir
      obtenerRegistros();
      
      // Limpiar el formulario
      setNewEntry({
        date: "",
        hours: "",
        horaInicio: "",
        horaFin: "",
        description: "",
      });

    } catch (error) {
      console.error("Error:", error);
      alert("Error al añadir el registro");
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta entrada?")) {
      try {
        // Primero encontrar el registro en el estado local
        const entryToDelete = entries.find(entry => entry.id === id);
        if (!entryToDelete) {
          throw new Error('Registro no encontrado');
        }

        console.log('Intentando eliminar registro:', id); // Para debugging

        const response = await fetch(`http://localhost:3001/registros/${id}`, {
          method: 'DELETE'
        });

        if (response.status === 404) {
          console.log('Registro no encontrado en el servidor, eliminando localmente');
          // Si el registro no existe en el servidor, solo actualizamos el estado local
          setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
          return;
        }

        if (!response.ok) throw new Error('Error al eliminar');

        // Actualizar el estado local
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
        console.log('Registro eliminado exitosamente');
        
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar el registro");
      }
    }
  };

  const calculateTotals = (entriesArray) => {
    const totalHours = entriesArray.reduce((acc, entry) => acc + entry.hours, 0);
    const totalCompensableHours = totalHours * FACTOR_MULTIPLICADOR;
    const totalDays = totalCompensableHours / HORAS_POR_DIA;
    return { totalHours, totalCompensableHours, totalDays };
  };

  const filteredEntries = selectedMonth === "all"
    ? entries
    : entries.filter((entry) => entry.month === selectedMonth);

  useEffect(() => {
    obtenerRegistros();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Gestor de Horas Extra
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingId ? "Editar Entrada" : "Añadir Nueva Entrada"}
          </h2>
          <form onSubmit={editingId ? handleUpdateEntry : handleAddEntry}
                className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="border rounded p-2"
              min={minDate}
              max={maxDate}
              required
            />
            <input
              type="time"
              value={newEntry.horaInicio}
              onChange={(e) => setNewEntry({ ...newEntry, horaInicio: e.target.value })}
              className="border rounded p-2"
              required
            />
            <input
              type="time"
              value={newEntry.horaFin}
              onChange={(e) => setNewEntry({ ...newEntry, horaFin: e.target.value })}
              className="border rounded p-2"
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="border rounded p-2"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {editingId ? "Actualizar" : "Añadir"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setNewEntry({
                      date: "",
                      hours: "",
                      horaInicio: "",
                      horaFin: "",
                      description: "",
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">Todos los meses</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Compensables</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{entry.date}</td>
                  <td className="px-6 py-4">{entry.hours}</td>
                  <td className="px-6 py-4">{entry.timeRange}</td>
                  <td className="px-6 py-4">{entry.description}</td>
                  <td className="px-6 py-4">
                    {(entry.hours * FACTOR_MULTIPLICADOR).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEditClick(entry)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Resumen Total
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {calculateTotals(filteredEntries).totalHours.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Horas Compensables</p>
              <p className="text-2xl font-bold text-green-600">
                {calculateTotals(filteredEntries).totalCompensableHours.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Días Compensables</p>
              <p className="text-2xl font-bold text-purple-600">
                {calculateTotals(filteredEntries).totalDays.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;