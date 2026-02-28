import React from 'react';
import { Map as MapIcon, Layers, Info, Settings, Search, ChevronRight, Check } from 'lucide-react';

const MapSelector = ({ activeMap, onMapSelect }) => {
  const maps = [
    { id: 1, name: 'Map Type A', icon: <MapIcon size={24} /> },
    { id: 2, name: 'Map Type B', icon: <MapIcon size={24} /> },
    { id: 3, name: 'Map Type C', icon: <MapIcon size={24} /> },
    { id: 4, name: 'Map Type D', icon: <MapIcon size={24} /> },
  ];

  return (
    <div className="sidebar-section">
      <div className="sidebar-title">
        <span>Map Selection</span>
        <MapIcon size={16} />
      </div>
      <div className="map-grid">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`map-card ${activeMap === map.id ? 'active' : ''}`}
            onClick={() => onMapSelect(map.id)}
          >
            {map.icon}
            <span>{map.name}</span>
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
        <span>Layers</span>
        <Layers size={16} />
      </div>
      <div className="layer-list">
        {layers.map((layer) => (
          <div key={layer.id} className="layer-item">
            <div 
              className={`checkbox-custom ${layer.visible ? 'checked' : ''}`}
              onClick={() => onToggleLayer(layer.id)}
            >
              {layer.visible && <Check size={12} color="white" />}
            </div>
            <span style={{ fontSize: '0.875rem' }}>{layer.name}</span>
          </div>
        ))}
        {layers.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No layers available for this map.</span>}
      </div>
    </div>
  );
};

const Sidebar = ({ activeMap, onMapSelect, layers, onToggleLayer }) => {
  return (
    <div className="sidebar">
      <MapSelector activeMap={activeMap} onMapSelect={onMapSelect} />
      <LayerControl layers={layers} onToggleLayer={onToggleLayer} />
      
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-title">
          <span>Legend</span>
          <Info size={16} />
        </div>
        <div className="legend-list">
            <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                <span style={{ fontSize: '0.75rem' }}>Major Roads</span>
            </div>
            <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#10b981' }}></div>
                <span style={{ fontSize: '0.75rem' }}>Green Areas</span>
            </div>
            <div className="legend-item">
                <div className="color-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                <span style={{ fontSize: '0.75rem' }}>Buildings</span>
            </div>
        </div>
      </div>

      <div className="sidebar-section" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
        <div className="sidebar-title" style={{ marginBottom: 0 }}>
          <span>Settings</span>
          <Settings size={16} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
