import React from "react";

export default function DesercionesTable({ campania, capaNum }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header de la tabla */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          Tabla de Deserciones
        </h3>
        <p className="text-sm text-gray-600">
          Campaña: {campania} | Capa: {capaNum}
        </p>
      </div>

      {/* Contenido simplificado */}
      <div className="p-8 text-center">
        <div className="text-gray-500 text-lg mb-4">
          📊 Tabla de Deserciones
        </div>
        <div className="text-gray-400 text-sm">
          Esta funcionalidad se implementará próximamente
        </div>
      </div>
    </div>
  );
}
