import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, ScaleControl, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';
import { Search, ZoomIn, ZoomOut, Layers, Maximize } from 'lucide-react';
import PathFinder from 'geojson-path-finder';

// Paleta de colores para los departamentos de la zona norte
const DEPARTAMENTO_COLORS = {
    'AMAZONAS': '#f59e0b',
    'CAJAMARCA': '#8b5cf6',
    'LA LIBERTAD': '#10b981',
    'LAMBAYEQUE': '#3b82f6',
    'PIURA': '#ef4444',
    'SAN MARTIN': '#06b6d4',
    'TUMBES': '#f97316',
};

const getDepartamentoColor = (properties) => {
    const dep = (properties?.DEPARTAMEN || '').trim().toUpperCase();
    return DEPARTAMENTO_COLORS[dep] || '#6366f1';
};

// ============================================================
// Escala de verde para Rutas Logísticas (Time_total en horas)
// 5 intervalos: verde oscuro (poco retraso) → verde claro (mucho retraso)
// Rango real del campo: 0 – ~160 horas
// ============================================================
const RUTAS_LOG_INTERVALS = [
    { min: 0, max: 10, color: '#14532d', label: '0 – 10 h' },  // Verde muy oscuro
    { min: 10, max: 30, color: '#166534', label: '10 – 30 h' },  // Verde oscuro
    { min: 30, max: 60, color: '#15803d', label: '30 – 60 h' },  // Verde medio
    { min: 60, max: 100, color: '#4ade80', label: '60 – 100 h' },  // Verde claro
    { min: 100, max: Infinity, color: '#bbf7d0', label: '> 100 h' },  // Verde muy claro
];

const getRutaLogColor = (timeTotal) => {
    const t = parseFloat(timeTotal) || 0;
    for (const { min, max, color } of RUTAS_LOG_INTERVALS) {
        if (t >= min && t < max) return color;
    }
    return '#bbf7d0';
};

// ============================================================
// Colores por tipo de carretera (fclass) — Mapa 2
// ============================================================
const FCLASS_COLORS = {
    motorway: { color: '#dc2626', label: 'Autopista' },
    motorway_link: { color: '#dc2626', label: 'Autopista (ramal)' },
    trunk: { color: '#f97316', label: 'Carretera Principal' },
    trunk_link: { color: '#f97316', label: 'Principal (ramal)' },
    primary: { color: '#eab308', label: 'Carretera Primaria' },
    primary_link: { color: '#eab308', label: 'Primaria (ramal)' },
    secondary: { color: '#22c55e', label: 'Carretera Secundaria' },
    tertiary: { color: '#64748b', label: 'Carretera Terciaria' },
};
const FCLASS_DEFAULT = '#94a3b8';

const getFclassColor = (fclass) => (FCLASS_COLORS[fclass]?.color || FCLASS_DEFAULT);

// Componente interno para controles de zoom que accede al mapa
const ZoomController = () => {
    const map = useMap();
    return (
        <div className="view-controls" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
                className="control-btn"
                title="Acercar"
                onClick={() => map.zoomIn()}
                style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
                <ZoomIn size={18} />
            </div>
            <div
                className="control-btn"
                title="Alejar"
                onClick={() => map.zoomOut()}
                style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
                <ZoomOut size={18} />
            </div>
        </div>
    );
};

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapController = ({ center, zoom, isEditMode, activeLayerId, layers, updateLayerData, isNetworkMode, networkPoints, setNetworkPoints, setRouteResult, filters }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    // AUTO-ZOOM on Filter
    useEffect(() => {
        if (!filters || (!filters.district && !filters.province) || !map) return;

        const dTerm = filters.district.toLowerCase();
        const pTerm = filters.province.toLowerCase();
        let bounds = L.latLngBounds([]);
        let found = false;

        layers.forEach(layer => {
            if (layer.visible && layer.data && layer.data.features) {
                layer.data.features.forEach(feature => {
                    const p = feature.properties || {};
                    // Incluir DEPARTAMEN para el filtro del mapa 1
                    const name = (p.Nombre || p.name || p.n || p.NOMBDIST || p.DISTRITO || p.Distrito || p.DEPARTAMEN || '').toLowerCase();
                    const prov = (p.NOMBPROV || p.Provincia || p.PROVINCIA || p.provincia || '').toLowerCase();

                    const dMatch = !dTerm || name.includes(dTerm);
                    const pMatch = !pTerm || prov.includes(pTerm);

                    if (dMatch && pMatch && (dTerm || pTerm)) {
                        const geoLayer = L.geoJSON(feature);
                        const fBounds = geoLayer.getBounds();
                        if (fBounds.isValid()) {
                            bounds.extend(fBounds);
                            found = true;
                        }
                    }
                });
            }
        });

        if (found && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
        }
    }, [filters.district, filters.province, layers, map]);

    // Handle Network Analysis Clicks
    useEffect(() => {
        if (!isNetworkMode) return;

        const onMapClick = (e) => {
            const { lat, lng } = e.latlng;
            if (!networkPoints.start) {
                setNetworkPoints({ start: [lng, lat], end: null });
            } else if (!networkPoints.end) {
                setNetworkPoints(prev => ({ ...prev, end: [lng, lat] }));
                calculateRoute([networkPoints.start[0], networkPoints.start[1]], [lng, lat]);
            } else {
                setNetworkPoints({ start: [lng, lat], end: null });
                setRouteResult(null);
            }
        };

        const calculateRoute = (start, end) => {
            const streetLayer = layers.find(l => l.data && l.name.toLowerCase().includes('calle'));
            if (!streetLayer) return alert("No hay capa de vías.");
            try {
                const pathFinder = new PathFinder(streetLayer.data, { precision: 0.0001 });
                const path = pathFinder.find(
                    { type: 'Feature', geometry: { type: 'Point', coordinates: start } },
                    { type: 'Feature', geometry: { type: 'Point', coordinates: end } }
                );
                if (path) {
                    setRouteResult({ type: 'Feature', geometry: { type: 'LineString', coordinates: path.path }, weight: path.weight });
                } else {
                    alert("Sin ruta en la red.");
                }
            } catch (err) { alert("Error de ruteo"); }
        };

        map.on('click', onMapClick);
        return () => map.off('click', onMapClick);
    }, [isNetworkMode, networkPoints, layers, setNetworkPoints, setRouteResult, map]);

    // Handle Geoman Controls
    useEffect(() => {
        if (!map) return;
        if (isEditMode && activeLayerId) {
            map.pm.addControls({ position: 'topleft', drawCircle: false, drawRectangle: true, drawPolygon: true, editMode: true, removalMode: true });
            map.on('pm:create', (e) => {
                const layer = e.layer;
                const targetLayer = layers.find(l => l.id === activeLayerId);
                if (targetLayer && targetLayer.data) {
                    const newData = { ...targetLayer.data, features: [...targetLayer.data.features, layer.toGeoJSON()] };
                    updateLayerData(activeLayerId, newData);
                }
                layer.remove();
            });
        } else {
            map.pm.removeControls();
            map.off('pm:create');
        }
        return () => { map.pm.removeControls(); map.off('pm:create'); };
    }, [map, isEditMode, activeLayerId, layers, updateLayerData]);

    return null;
};

// Leyenda de departamentos - se renderiza dentro del MapContainer como overlay absoluto
const LeyendaZonaNorte = ({ theme }) => {
    const entries = Object.entries(DEPARTAMENTO_COLORS);
    return (
        <div style={{
            position: 'absolute',
            bottom: '50px',
            right: '12px',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            minWidth: '150px',
            pointerEvents: 'none'
        }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', opacity: 0.5, marginBottom: '8px', textTransform: 'uppercase', color: theme === 'dark' ? '#fff' : '#000' }}>
                Zona Norte — Departamentos
            </div>
            {entries.map(([dep, color]) => (
                <div key={dep} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#e2e8f0' : '#1e293b', whiteSpace: 'nowrap' }}>
                        {dep.charAt(0) + dep.slice(1).toLowerCase().replace('an ', 'an ')}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Leyenda del mapa de Salud — Áreas Afectadas y Rutas
const LeyendaSalud = ({ theme, activeLayers }) => {
    const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const titleColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const bg = theme === 'dark' ? 'rgba(15,23,42,0.93)' : 'rgba(255,255,255,0.97)';
    const border = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    // Colores de Áreas de Servicio (igual que el style function)
    const areasRanges = [
        { label: '0 – 5 min', color: '#fecaca' },
        { label: '5 – 15 min', color: '#fca5a5' },
        { label: '15 – 30 min', color: '#f87171' },
        { label: '30 – 60 min', color: '#ef4444' },
        { label: '60 – 120 min', color: '#dc2626' },
        { label: '> 120 min', color: '#b91c1c' },
    ];

    // Colores de Rutas de Llegada (igual que el style function)
    const rutasRanges = [
        { label: '0 – 30 min', color: '#10b981' },
        { label: '30 – 60 min', color: '#84cc16' },
        { label: '60 – 90 min', color: '#06b6d4' },
        { label: '90 – 120 min', color: '#3b82f6' },
        { label: '> 120 min', color: '#1e3a8a' },
    ];

    const hasAreas = activeLayers.some(l => l.id === 904);
    const hasRutas = activeLayers.some(l => l.id === 903);
    const hasSalud = activeLayers.some(l => l.id === 901);
    const hasRutasAf = activeLayers.some(l => l.id === 902);

    return (
        <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '12px',
            zIndex: 1000,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            minWidth: '190px',
            maxWidth: '210px',
            pointerEvents: 'none'
        }}>
            {/* Título principal */}
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: titleColor, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🏥</span> Mapa de Salud
            </div>

            {/* Sección Áreas de Servicio */}
            {hasAreas && (
                <>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Áreas de Servicio (min)
                    </div>
                    {areasRanges.map(({ label, color }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '28px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>{label}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${border}`, margin: '8px 0' }} />
                </>
            )}

            {/* Sección Rutas de Llegada */}
            {hasRutas && (
                <>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Rutas de Llegada (min)
                    </div>
                    {rutasRanges.map(({ label, color }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '28px', height: '5px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>{label}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${border}`, margin: '8px 0' }} />
                </>
            )}

            {/* Símbolos de capas base */}
            <div style={{ fontSize: '10px', fontWeight: 700, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Capas
            </div>
            {hasSalud && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '8px', color: '#ef4444', fontWeight: 900, lineHeight: 1 }}>+</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>Centro de Salud</span>
                </div>
            )}
            {hasRutasAf && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '28px', height: '4px', background: '#f59e0b', borderRadius: '2px', flexShrink: 0, borderTop: '2px dashed #f59e0b', backgroundColor: 'transparent' }} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>Rutas Afectadas</span>
                </div>
            )}
        </div>
    );
};

// Leyenda del mapa de Logística — Rutas por Tiempo de Retraso
const LeyendaRutasLogisticas = ({ theme }) => {
    const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const titleColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const bg = theme === 'dark' ? 'rgba(15,23,42,0.93)' : 'rgba(255,255,255,0.97)';
    const border = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    return (
        <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '12px',
            zIndex: 1000,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            minWidth: '185px',
            pointerEvents: 'none'
        }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: titleColor, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🚚</span> Retraso Logístico
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>
                Rutas — Tiempo total (h)
            </div>
            {RUTAS_LOG_INTERVALS.map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <div style={{ width: '32px', height: '6px', borderRadius: '3px', background: color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>{label}</span>
                </div>
            ))}
            <div style={{ borderTop: `1px solid ${border}`, margin: '8px 0 6px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#ef4444', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>Distritos Afectados</span>
            </div>
        </div>
    );
};

// Leyenda del mapa de Carreteras Afectadas — Mapa 2
const LeyendaCarreteras = ({ theme }) => {
    const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const titleColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const bg = theme === 'dark' ? 'rgba(15,23,42,0.93)' : 'rgba(255,255,255,0.97)';
    const border = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const mainTypes = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];
    return (
        <div style={{
            position: 'absolute', top: '20px', right: '12px', zIndex: 1000,
            background: bg, border: `1px solid ${border}`, borderRadius: '12px',
            padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            minWidth: '195px', pointerEvents: 'none'
        }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: titleColor, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🗺️</span> Tipo de Carretera
            </div>
            {mainTypes.map(k => {
                const { color, label } = FCLASS_COLORS[k] || { color: FCLASS_DEFAULT, label: k };
                return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <div style={{ width: '32px', height: '5px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>{label}</span>
                    </div>
                );
            })}
            <div style={{ borderTop: `1px solid ${border}`, margin: '8px 0 6px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '5px', borderRadius: '3px', background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 500, color: textColor }}>Ríos Zona Norte</span>
            </div>
        </div>
    );
};

const Map = ({ layers, center, zoom, theme, analysisResult, isEditMode, updateLayerData, activeLayerId, isNetworkMode, networkPoints, setNetworkPoints, routeResult, setRouteResult, setSelectedFeature, selectedFeature, filters }) => {
    const [activeLayers, setActiveLayers] = useState([]);

    useEffect(() => {
        setActiveLayers(layers.filter(l => l.visible));
    }, [layers]);

    const onEachFeature = (feature, layer, layerId) => {
        layer.on('click', (e) => {
            if (isNetworkMode) return;
            L.DomEvent.stopPropagation(e);
            setSelectedFeature({ layerId, feature });
        });

        layer.on('pm:update', (e) => {
            const updated = e.target.toGeoJSON();
            const target = layers.find(l => l.id === layerId);
            if (target && target.data) {
                const newFeatures = target.data.features.map(f =>
                    JSON.stringify(f.geometry) === JSON.stringify(feature.geometry) ? updated : f
                );
                updateLayerData(layerId, { ...target.data, features: newFeatures });
            }
        });

        layer.on('pm:remove', (e) => {
            const target = layers.find(l => l.id === layerId);
            if (target && target.data) {
                const newFeatures = target.data.features.filter(f => JSON.stringify(f.geometry) !== JSON.stringify(feature.geometry));
                updateLayerData(layerId, { ...target.data, features: newFeatures });
            }
        });

        if (feature.properties) {
            const props = feature.properties;
            const name = props.Nombre || props.name || props.n || props.DISTRITO || 'Entidad';
            const type = props.t || props.fclass || props.TIPO || '';
            const isPoint = feature.geometry.type === 'Point';
            const isMatch = filters.district && name.toLowerCase().includes(filters.district.toLowerCase());

            // INTUITIVE LABELS: Tooltip on hover
            layer.bindTooltip(`<div style="font-weight: 800; color: #3b82f6;">${name}</div>`, {
                sticky: !isPoint, // Sticky for polygons/lines, fixed for points
                permanent: !!(isPoint && isMatch), // Permanent if it's a filtered point
                direction: 'top',
                className: 'map-tooltip',
                opacity: 0.95
            });

            // HIGHLIGHT ON HOVER
            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({
                        weight: 4,
                        color: '#f59e0b',
                        fillOpacity: 0.9
                    });
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        l.bringToFront();
                    }
                },
                mouseout: (e) => {
                    const l = e.target;
                    const parentLayer = layers.find(la => la.id === layerId);
                    // Restaurar color de departamento si aplica
                    if (feature.properties?.DEPARTAMEN) {
                        const depColor = getDepartamentoColor(feature.properties);
                        l.setStyle({
                            fillColor: depColor,
                            color: depColor,
                            weight: 2,
                            fillOpacity: 0.55,
                            opacity: 1
                        });
                    } else {
                        const baseStyle = geojsonStyle(feature, parentLayer?.color);
                        l.setStyle(baseStyle);
                    }
                }
            });

            const content = `<div style="padding: 10px; min-width: 150px;">
                <h4 style="margin: 0; color: #3b82f6;">${name}${type ? ` (${type})` : ''}</h4>
                <hr style="margin: 5px 0; opacity: 0.2;">
                <div style="font-size: 12px;">${Object.entries(props).slice(0, 5).map(([k, v]) => `<b>${k}:</b> ${v}`).join('<br/>')}</div>
            </div>`;
            layer.bindPopup(content);
        }
    };

    const geojsonStyle = (feature, layerColor) => {
        const isLine = feature.geometry.type.includes('LineString');
        let finalColor = layerColor || '#3b82f6';
        if (theme === 'dark' && (finalColor === '#000000' || finalColor === 'black')) finalColor = '#f8fafc';

        return {
            fillColor: finalColor,
            weight: isLine ? 4 : 1,
            opacity: 1,
            color: finalColor,
            fillOpacity: isLine ? 0 : 0.6
        };
    };

    return (
        <div className="map-view">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} zoomControl={false} preferCanvas={true} style={{ width: '100%', height: '100%' }}>
                <TileLayer url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />

                <ZoomController />
                <MapController
                    center={center} zoom={zoom} isEditMode={isEditMode} activeLayerId={activeLayerId} layers={layers} updateLayerData={updateLayerData}
                    isNetworkMode={isNetworkMode} networkPoints={networkPoints} setNetworkPoints={setNetworkPoints} setRouteResult={setRouteResult}
                    filters={filters}
                />

                {activeLayers.map((layer) => (
                    layer.data && (
                        <GeoJSON
                            key={`${layer.id}-${layer.lastUpdate || 'v1'}-${theme}-${isNetworkMode}-${isEditMode}-${filters.district}-${filters.province}-${selectedFeature ? JSON.stringify(selectedFeature.feature.geometry).length : 'none'}`}
                            data={(() => {
                                const dTerm = filters.district.toLowerCase();
                                const pTerm = filters.province.toLowerCase();
                                // Sin filtro activo: mostrar todo
                                if (!dTerm && !pTerm) return layer.data;

                                const sample = layer.data.features[0]?.properties || {};

                                // ── Filtro por DEPARTAMEN (Map 1 y 2) ──────────────────
                                const hasDepartamen = sample.DEPARTAMEN !== undefined;
                                if (hasDepartamen && dTerm && !pTerm) {
                                    const filtered = layer.data.features.filter(f => {
                                        const dep = (f.properties?.DEPARTAMEN || '').toLowerCase();
                                        return dep.includes(dTerm);
                                    });
                                    return filtered.length > 0
                                        ? { ...layer.data, features: filtered }
                                        : layer.data;
                                }

                                // ── Filtro por Provincia/Distrito (Map 3 y 9) ──────────
                                const hasDistrictFields =
                                    sample.Nombre !== undefined ||
                                    sample.NOMBDIST !== undefined ||
                                    sample.Distrito !== undefined ||
                                    sample.DISTRITO !== undefined ||
                                    sample.distrito !== undefined ||
                                    sample.NOMBPROV !== undefined ||
                                    sample.Provincia !== undefined ||
                                    sample.PROVINCIA !== undefined;

                                // Capas sin campos filtrables → mostrar todo
                                if (!hasDistrictFields) return layer.data;

                                const filteredFeatures = layer.data.features.filter(f => {
                                    const props = f.properties || {};
                                    const fDist = (props.Nombre || props.NOMBDIST || props.Distrito || props.DISTRITO || props.distrito || '').toLowerCase();
                                    const fProv = (props.NOMBPROV || props.Provincia || props.PROVINCIA || props.provincia || '').toLowerCase();
                                    const dMatch = !dTerm || fDist.includes(dTerm);
                                    const pMatch = !pTerm || fProv.includes(pTerm);
                                    return dMatch && pMatch;
                                });
                                if (filteredFeatures.length === 0) return layer.data;
                                return { ...layer.data, features: filteredFeatures };
                            })()}
                            pointToLayer={(feature, latlng) => {
                                if (layer.id === 901) {
                                    const hospitalIcon = L.divIcon({
                                        html: `<div style="background-color: white; border: 2px solid #ef4444; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); transform: scale(1);">
                                                     <div style="background: #ef4444; width: 12px; height: 3px; position: absolute;"></div>
                                                     <div style="background: #ef4444; width: 3px; height: 12px; position: absolute;"></div>
                                                   </div>`,
                                        className: 'hospital-marker',
                                        iconSize: [20, 20],
                                        iconAnchor: [10, 10]
                                    });
                                    return L.marker(latlng, { icon: hospitalIcon });
                                }
                                return L.circleMarker(latlng, {
                                    radius: 4,
                                    fillColor: layer.color || '#3b82f6',
                                    color: '#fff',
                                    weight: 1.5,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            }}
                            style={(feature) => {
                                const props = feature.properties || {};
                                const base = geojsonStyle(feature, layer.color);

                                // ====================================================
                                // MAPA 1 y 2 — Carreteras: Colorear por tipo (fclass)
                                // ====================================================
                                if ([103, 105, 203, 204].includes(layer.id) && props.fclass) {
                                    return {
                                        ...base,
                                        color: getFclassColor(props.fclass),
                                        weight: props.fclass === 'motorway' || props.fclass === 'trunk' ? 4 : 2.5,
                                        opacity: 0.9,
                                        fillOpacity: 0
                                    };
                                }

                                // ====================================================
                                // ====================================================
                                if (layer.id === 301 && props.Time_total !== undefined) {
                                    const routeColor = getRutaLogColor(props.Time_total);
                                    return {
                                        ...base,
                                        color: routeColor,
                                        weight: 3,
                                        opacity: 0.9,
                                        fillOpacity: 0
                                    };
                                }

                                // ====================================================
                                // ZONA NORTE PERÚ: Colorear por Departamento
                                // Se aplica a cualquier capa que use zona_norte_peru.json
                                // Identificado porque tiene el campo DEPARTAMEN
                                // ====================================================
                                if (props.DEPARTAMEN) {
                                    const depColor = getDepartamentoColor(props);
                                    return {
                                        ...base,
                                        fillColor: depColor,
                                        color: depColor,
                                        weight: 2,
                                        fillOpacity: 0.55,
                                        opacity: 1
                                    };
                                }

                                // Custom Styling for Map 9 - Areas de Servicio
                                if (layer.id === 904 && props.Name) {
                                    const rangeMatch = props.Name.match(/(\d+)\s*-\s*(\d+)$/);
                                    if (rangeMatch) {
                                        const val = parseInt(rangeMatch[2]);
                                        let redColor = '#fee2e2';
                                        if (val <= 30) redColor = '#fecaca';
                                        else if (val <= 60) redColor = '#fca5a5';
                                        else if (val <= 90) redColor = '#f87171';
                                        else if (val <= 120) redColor = '#ef4444';
                                        else redColor = '#b91c1c';
                                        return { ...base, fillColor: redColor, color: redColor, fillOpacity: 0.7 };
                                    }
                                }

                                // Custom Styling for Map 9 - Rutas Afectadas
                                if (layer.id === 903 && props.Name) {
                                    const rangeMatch = props.Name.match(/(\d+)\s*-\s*(\d+)$/);
                                    if (rangeMatch) {
                                        const val = parseInt(rangeMatch[2]);
                                        let routeColor = '#10b981';
                                        if (val <= 30) routeColor = '#10b981';
                                        else if (val <= 60) routeColor = '#84cc16';
                                        else if (val <= 90) routeColor = '#06b6d4';
                                        else if (val <= 120) routeColor = '#3b82f6';
                                        else routeColor = '#1e3a8a';
                                        return { ...base, color: routeColor, weight: 6, opacity: 0.8 };
                                    }
                                }

                                // Custom Styling for Map 9 - Rutas (id 902)
                                if (layer.id === 902) {
                                    return { ...base, color: '#f59e0b', weight: 4, dashArray: '5, 10' };
                                }

                                const dTerm = filters.district.toLowerCase();
                                const pTerm = filters.province.toLowerCase();
                                if ((dTerm || pTerm)) {
                                    // Solo resaltar en amarillo las capas con campos de nombre/distrito
                                    const hasFilterableField =
                                        props.Nombre !== undefined ||
                                        props.NOMBDIST !== undefined ||
                                        props.Distrito !== undefined ||
                                        props.DISTRITO !== undefined ||
                                        props.distrito !== undefined ||
                                        props.NOMBPROV !== undefined ||
                                        props.Provincia !== undefined ||
                                        props.PROVINCIA !== undefined;

                                    if (hasFilterableField) {
                                        return { ...base, weight: base.weight + 3, color: '#f59e0b', fillOpacity: 0.9, opacity: 1 };
                                    }
                                }

                                if (selectedFeature && JSON.stringify(feature.geometry) === JSON.stringify(selectedFeature.feature.geometry)) {
                                    return { ...base, weight: base.weight + 5, color: '#f59e0b', opacity: 1 };
                                }
                                return base;
                            }}
                            onEachFeature={(f, l) => {
                                onEachFeature(f, l, layer.id);
                                const props = f.properties || {};

                                // Specific Labels for Map 9 Health Centers
                                if (layer.id === 901) {
                                    const name = props.Nombre || props.Distrito || 'C. Salud';
                                    l.bindTooltip(`<div class="label-cs" style="color: #ef4444; font-weight: bold; background: white; padding: 1px 4px; border-radius: 3px; border: 1px solid #ef4444; font-size: 8px;">${name}</div>`, {
                                        permanent: true,
                                        direction: 'bottom',
                                        offset: [0, 10],
                                        className: 'health-center-label'
                                    });
                                }

                                // Labels para Zona Norte Perú - coloreados por departamento
                                if (f.properties && f.properties.DEPARTAMEN) {
                                    const depName = f.properties.DEPARTAMEN.trim();
                                    const depColor = getDepartamentoColor(f.properties);
                                    // Siempre mostrar label permanente con el nombre del departamento
                                    l.bindTooltip(
                                        `<div style="color: ${depColor}; font-weight: 900; font-size: 12px; text-shadow: 0 0 4px rgba(0,0,0,0.5); background: rgba(255,255,255,0.85); padding: 3px 8px; border-radius: 5px; border: 2px solid ${depColor}; letter-spacing: 0.5px;">${depName}</div>`,
                                        { permanent: true, direction: 'center', className: 'zona-norte-label', interactive: false }
                                    );
                                }
                            }}
                        />
                    )
                ))}

                {routeResult && <GeoJSON data={routeResult} style={{ color: '#10b981', weight: 8, opacity: 0.9 }} />}
                {networkPoints.start && <Marker position={[networkPoints.start[1], networkPoints.start[0]]}><Popup>Origen</Popup></Marker>}
                {networkPoints.end && <Marker position={[networkPoints.end[1], networkPoints.end[0]]}><Popup>Destino</Popup></Marker>}
                {analysisResult && <GeoJSON data={analysisResult.data} style={{ color: '#ef4444', fillOpacity: 0.3 }} />}

                <ScaleControl position="bottomleft" imperial={false} />
            </MapContainer>

            {/* Leyenda de departamentos zona norte - visible cuando hay capa activa con DEPARTAMEN */}
            {activeLayers.some(l => l.data?.features?.some(f => f.properties?.DEPARTAMEN)) && (
                <LeyendaZonaNorte theme={theme} />
            )}

            {/* Leyenda del mapa de salud */}
            {activeLayers.some(l => [901, 902, 903, 904].includes(l.id)) && (
                <LeyendaSalud theme={theme} activeLayers={activeLayers} />
            )}

            {/* Leyenda Rutas Logísticas mapa 3 */}
            {activeLayers.some(l => l.id === 301) && (
                <LeyendaRutasLogisticas theme={theme} />
            )}

            {/* Leyenda Carreteras mapa 1 y 2 */}
            {activeLayers.some(l => [103, 105, 203, 204].includes(l.id)) && (
                <LeyendaCarreteras theme={theme} />
            )}
        </div>
    );
};

export default Map;
