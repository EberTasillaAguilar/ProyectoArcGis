import React, { useState, useEffect } from 'react';
import { Map as MapIcon, Layers, Info, Settings, Search, Check, Zap, Trash2, Edit3, MousePointer, Share2, Navigation, Save, X } from 'lucide-react';
import * as turf from '@turf/turf';
import PathFinder from 'geojson-path-finder';

const MapSelector = ({ activeMap, onMapSelect }) => {
  const maps = [
    { id: 1, name: 'Rutas Inundación', icon: <MapIcon size={22} /> },
    { id: 2, name: 'Carreteras Afectadas', icon: <MapIcon size={22} /> },
    { id: 3, name: 'Logística Distritos', icon: <MapIcon size={22} /> },
    { id: 9, name: 'Centros de Salud', icon: <Zap size={22} /> },
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
            <span className="text-responsive" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{map.name}</span>
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
      </div>
    </div>
  );
};

const AttributeEditor = ({ selectedFeature, setSelectedFeature, updateFeatureProperties }) => {
  const [localProps, setLocalProps] = useState({});

  useEffect(() => {
    if (selectedFeature) {
      setLocalProps(selectedFeature.feature.properties || {});
    }
  }, [selectedFeature]);

  if (!selectedFeature) return null;

  const handleSave = () => {
    updateFeatureProperties(
      selectedFeature.layerId,
      JSON.stringify(selectedFeature.feature.geometry),
      localProps
    );
    setSelectedFeature(null);
  };

  return (
    <div className="sidebar-section attribute-editor-card" style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
      <div className="sidebar-title">
        <span style={{ fontWeight: 800, color: '#f59e0b' }}>Atributos de Entidad</span>
        <button onClick={() => setSelectedFeature(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
        {Object.entries(localProps).map(([key, value]) => (
          <div key={key} style={{ display: 'grid', gap: '4px' }}>
            <label style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>{key}:</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => setLocalProps(prev => ({ ...prev, [key]: e.target.value }))}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'var(--bg-sidebar)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{
          marginTop: '15px',
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Save size={16} /> GUARDAR ATRIBUTOS
      </button>
    </div>
  );
};

// NetworkAnalysis desactivado — no se muestra en ningún mapa
const NetworkAnalysis = () => null;

// CustomEditor desactivado
const CustomEditor = () => null;

// SpatialAnalysis (Buffer) desactivado
const SpatialAnalysis = () => null;

const DataFilter = ({ layers, activeMap, filters, setFilters }) => {
  if (activeMap !== 1 && activeMap !== 2 && activeMap !== 3 && activeMap !== 9) return null;

  const selectStyle = { padding: '10px', borderRadius: '10px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' };
  const inputStyle = { padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-sidebar)', color: 'var(--text-main)', fontSize: '0.85rem' };
  const clearBtn = { padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' };
  const hasFilter = filters.district || filters.province;

  // ── MAPAS 1 y 2: dropdown de Departamentos (campo DEPARTAMEN) ──────────────
  if (activeMap === 1 || activeMap === 2) {
    const depts = new Set();
    layers.forEach(layer => {
      if (layer.visible && layer.data && layer.data.features) {
        layer.data.features.forEach(f => {
          const dep = (f.properties || {}).DEPARTAMEN;
          if (dep && typeof dep === 'string') depts.add(dep.trim());
        });
      }
    });
    const sortedDepts = Array.from(depts).filter(Boolean).sort();

    return (
      <div className="sidebar-section" style={{ borderLeft: '4px solid #3b82f6' }}>
        <div className="sidebar-title">
          <span className="text-responsive" style={{ fontWeight: 800, color: '#3b82f6' }}>Filtro por Zona</span>
          <Search size={18} color="#3b82f6" />
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          <select
            value={filters.district}
            onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value, province: '' }))}
            style={selectStyle}
          >
            <option value="">Todos los Departamentos...</option>
            {sortedDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            type="text"
            placeholder="O escribir departamento..."
            value={filters.district && !sortedDepts.includes(filters.district) ? filters.district : ''}
            onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value, province: '' }))}
            style={inputStyle}
          />
          {hasFilter && (
            <button onClick={() => setFilters({ district: '', province: '' })} style={clearBtn}>
              ✕ Limpiar filtro
            </button>
          )}
          <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>
            Selecciona un departamento para acercar el mapa.
          </p>
        </div>
      </div>
    );
  }

  // ── MAPAS 3 y 9: dropdowns de Provincia y Distrito ─────────────────────────
  const provinces = new Set();
  const districts = new Set();

  layers.forEach(layer => {
    if (layer.visible && layer.data && layer.data.features) {
      layer.data.features.forEach(f => {
        const p = f.properties || {};
        const prov = p.PROVINCIA || p.provincia || p.Provincia || p.NOMBPROV;
        const dist = p.DISTRITO || p.distrito || p.Distrito || p.NOMBDIST;
        if (prov && typeof prov === 'string') provinces.add(prov.trim());
        if (dist && typeof dist === 'string') districts.add(dist.trim());
      });
    }
  });

  const sortedProvinces = Array.from(provinces).filter(Boolean).sort();
  const sortedDistricts = Array.from(districts).filter(Boolean).sort();

  return (
    <div className="sidebar-section" style={{ borderLeft: '4px solid #3b82f6' }}>
      <div className="sidebar-title">
        <span className="text-responsive" style={{ fontWeight: 800, color: '#3b82f6' }}>Filtro por Zona</span>
        <Search size={18} color="#3b82f6" />
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        <select
          value={filters.province}
          onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))}
          style={selectStyle}
        >
          <option value="">Todas las Provincias...</option>
          {sortedProvinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filters.district}
          onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          style={selectStyle}
        >
          <option value="">Todos los Distritos...</option>
          {sortedDistricts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <input
          type="text"
          placeholder="O buscar por nombre..."
          value={filters.district && !sortedDistricts.includes(filters.district) ? filters.district : ''}
          onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          style={inputStyle}
        />
        {hasFilter && (
          <button onClick={() => setFilters({ district: '', province: '' })} style={clearBtn}>
            ✕ Limpiar filtro
          </button>
        )}
        <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>
          Selecciona una zona para acercar el mapa automáticamente.
        </p>
      </div>
    </div>
  );
};

const Sidebar = ({
  activeMap, onMapSelect, layers, onToggleLayer, isOpen,
  analysisResult, setAnalysisResult, isEditMode, toggleEditMode,
  activeLayerId, setActiveLayerId, routeResult, setRouteResult,
  isNetworkMode, toggleNetworkMode, selectedFeature, setSelectedFeature,
  updateFeatureProperties, filters, setFilters
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <MapSelector activeMap={activeMap} onMapSelect={onMapSelect} />
      <LayerControl layers={layers} onToggleLayer={onToggleLayer} />

      <DataFilter
        layers={layers}
        activeMap={activeMap}
        filters={filters}
        setFilters={setFilters}
      />

      <AttributeEditor
        selectedFeature={selectedFeature}
        setSelectedFeature={setSelectedFeature}
        updateFeatureProperties={updateFeatureProperties}
      />

      <NetworkAnalysis
        layers={layers} activeMap={activeMap} routeResult={routeResult}
        setRouteResult={setRouteResult} isNetworkMode={isNetworkMode} toggleNetworkMode={toggleNetworkMode}
      />

      <CustomEditor
        layers={layers} activeLayerId={activeLayerId} setActiveLayerId={setActiveLayerId}
        isEditMode={isEditMode} toggleEditMode={toggleEditMode} activeMap={activeMap}
      />

      <SpatialAnalysis
        layers={layers} activeMap={activeMap} setAnalysisResult={setAnalysisResult} analysisResult={analysisResult}
      />

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-title"><span style={{ fontWeight: 800 }}>Información</span><Info size={18} /></div>
        <div className="legend-list">
          <div className="legend-item">
            <div className="color-dot" style={{ backgroundColor: '#60a5fa' }}></div>
            <span style={{ fontSize: '0.85rem' }}>Vías</span>
          </div>
          <div className="legend-item">
            <div className="color-dot" style={{ backgroundColor: '#10b981' }}></div>
            <span style={{ fontSize: '0.85rem' }}>Verdes</span>
          </div>
          {routeResult && <div className="legend-item"><div className="color-dot" style={{ backgroundColor: '#10b981', border: '2px solid white' }}></div><span style={{ color: '#10b981', fontWeight: 700 }}>Ruta</span></div>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
