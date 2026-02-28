import React from 'react';
import { Map as MapIcon, Layers, Info, Settings, Search, ChevronRight, Check } from 'lucide-react';

const MapSelector = ({ activeMap, onMapSelect }) => {
  const maps = [
    { id: 1, name: 'Infraestructura', icon: <MapIcon size={22} /> },
    { id: 2, name: 'Ambiental', icon: <MapIcon size={22} /> },
    { id: 3, name: 'Servicios', icon: <MapIcon size={22} /> },
    { id: 4, name: 'Sociocultural', icon: <MapIcon size={22} /> },
  ];

  return (
    <div className="sidebar-section">
      <div className="sidebar-title">
        <span className="text-responsive" style={{ fontWeight: 800 }}>Selección de Mapa</span>
        <MapIcon size={18} />
      </div>
      <div className="map-grid">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`map-card ${activeMap === map.id ? 'active' : ''}`}
            onClick={() => onMapSelect(map.id)}
          >
            {map.icon}
            <span className="text-responsive" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{map.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LayerControl = ({ layers, onToggleLayer }) => {
  return (
    <div className="sidebar-section">
      <div className="sidebar-title">
        <span className="text-responsive" style={{ fontWeight: 800 }}>Capas</span>
        <Layers size={18} />
      </div>
      <div className="layer-list">
        {layers.map((layer) => (
          <div key={layer.id} className="layer-item" style={{ border: '1px solid var(--border-color)', borderRadius: '10px' }}>
            <div
              className={`checkbox-custom ${layer.visible ? 'checked' : ''}`}
              onClick={() => onToggleLayer(layer.id)}
              style={{ minWidth: '20px', minHeight: '20px' }}
            >
              {layer.visible && <Check size={14} color="white" strokeWidth={3} />}
            </div>
            <span className="text-responsive" style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{layer.name}</span>
          </div>
        ))}
        {layers.length === 0 && <span className="text-responsive" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No hay capas disponibles.</span>}
      </div>
    </div>
  );
};

const Sidebar = ({ activeMap, onMapSelect, layers, onToggleLayer, isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <MapSelector activeMap={activeMap} onMapSelect={onMapSelect} />
      <LayerControl layers={layers} onToggleLayer={onToggleLayer} />

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-title">
          <span className="text-responsive" style={{ fontWeight: 800 }}>Información</span>
          <Info size={18} />
        </div>
        <div className="legend-list">
          <div className="legend-item" style={{ padding: '4px 0' }}>
            <div className="color-dot" style={{ backgroundColor: '#60a5fa', boxShadow: '0 0 5px rgba(96, 165, 250, 0.4)' }}></div>
            <span className="text-responsive" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Vías Principales</span>
          </div>
          <div className="legend-item" style={{ padding: '4px 0' }}>
            <div className="color-dot" style={{ backgroundColor: '#10b981', boxShadow: '0 0 5px rgba(16, 185, 129, 0.4)' }}></div>
            <span className="text-responsive" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Áreas Verdes</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-color)', borderBottom: 'none', background: 'rgba(0,0,0,0.05)' }}>
        <div className="sidebar-title" style={{ marginBottom: 0, opacity: 0.8 }}>
          <span className="text-responsive" style={{ fontSize: '0.75rem' }}>Configuración</span>
          <Settings size={14} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
