const fs = require('fs');
const files = ['rutas_principales_afectadas_zona_norte.json', 'rutas_principales_zona_norte.json', 'zona_norte_peru.json'];
files.forEach(f => {
    try {
        const d = JSON.parse(fs.readFileSync('./public/maps/Map2/' + f));
        const p = d.features[0].properties;
        console.log('=== ' + f + ' | total: ' + d.features.length + ' | geom: ' + d.features[0].geometry.type);
        Object.keys(p).forEach(k => console.log('  ' + k + ': ' + String(p[k]).slice(0, 50)));
    } catch (e) {
        console.log('ERROR ' + f + ': ' + e.message);
    }
});
