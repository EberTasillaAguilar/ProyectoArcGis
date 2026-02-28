import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, ZoomIn, ZoomOut, Layers, Maximize, Compass as CompassIcon } from 'lucide-react';

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// Custom Compass Component
// Custom Ornate Compass Component
const Compass = () => {
    return (
        <div className="compass-widget animated" style={{ animationDelay: '0.6s' }}>
            <div className="compass-ornate">
                <div className="compass-n-label">N</div>
                <div className="compass-arrow-north"></div>
                <div className="compass-arrow-south"></div>
            </div>
        </div>
    );
};

const Map = ({ layers, center = [4.6, -74.0], zoom = 12, theme = 'dark' }) => {
    const [activeLayers, setActiveLayers] = useState([]);

    useEffect(() => {
        setActiveLayers(layers.filter(l => l.visible));
    }, [layers]);

    const onEachFeature = (feature, layer) => {
        if (feature.properties) {
            const props = feature.properties;
            const popupBg = theme === 'dark' ? '#1e293b' : '#ffffff';
            const popupText = theme === 'dark' ? '#ffffff' : '#1e293b';
            const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

            let content = `<div style="background: ${popupBg}; color: ${popupText}; font-family: 'Inter', sans-serif; min-width: 180px; padding: 8px; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #3b82f6; border-bottom: 2px solid ${borderColor}; padding-bottom: 6px; font-weight: 700;">
                    ${props.Nombre || props.name || 'Detalles de Capa'}
                </h3>
                <div style="font-size: 13px; display: grid; gap: 6px; opacity: 0.9;">`;

            Object.entries(props).forEach(([key, value]) => {
                if (key !== 'FID' && value !== 0 && value !== null && key !== 'color' && key !== 'Nombre' && key !== 'name') {
                    content += `<div><b style="color: ${theme === 'dark' ? '#94a3b8' : '#64748b'}">${key}:</b> ${value}</div>`;
                }
            });

            content += `</div></div>`;
            layer.bindPopup(content, {
                className: 'custom-popup'
            });
        }
    };

    const geojsonStyle = (feature) => {
        const layerInfo = layers.find(l => l.data && l.data.features.some(f => f === feature)) || {};
        const isLine = feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';

        let finalColor = layerInfo.color || '#3b82f6';

        if (theme === 'dark') {
            if (finalColor === '#000000' || finalColor === 'black' || finalColor === '#222222') {
                finalColor = '#f8fafc';
            }
        } else {
            if (finalColor === '#ffffff' || finalColor === 'white' || finalColor === '#f8fafc') {
                finalColor = '#1e293b';
            }
        }

        return {
            fillColor: layerInfo.color || '#3b82f6',
            weight: isLine ? 3.5 : 2,
            opacity: 1,
            color: finalColor,
            dashArray: isLine ? '' : '3',
            fillOpacity: isLine ? 0 : 0.65
        };
    };

    const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const lightTiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    return (
        <div className="map-view">
            <div className="widget search-widget animated" style={{ animationDelay: '0.2s' }}>
                <Search size={18} color={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                <input type="text" placeholder="Buscar ubicaciones o capas..." style={{ color: "var(--text-main)" }} />
            </div>

            <div className="view-controls">
                <div className="control-btn" title="Acercar"><ZoomIn size={20} /></div>
                <div className="control-btn" title="Alejar"><ZoomOut size={20} /></div>
                <div className="control-btn" title="Pantalla Completa"><Maximize size={20} /></div>
            </div>

            <Compass />

            <div className="widget legend-widget animated" style={{ animationDelay: '0.4s' }}>
                <div className="sidebar-title">
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>Leyenda de Capas</span>
                    <Layers size={14} />
                </div>
                <div className="legend-list">
                    {layers.map(l => (
                        <div key={l.id} className="legend-item" style={{ opacity: l.visible ? 1 : 0.4 }}>
                            <div className="color-dot" style={{ backgroundColor: l.color }}></div>
                            <span style={{ fontSize: '0.8rem', color: "var(--text-main)" }}>{l.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={theme === 'dark' ? darkTiles : lightTiles}
                />
                <MapController center={center} zoom={zoom} />
                <ScaleControl position="bottomleft" imperial={false} />

                {activeLayers.map((layer) => (
                    layer.data && (
                        <GeoJSON
                            key={`${layer.id}-${JSON.stringify(layer.data).length}-${theme}`}
                            data={layer.data}
                            style={geojsonStyle}
                            onEachFeature={onEachFeature}
                        />
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
