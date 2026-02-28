import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { Globe, Database, Menu, Bell, User, Map as MapIcon } from 'lucide-react';
import './index.css';

function App() {
  const [activeMap, setActiveMap] = useState(1);
  const [layers, setLayers] = useState([]);
  const [center, setCenter] = useState([-7.165, -78.508]); // Cajamarca, Peru
  const [zoom, setZoom] = useState(16);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Load GeoJSON data based on map selection
  useEffect(() => {
    const loadMapData = async () => {
      let mapLayers = [];

      switch (activeMap) {
        case 1:
          mapLayers = [
            { id: 101, name: 'Parques', visible: true, color: '#10b981', url: `/maps/Map1/prueba_wgs84.json` },
            { id: 102, name: 'Calles de Cajamarca', visible: true, color: '#000000', url: `/maps/Map1/calles_wgs84.json` },
            { id: 103, name: 'Límites Administrativos', visible: false, color: '#3b82f6', url: `/maps/Map1/layer1.json` }
          ];
          break;
        case 2:
          mapLayers = [
            { id: 201, name: 'Parques y Recreación', visible: true, color: '#10b981', url: `/maps/Map2/layer1.json` },
            { id: 202, name: 'Hidrología', visible: true, color: '#3b82f6', url: `/maps/Map2/layer2.json` }
          ];
          break;
        case 3:
          mapLayers = [
            { id: 301, name: 'Red de Servicios', visible: true, color: '#f59e0b', url: `/maps/Map3/layer1.json` }
          ];
          break;
        case 4:
          mapLayers = [
            { id: 401, name: 'Demografía', visible: true, color: '#8b5cf6', url: `/maps/Map4/layer1.json` }
          ];
          break;
        default:
          mapLayers = [];
      }

      const updatedLayers = await Promise.all(mapLayers.map(async (layer) => {
        try {
          const response = await fetch(layer.url);
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
    if (id === 1) {
      setCenter([-7.165, -78.508]);
      setZoom(16);
    } else {
      setCenter([4.61, -74.05]);
      setZoom(13);
    }
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
          {activeMap === 1 ? 'Infraestructura Urbana' : activeMap === 2 ? 'Ambiental' : activeMap === 3 ? 'Servicios Públicos' : 'Mapa Social'}
        </div>
      </div>

      <div className="main-content">
        <Sidebar
          activeMap={activeMap}
          onMapSelect={handleMapSelect}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          isOpen={isSidebarOpen}
        />
        <Map layers={layers} center={center} zoom={zoom} theme={theme} />
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
