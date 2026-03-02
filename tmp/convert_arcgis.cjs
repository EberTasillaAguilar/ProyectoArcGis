// Convierte formato ArcGIS REST JSON a GeoJSON estándar
const fs = require('fs');
const path = require('path');

function convertArcGISToGeoJSON(inputPath, outputPath) {
    const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const geomType = raw.geometryType; // esriGeometryPolyline, esriGeometryPolygon, etc.

    const features = (raw.features || []).map(f => {
        const properties = f.attributes || f.properties || {};
        const geom = f.geometry;

        let geometry = null;

        if (!geom) {
            geometry = null;
        } else if (geomType === 'esriGeometryPolyline' || geom.paths) {
            // paths → MultiLineString
            const paths = geom.paths || [];
            if (paths.length === 1) {
                geometry = { type: 'LineString', coordinates: paths[0] };
            } else {
                geometry = { type: 'MultiLineString', coordinates: paths };
            }
        } else if (geomType === 'esriGeometryPolygon' || geom.rings) {
            const rings = geom.rings || [];
            if (rings.length === 1) {
                geometry = { type: 'Polygon', coordinates: rings };
            } else {
                geometry = { type: 'MultiPolygon', coordinates: rings.map(r => [r]) };
            }
        } else if (geomType === 'esriGeometryPoint' || (geom.x !== undefined)) {
            geometry = { type: 'Point', coordinates: [geom.x, geom.y] };
        } else {
            // Already GeoJSON geometry
            geometry = geom;
        }

        return {
            type: 'Feature',
            properties,
            geometry
        };
    });

    const geojson = {
        type: 'FeatureCollection',
        features
    };

    fs.writeFileSync(outputPath, JSON.stringify(geojson));
    console.log('✅ Convertido:', path.basename(inputPath), '->', path.basename(outputPath), '| features:', features.length);
}

// Convertir los archivos de Map2
const map2 = './public/maps/Map2/';
convertArcGISToGeoJSON(map2 + 'rutas_principales_afectadas_zona_norte.json', map2 + 'rutas_principales_afectadas_zona_norte.json');
convertArcGISToGeoJSON(map2 + 'rutas_principales_zona_norte.json', map2 + 'rutas_principales_zona_norte.json');
