const fs = require('fs');
const path = require('path');
const proj4 = require('proj4');

// EPSG:32717 (WGS 84 / UTM zone 17S)
proj4.defs('EPSG:32717', '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs');

function convertCoordinates(coords) {
    if (!Array.isArray(coords)) return coords;

    // Si es un arreglo de números (un punto 2D)
    if (coords.length === 2 && typeof coords[0] === 'number') {
        if (Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) { // Seguro que no es WGS84
            const result = proj4('EPSG:32717', 'WGS84', coords);
            return [result[0], result[1]];
        }
        return coords;
    }

    // Recursivo para lineas y poligonos
    return coords.map(c => convertCoordinates(c));
}

function processGeoJSON(data) {
    if (data.type === 'FeatureCollection' && data.features) {
        data.features.forEach(f => {
            if (f.geometry && f.geometry.coordinates) {
                f.geometry.coordinates = convertCoordinates(f.geometry.coordinates);
            }
        });

        // Remove CRS so Leaflet uses default WGS84
        if (data.crs) {
            delete data.crs;
        }
    }
    return data;
}

const map5Dir = path.join(__dirname, '../public/maps/Map5');
const files = fs.readdirSync(map5Dir).filter(f => f.endsWith('.json'));

for (const file of files) {
    const filePath = path.join(map5Dir, file);
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Si no es un FeatureCollection, tal vez es array o features
        let processed;
        if (raw.type === 'FeatureCollection') {
            processed = processGeoJSON(raw);
        } else if (raw.features) {
            processed = { type: 'FeatureCollection', features: raw.features };
            processed = processGeoJSON(processed);
        } else if (raw.geometryType || raw.spatialReference) {
            // Es un export de ArcGIS mal formado, no lo tocamos aquí o lo avisamos
            console.log(`❗ ${file} seems like raw ArcGIS JSON. Skipping repoj...`);
            continue;
        } else {
            console.log(`⏩ ${file} - format unknown. Skipping...`);
            continue;
        }

        fs.writeFileSync(filePath, JSON.stringify(processed));
        console.log(`✅ Converted ${file} to WGS84`);
    } catch (e) {
        console.error(`❌ Error in ${file}:`, e.message);
    }
}
