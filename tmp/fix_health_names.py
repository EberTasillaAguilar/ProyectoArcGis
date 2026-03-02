import json
import os
import math

def process_coords(coords, precision=4, tolerance=0.0002):
    if not coords: return coords
    if isinstance(coords[0], (int, float)):
        return [round(c, precision) for c in coords]
    if isinstance(coords[0], list) and isinstance(coords[0][0], (int, float)):
        new_coords = [coords[0]]
        last = coords[0]
        for i in range(1, len(coords)-1):
            dist = math.sqrt((coords[i][0]-last[0])**2 + (coords[i][1]-last[1])**2)
            if dist > tolerance:
                new_coords.append(coords[i])
                last = coords[i]
        if len(coords) > 1: new_coords.append(coords[-1])
        return [[round(p[0], precision), round(p[1], precision)] for p in new_coords]
    return [process_coords(c, precision, tolerance) for c in coords]

def optimize_health_centers():
    src = 'c:/Users/eberj/Documentos-Local/mapitas/Mapa 09/centros_salud.json'
    dst = 'public/maps/Map 09/centros_salud_opt.json'
    print(f"Optimizing {src}...")
    with open(src, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    keep_keys = ['fid', 'nombre', 'name', 'tipo', 'categoria', 'distrito', 'provincia', 'departamen', 'capacidad']
    
    for feature in data.get('features', []):
        if feature.get('geometry'):
            feature['geometry']['coordinates'] = process_coords(feature['geometry']['coordinates'], 4, 0) # No reduction for points
        
        props = feature.get('properties', {}) or feature.get('attributes', {})
        clean_props = {}
        for k, v in props.items():
            if k.lower() in keep_keys:
                clean_props[k] = v
        feature['properties'] = clean_props
        if 'attributes' in feature: del feature['attributes']

    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
    print(f"Done. Size: {os.path.getsize(dst)/1024:.2f}KB")

if __name__ == "__main__":
    optimize_health_centers()
