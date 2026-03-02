
import json
import os

def esri_to_geojson(esri_geometry):
    if 'rings' in esri_geometry:
        return { "type": "Polygon", "coordinates": esri_geometry['rings'] }
    elif 'paths' in esri_geometry:
        return { "type": "MultiLineString", "coordinates": esri_geometry['paths'] }
    elif 'x' in esri_geometry and 'y' in esri_geometry:
        return { "type": "Point", "coordinates": [esri_geometry['x'], esri_geometry['y']] }
    return None

def process_file(path):
    print(f"Loading {os.path.basename(path)}...")
    with open(path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error loading: {e}")
            return

    if 'features' in data and ('geometryType' in data or 'spatialReference' in data):
        print(f"Converting to GeoJSON...")
        features = []
        for f in data.get('features', []):
            geojson_feature = {
                "type": "Feature",
                "properties": f.get('attributes', {}),
                "geometry": esri_to_geojson(f.get('geometry', {}))
            }
            features.append(geojson_feature)
        
        geojson = { "type": "FeatureCollection", "features": features }
        print(f"Saving...")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f)
        print(f"Done.")
    else:
        print(f"Already GeoJSON or skip.")

directory = r"c:\Users\eberj\Documentos-Local\InterfazArgis\public\maps\Map1"
files = [
    "rios_zona_norte.json",
    "rutas_afectadas_peru.json",
    "buffer_norte_rios.json",
    "ruta_zonas_norte_opt.json"
]

for filename in files:
    process_file(os.path.join(directory, filename))
