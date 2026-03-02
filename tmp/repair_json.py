
import json
import os

path = r"c:\Users\eberj\Documentos-Local\InterfazArgis\public\maps\Map1\buffer_norte_rios.json"

with open(path, 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

print(f"Original length: {len(content)}")

# Try to find the last complete feature or at least the last coordinate.
# A safe way is to find the last occurrence of ']]}' which closes a geometry,
# or '}' which closes a feature.
# But since it's truncated in the middle of coordinates, we might have to back up more.

last_bracket = content.rfind('}},')
if last_bracket != -1:
    print(f"Found last complete feature at {last_bracket}")
    repaired = content[:last_bracket + 2] + ']}' 
    # content[:last_bracket+2] is ... "geometry": { ... }}
    # We need to close the features array and the main object: ]}
else:
    # If no complete feature, try to find last coordinate pair
    last_coord = content.rfind(']')
    if last_coord != -1:
         # Check if it's a coordinate pair like [x, y]
         # We'll just truncate at the last '}' to be safe if possible
         last_feature_start = content.rfind('{"type": "Feature"')
         if last_feature_start != -1:
             print(f"Trimming to last feature start at {last_feature_start}")
             # Let's see if the PREVIOUS feature ended
             prev_end = content[:last_feature_start].rfind('},')
             if prev_end != -1:
                 repaired = content[:prev_end + 1] + ']}'
             else:
                 # Only one partial feature?
                 repaired = '{"type": "FeatureCollection", "features": []}'
         else:
             repaired = '{"type": "FeatureCollection", "features": []}'

try:
    json.loads(repaired)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(repaired)
    print("Repaired successfully.")
except Exception as e:
    print(f"Repair failed: {e}")
    # Fallback: find last "}," and close it
    idx = content.rfind('},')
    if idx != -1:
        repaired = content[:idx+1] + ']}'
        try:
            json.loads(repaired)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(repaired)
            print("Repaired with fallback.")
        except:
             print("Total failure to repair.")
