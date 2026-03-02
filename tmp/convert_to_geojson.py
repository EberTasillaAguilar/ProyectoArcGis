
import json
import os

def esri_to_geojson(esri_data):
    features = []
    for f in esri_data.get('features', []):
        attributes = f.get('attributes', {})
        geometry = f.get('geometry', {})
        
        geojson_feature = {
            "type": "Feature",
            "properties": attributes,
            "geometry": None
        }
        
        if 'rings' in geometry:
            geojson_feature["geometry"] = {
                "type": "Polygon",
                "coordinates": geometry['rings']
            }
        elif 'paths' in geometry:
            geojson_feature["geometry"] = {
                "type": "MultiLineString",
                "coordinates": geometry['paths']
            }
        elif 'x' in geometry and 'y' in geometry:
            geojson_feature["geometry"] = {
                "type": "Point",
                "coordinates": [geometry['x'], geometry['y']]
            }
        
        features.append(geojson_feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

directory = r"c:\Users\eberj\Documentos-Local\InterfazArgis\public\maps\Map1"
files = [
    "zona_norte_peru.json",
    "rios_zona_norte.json",
    "rutas_afectadas_peru.json",
    "buffer_norte_rios.json",
    "ruta_zonas_norte_opt.json"
]

for filename in files:
    path = os.path.join(directory, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    
    print(f"Converting {filename}...")
    with open(path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            continue
            
    if 'features' in data and ('geometryType' in data or 'spatialReference' in data):
        # looks like Esri JSON
        geojson = esri_to_geojson(data)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f)
        print(f"Successfully converted {filename}")
    else:
        print(f"{filename} is already GeoJSON or unknown format")
