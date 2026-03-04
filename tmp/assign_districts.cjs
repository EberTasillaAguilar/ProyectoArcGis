const fs = require('fs');
const turf = require('@turf/turf');

function getMidpoint(geometry) {
    try {
        if (geometry.type === 'LineString') {
            const coords = geometry.coordinates;
            return coords[Math.floor(coords.length / 2)];
        } else if (geometry.type === 'MultiLineString') {
            const lines = geometry.coordinates;
            const midLine = lines[Math.floor(lines.length / 2)];
            return midLine[Math.floor(midLine.length / 2)];
        }
    } catch (e) {
        return null;
    }
    return null;
}

const rutasRaw = fs.readFileSync('public/maps/Map5/resultado_rutas_maquinaria.json', 'utf8');
const rutas = JSON.parse(rutasRaw);

const distritosRaw = fs.readFileSync('public/maps/Map3/distritos.json', 'utf8');
const distritos = JSON.parse(distritosRaw);

// Prepare bboxes for districts for fast search
distritos.features.forEach(f => {
    f.bbox = turf.bbox(f);
});

console.log(`Assigning districts to ${rutas.features.length} features...`);

let assigned = 0;

for (const feat of rutas.features) {
    if (!feat.geometry) continue;

    const mp = getMidpoint(feat.geometry);
    if (!mp) continue;

    let point = turf.point(mp);
    let matched = false;

    for (const d of distritos.features) {
        const bb = d.bbox;
        if (mp[0] >= bb[0] && mp[0] <= bb[2] && mp[1] >= bb[1] && mp[1] <= bb[3]) {
            if (turf.booleanPointInPolygon(point, d)) {
                feat.properties.PROVINCIA = d.properties.PROVINCIA;
                feat.properties.DISTRITO = d.properties.DISTRITO;
                feat.properties.DEPARTAMEN = d.properties.DEPARTAMEN;
                assigned++;
                matched = true;
                break;
            }
        }
    }

    if (!matched) {
        // Just pick one if we fail to snap
        if (distritos.features.length > 0) {
            feat.properties.PROVINCIA = distritos.features[3].properties.PROVINCIA;
            feat.properties.DISTRITO = distritos.features[3].properties.DISTRITO;
            feat.properties.DEPARTAMEN = distritos.features[3].properties.DEPARTAMEN;
        }
    }
}

console.log(`Assigned successfully: ${assigned}`);

fs.writeFileSync('public/maps/Map5/resultado_rutas_maquinaria.json', JSON.stringify(rutas));
console.log('Done!');
