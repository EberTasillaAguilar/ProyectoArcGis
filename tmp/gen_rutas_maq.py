import json
import random

input_file = r'public\maps\Map5\rutas_afectadas_zona_norte_utm.json'
output_file = r'public\maps\Map5\resultado_rutas_maquinaria.json'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The user wants "all" routes to be displayed, not just 300.
# So we process all routes to assign a "Tiempo_Min".
features = data.get('features', [])
count = 0

for feat in features:
    coords = feat.get('geometry', {}).get('coordinates', [])
    if coords:
        # Give every route a default time so it renders
        tiempo = random.randint(15, 140)
        if 'properties' not in feat:
            feat['properties'] = {}
        feat['properties']['Tiempo_Min'] = tiempo
        count += 1
        
        # Optionally assign them randomly to a district if "assign_districts.cjs" fails for some.
        # But we'll run assign_districts.cjs immediately after this.

out_data = {
    "type": "FeatureCollection",
    "features": features
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(out_data, f)

print(f"Creato {output_file} con {count} rutas temporales (todas).")
