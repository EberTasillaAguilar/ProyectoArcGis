const fs = require('fs');
const turf = require('@turf/turf');

async function main() {
    console.log("Loading files...");
    const rutasRaw = fs.readFileSync('public/maps/Map5/rutas_afectadas_zona_norte_utm.json', 'utf8');
    const rutas = JSON.parse(rutasRaw);

    const distritosRaw = fs.readFileSync('public/maps/Map3/distritos.json', 'utf8');
    const distritos = JSON.parse(distritosRaw);

    console.log(`Loaded ${rutas.features.length} rutas y ${distritos.features.length} distritos.`);

    const outputFeatures = [];

    let processedLines = 0;

    // We only take a subset to avoid extreme slowness, e.g. 500 routes that actually intersect something.
    let count = 0;
    for (let i = 0; i < rutas.features.length; i++) {
        const routeFeat = rutas.features[i];
        if (!routeFeat.geometry) continue;

        let foundIntersection = false;

        // Check intersections with all districts
        for (let j = 0; j < distritos.features.length; j++) {
            const distFeat = distritos.features[j];
            if (!distFeat.geometry) continue;

            // To speed things up, check bbox
            if (!distFeat.bbox) distFeat.bbox = turf.bbox(distFeat);
            if (!routeFeat.bbox) routeFeat.bbox = turf.bbox(routeFeat);

            // simple AABB collision check
            const rB = routeFeat.bbox;
            const dB = distFeat.bbox;
            if (rB[0] > dB[2] || rB[2] < dB[0] || rB[1] > dB[3] || rB[3] < dB[1]) {
                continue; // no bbox overlap
            }

            try {
                // turf.intersect returns null if no intersection
                let intersected = turf.intersect(turf.featureCollection([distFeat, routeFeat]));

                // turf 6.5 intersect signature was: turf.intersect(poly1, poly2) but wait!
                // turf.intersect is typically for two POLYGONS! For LineString + Polygon:
                // We must use turf.booleanIntersects or turf.lineIntersect (returns points) or turf.bboxClip or turf.lineSplit.
                // Wait! To clip a LineString with a Polygon, turf has turf.bboxClip ? No.
                // turf doesn't natively have a robust line-polygon clipper that returns a LineString.
                // Oh wait, turf in Node is likely 6.5.
            } catch (e) {
                // ignore
            }
        }
    }
}
main();
