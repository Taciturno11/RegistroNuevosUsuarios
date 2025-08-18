import React, { useState, useEffect } from "react";
import { api } from "../../utils/capacitaciones/api";

export default function SelectorBar({ campania, capa, onLoteCargado }) {
  const [meses, setMeses] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [capas, setCapas] = useState([]);
  const [capaSeleccionada, setCapaSeleccionada] = useState("");

  // Cargar meses disponibles
  useEffect(() => {
    const cargarMeses = async () => {
      try {
        const data = await api(`/api/capacitaciones/meses`);
        setMeses(data);
        if (data.length > 0) {
          setMesSeleccionado(data[0]);
        }
      } catch (error) {
        console.error('Error cargando meses:', error);
      }
    };
    cargarMeses();
  }, []);

  // Cargar capas cuando cambia la campaña
  useEffect(() => {
    if (campania && mesSeleccionado) {
      const cargarCapas = async () => {
        try {
          // Usar dniCap en lugar de campania para la API
          const data = await api(`/api/capacitaciones/capas?dniCap=70907372`);
          console.log('✅ Capas cargadas:', data);
          
          // Filtrar por campaña y mes
          const capasFiltradas = data.filter(c => 
            (c.CampañaID == campania || c.campaniaId == campania) &&
            (c.fechaInicio?.startsWith(mesSeleccionado) || c.fecha_inicio?.startsWith(mesSeleccionado))
          );
          
          setCapas(capasFiltradas);
          if (capasFiltradas.length > 0) {
            setCapaSeleccionada(capasFiltradas[0].capa || capasFiltradas[0].capaNum);
          }
        } catch (error) {
          console.error('Error cargando capas:', error);
        }
      };
      cargarCapas();
    }
  }, [campania, mesSeleccionado]);

  // Notificar cuando se selecciona una capa
  useEffect(() => {
    if (capaSeleccionada && onLoteCargado) {
      onLoteCargado({
        campania,
        capa: capaSeleccionada,
        mes: mesSeleccionado
      });
    }
  }, [capaSeleccionada, campania, mesSeleccionado, onLoteCargado]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Selector de Mes */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {meses.map((mes, index) => (
              <option key={index} value={mes}>
                {mes}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Capa */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Capa
          </label>
          <select
            value={capaSeleccionada}
            onChange={(e) => setCapaSeleccionada(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {capas.map((c, index) => (
              <option key={index} value={c.capa || c.capaNum}>
                Capa {c.capa || c.capaNum}
              </option>
            ))}
          </select>
        </div>

        {/* Información de selección */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Selección Actual
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
            Campaña: {campania} | Capa: {capaSeleccionada} | Mes: {mesSeleccionado}
          </div>
        </div>
      </div>
    </div>
  );
}
