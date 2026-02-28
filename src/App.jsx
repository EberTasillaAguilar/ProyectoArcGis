import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { Globe, Map as MapIcon, Database, Terminal, Menu, Bell, User } from 'lucide-react';
import './index.css';

function App() {
  const [activeMap, setActiveMap] = useState(1);
  const [layers, setLayers] = useState([]);
  const [center, setCenter] = useState([-7.165, -78.508]); // Cajamarca, Peru
  const [zoom, setZoom] = useState(16);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsSidebarOpen(prev => !isSidebarOpen);

  // Load GeoJSON data based on map selection
  useEffect(() => {
    const loadMapData = async () => {
      let mapLayers = [];

      switch (activeMap) {
        case 1:
          mapLayers = [
            { id: 101, name: 'Parques', visible: true, color: '#10b981', url: `/maps/Map1/prueba_wgs84.json` },
            { id: 102, name: 'Calles de Cajamarca', visible: true, color: '#000000', url: `/maps/Map1/calles_wgs84.json` },
            { id: 103, name: 'Admin Boundaries', visible: false, color: '#3b82f6', url: `/maps/Map1/layer1.json` }
          ];
          break;
        case 2:
          mapLayers = [
            { id: 201, name: 'Parks & Recreation', visible: true, color: '#10b981', url: `/maps/Map2/layer1.json` },
            { id: 202, name: 'Hydrology', visible: true, color: '#3b82f6', url: `/maps/Map2/layer2.json` }
          ];
          break;
        case 3:
          mapLayers = [
            { id: 301, name: 'Utility Networks', visible: true, color: '#f59e0b', url: `/maps/Map3/layer1.json` }
          ];
          break;
        case 4:
          mapLayers = [
            { id: 401, name: 'Demographics', visible: true, color: '#8b5cf6', url: `/maps/Map4/layer1.json` }
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
          console.warn(`Could not load geojson for ${layer.name}:`, error);
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
  };

  return (
    <div className="app-container" data-theme={theme}>
      <header>
        <div className="logo">
          <Globe className="animated" style={{ color: '#3b82f6' }} />
          <span>GEO-INTERFACE <span style={{ fontWeight: 400, opacity: 0.6 }}>PRO</span></span>
        </div>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="control-btn" onClick={toggleTheme} title="Cambiar Tema">
            <Globe size={18} />
          </div>
          <div className="control-btn" style={{ background: 'transparent', border: 'none' }}><Bell size={18} /></div>
          <div className="control-btn" style={{ background: 'transparent', border: 'none' }}><Database size={18} /></div>
          <div className="control-btn" style={{ background: 'transparent', border: 'none' }}><User size={18} /></div>
          <div className="control-btn" onClick={toggleSidebar} style={{ display: 'none', marginLeft: '10px' }} id="mobile-menu-btn">
            <Menu size={22} />
          </div>
        </div>
      </header>

      <div className="secondary-header">
        <div className="label-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', color: '#60a5fa' }}>
          Project: Regional Planning
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>/</div>
        <div style={{ fontSize: '0.875rem', opacity: 1, fontWeight: 500 }}>
          View: {activeMap === 1 ? 'City Infrastructure' : activeMap === 2 ? 'Environmental' : activeMap === 3 ? 'Utilities' : 'Sociocultural'}
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

      <div className="status-bar" style={{ height: '32px', background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>LAT: {center[0].toFixed(4)}</span>
          <span>LON: {center[1].toFixed(4)}</span>
          <span>EPSG: 4326</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <div>READY</div>
      </div>
    </div>
  );
}

export default App;
