import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { Globe, Database, Menu, Bell, User, Map as MapIcon } from 'lucide-react';
import './index.css';

function App() {
  const [activeMap, setActiveMap] = useState(1);
  const [layers, setLayers] = useState([]);
  const [center, setCenter] = useState([-5.0, -79.0]); // Northern Peru
  const [zoom, setZoom] = useState(7);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [isNetworkMode, setIsNetworkMode] = useState(false);
  const [networkPoints, setNetworkPoints] = useState({ start: null, end: null });
  const [selectedFeature, setSelectedFeature] = useState(null); // { layerId, feature }
  const [filters, setFilters] = useState({ district: '', province: '' });

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const toggleEditMode = () => setIsEditMode(prev => !prev);
  const toggleNetworkMode = () => {
    setIsEditMode(false);
    setIsNetworkMode(prev => !prev);
    setNetworkPoints({ start: null, end: null });
    setRouteResult(null);
  };

  const updateLayerData = (layerId, newData) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, data: newData, lastUpdate: Date.now() } : l));
  };

  const updateFeatureProperties = (layerId, featureGeometryString, newProperties) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id !== layerId || !layer.data) return layer;
      const newFeatures = layer.data.features.map(f => {
        if (JSON.stringify(f.geometry) === featureGeometryString) {
          return { ...f, properties: { ...f.properties, ...newProperties } };
        }
        return f;
      });
      return { ...layer, data: { ...layer.data, features: newFeatures }, lastUpdate: Date.now() };
    }));
  };

  // Clear results when switching maps
  useEffect(() => {
    setAnalysisResult(null);
    setIsEditMode(false);
    setActiveLayerId(null);
    setRouteResult(null);
    setIsNetworkMode(false);
    setNetworkPoints({ start: null, end: null });
    setSelectedFeature(null);
    setFilters({ district: '', province: '' });
  }, [activeMap]);

  // Load GeoJSON data based on map selection
  useEffect(() => {
    const loadMapData = async () => {
      let mapLayers = [];

      switch (activeMap) {
        case 1:
          mapLayers = [
            { id: 101, name: 'Zona Norte Perú', visible: true, color: '#6366f1', url: `/maps/Map1/zona_norte_peru.json` },
            { id: 102, name: 'Ríos Zona Norte', visible: true, color: '#3b82f6', url: `/maps/Map1/rios_zona_norte.json` },
            { id: 103, name: 'Rutas Afectadas', visible: true, color: '#f59e0b', url: `/maps/Map1/rutas_afectadas_peru.json` },
            { id: 104, name: 'Buffer Ríos Norte', visible: true, color: '#10b981', url: `/maps/Map1/buffer_norte_rios.json` },
            { id: 105, name: 'Rutas Zona Norte', visible: false, color: '#ef4444', url: `/maps/Map1/ruta_zonas_norte_opt.json` }
          ];
          break;
        case 2:
          mapLayers = [
            { id: 201, name: 'Zona Norte Perú', visible: true, color: '#6366f1', url: `/maps/Map2/zona_norte_peru.json` },
            { id: 202, name: 'Ríos Zona Norte', visible: true, color: '#3b82f6', url: `/maps/Map2/rios_zona_norte.json` },
            { id: 203, name: 'Rutas Principales Afectadas', visible: true, color: '#ef4444', url: `/maps/Map2/rutas_principales_afectadas_zona_norte.json` },
            { id: 204, name: 'Red Vial Principal', visible: false, color: '#f59e0b', url: `/maps/Map2/rutas_principales_zona_norte.json` },
            { id: 205, name: 'Buffer Ríos Norte', visible: false, color: '#10b981', url: `/maps/Map2/buffer_norte_rios.json` },
          ];
          break;
        case 3:
          mapLayers = [
            { id: 301, name: 'Rutas Logísticas', visible: true, color: '#f59e0b', url: `/maps/Map3/red_rutas_logisticas.json` },
            { id: 302, name: 'Distritos Afectados', visible: true, color: '#ef4444', url: `/maps/Map3/distritos_logisticos_afectados.json` },
            { id: 303, name: 'Distritos Norte', visible: false, color: '#6366f1', url: `/maps/Map3/distritos.json` }
          ];
          break;
        case 5:
          mapLayers = [
            { id: 501, name: 'Zona Norte Perú', visible: false, color: '#94a3b8', url: `/maps/Map5/zona_norte_peru_utm.json` },
            { id: 502, name: 'Distritos Norte', visible: true, color: '#6366f1', url: `/maps/Map5/zona_norte_con_distritos_utm.json` },
            { id: 503, name: 'Capitales de Provincia', visible: false, color: '#8b5cf6', url: `/maps/Map5/capitales_provincia_utm.json` },
            { id: 504, name: 'Rutas Afectadas', visible: false, color: '#ef4444', url: `/maps/Map5/rutas_afectadas_zona_norte_utm.json` },
            { id: 505, name: 'Bases Maquinarias', visible: true, color: '#f59e0b', url: `/maps/Map5/bases_maquinarias.json` },
            { id: 506, name: 'Rutas Maquinaria', visible: true, color: '#10b981', url: `/maps/Map5/resultado_rutas_maquinaria.json` }
          ];
          break;
        case 9:
          mapLayers = [
            { id: 901, name: 'Establecimientos Salud', visible: true, color: '#ef4444', url: `/maps/Map4/centros_salud_opt.json` },
            { id: 902, name: 'Rutas Afectadas Salud', visible: true, color: '#f59e0b', url: `/maps/Map4/rutas_afectadas_opt.json` },
            { id: 903, name: 'Rutas de Llegada', visible: true, color: '#10b981', url: `/maps/Map4/rutas_afectadas_llegada_salud_opt.json` },
            { id: 904, name: 'Áreas de Servicio', visible: false, color: '#3b82f6', url: `/maps/Map4/areas_servicio_opt.json` },
            { id: 905, name: 'Zona Norte Perú', visible: false, color: '#94a3b8', url: `/maps/Map1/zona_norte_peru.json` }
          ];
          break;
        default:
          mapLayers = [];
      }

      const updatedLayers = await Promise.all(mapLayers.map(async (layer) => {
        try {
          // Busta la caché para asegurar que se carga el JSON recién convertido
          const fetchUrl = `${layer.url}?t=${new Date().getTime()}`;
          const response = await fetch(fetchUrl);
          if (response.ok) {
            const data = await response.json();
            return { ...layer, data };
          }
        } catch (error) {
          console.warn(`No se pudo cargar geojson para ${layer.name}:`, error);
        }
        return { ...layer, data: null };
      }));

      setLayers(updatedLayers);
    };

    loadMapData();
  }, [activeMap]);

  const handleToggleLayer = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleMapSelect = (id) => {
    setActiveMap(id);
    // Northern Peru region center
    setCenter([-5.0, -79.0]);
    setZoom(7);

    // Auto close sidebar on mobile after map selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const accentColor = theme === 'dark' ? '#60a5fa' : '#2563eb';

  return (
    <div className="app-container" data-theme={theme}>
      <header style={{ borderBottom: `2px solid ${accentColor}33` }}>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <Globe className="animated" style={{ color: accentColor }} size={28} />
          <span className="title-responsive" style={{ textTransform: 'uppercase' }}>
            GEO-INTERFACE <span style={{ fontWeight: 400, opacity: 0.5 }}>PRO</span>
          </span>
        </div>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="control-btn"
            onClick={toggleTheme}
            title="Cambiar Tema"
            style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', width: '45px', height: '45px', borderRadius: '12px' }}>
            <Globe size={22} style={{ color: accentColor, transform: theme === 'light' ? 'rotate(180deg)' : 'none', transition: 'all 0.5s ease' }} />
          </div>

          {/* Mobile indicator for sidebar status */}
          <div className="control-btn"
            onClick={toggleSidebar}
            id="mobile-menu-btn"
            style={{ background: isSidebarOpen ? accentColor : 'rgba(255,255,255,0.1)', color: isSidebarOpen ? 'white' : 'inherit', width: '45px', height: '45px', borderRadius: '12px' }}>
            <Menu size={22} />
          </div>

          <div className="control-btn" style={{ background: 'transparent', border: 'none', display: 'flex' }}><Bell size={20} /></div>
          <div className="control-btn" style={{ background: 'transparent', border: 'none', display: 'flex' }}><User size={20} /></div>
        </div>
      </header>

      <div className="secondary-header" style={{ background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }}>
        <div className="label-badge" style={{ backgroundColor: `${accentColor}22`, padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', color: accentColor, fontWeight: 700, border: `1px solid ${accentColor}44` }}>
          Proyecto: Planificación Cajamarca
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.4 }}>/</div>
        <div style={{ fontSize: '0.9rem', opacity: 1, fontWeight: 700, color: 'var(--text-main)' }}>
          {activeMap === 1
            ? 'Rutas Afectadas por Inundación'
            : activeMap === 2
              ? 'Carreteras Principales Afectadas'
              : activeMap === 3
                ? 'Distritos Afectados en Logística'
                : activeMap === 5
                  ? 'Gestión de Maquinarias'
                  : activeMap === 9
                    ? 'Alcance de Centros de Salud'
                    : 'Mapa'}
        </div>
      </div>

      <div className="main-content">
        <Sidebar
          activeMap={activeMap}
          onMapSelect={handleMapSelect}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          isOpen={isSidebarOpen}
          analysisResult={analysisResult}
          setAnalysisResult={setAnalysisResult}
          isEditMode={isEditMode}
          toggleEditMode={toggleEditMode}
          activeLayerId={activeLayerId}
          setActiveLayerId={setActiveLayerId}
          routeResult={routeResult}
          setRouteResult={setRouteResult}
          isNetworkMode={isNetworkMode}
          toggleNetworkMode={toggleNetworkMode}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
          updateFeatureProperties={updateFeatureProperties}
          filters={filters}
          setFilters={setFilters}
        />
        <Map
          layers={layers}
          center={center}
          zoom={zoom}
          theme={theme}
          analysisResult={analysisResult}
          isEditMode={isEditMode}
          updateLayerData={updateLayerData}
          activeLayerId={activeLayerId}
          routeResult={routeResult}
          isNetworkMode={isNetworkMode}
          networkPoints={networkPoints}
          setNetworkPoints={setNetworkPoints}
          setRouteResult={setRouteResult}
          setSelectedFeature={setSelectedFeature}
          selectedFeature={selectedFeature}
          filters={filters}
        />
      </div>



      <div className="status-bar" style={{ height: '36px', background: 'var(--bg-sidebar)', borderTop: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>LAT: {center[0].toFixed(5)}</span>
          <span>LON: {center[1].toFixed(5)}</span>
          <span>EPSG: 4326 (WGS84)</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }}></div>
          SISTEMA ACTIVO
        </div>
      </div>
    </div>
  );
}

export default App;
