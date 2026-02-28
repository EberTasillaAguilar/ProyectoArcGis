import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, ZoomIn, ZoomOut, Layers, Maximize } from 'lucide-react';

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const Map = ({ layers, center = [4.6, -74.0], zoom = 12, theme = 'dark' }) => {
    const [activeLayers, setActiveLayers] = useState([]);

    useEffect(() => {
        setActiveLayers(layers.filter(l => l.visible));
    }, [layers]);

    const onEachFeature = (feature, layer) => {
        if (feature.properties) {
            const props = feature.properties;
            let content = `<div style="color: #1e293b; font-family: 'Inter', sans-serif; min-width: 150px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                    ${props.Nombre || props.name || 'Detalles'}
                </h3>
                <div style="font-size: 12px; display: grid; gap: 4px;">`;

            // Add all available properties dynamically
            Object.entries(props).forEach(([key, value]) => {
                if (key !== 'FID' && value !== 0 && value !== null && key !== 'color') {
                    content += `<div><b>${key}:</b> ${value}</div>`;
                }
            });

            content += `</div></div>`;
            layer.bindPopup(content);
        }
    };

    const geojsonStyle = (feature) => {
        const layerInfo = layers.find(l => l.data && l.data.features.some(f => f === feature)) || {};
        const isLine = feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';

        return {
            fillColor: layerInfo.color || '#3b82f6',
            weight: isLine ? 3 : 2,
            opacity: 1,
            color: layerInfo.color || 'white',
            dashArray: isLine ? '' : '3',
            fillOpacity: isLine ? 0 : 0.6
        };
    };

    const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const lightTiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    return (
        <div className="map-view">
            <div className="widget search-widget animated" style={{ animationDelay: '0.2s' }}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Search for locations, layers..." />
            </div>

            <div className="view-controls">
                <div className="control-btn" title="Zoom In"><ZoomIn size={20} /></div>
                <div className="control-btn" title="Zoom Out"><ZoomOut size={20} /></div>
                <div className="control-btn" title="Full Screen"><Maximize size={20} /></div>
            </div>

            <div className="widget legend-widget animated" style={{ animationDelay: '0.4s' }}>
                <div className="sidebar-title">
                    <span>Layer Legend</span>
                    <Layers size={14} />
                </div>
                <div className="legend-list">
                    {layers.map(l => (
                        <div key={l.id} className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: l.color }}></div>
                            <span style={{ fontSize: '0.75rem' }}>{l.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={theme === 'dark' ? darkTiles : lightTiles}
                />
                <MapController center={center} zoom={zoom} />

                {activeLayers.map((layer) => (
                    layer.data && (
                        <GeoJSON
                            key={`${layer.id}-${JSON.stringify(layer.data).length}`}
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
