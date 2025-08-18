import React from "react";

export default function ToggleTabs({ active, onChange }) {
  const tabs = [
    { id: "asist", label: "Asistencias", icon: "📊" },
    { id: "eval", label: "Evaluaciones", icon: "📝" },
    { id: "deser", label: "Deserciones", icon: "❌" }
  ];

  return (
    <div className="flex bg-white rounded-lg shadow-md p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            active === tab.id
              ? "bg-blue-500 text-white shadow-md"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
