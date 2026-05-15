import requests
import json

# URLs mapped to output filenames
sources = {
    "https://raw.githubusercontent.com/Warzone2100/warzone2100/refs/heads/master/data/mp/stats/structure.json": "structures_cleaned.json",
    "https://raw.githubusercontent.com/Warzone2100/warzone2100/refs/heads/master/data/mp/stats/templates.json": "templates_cleaned.json",
    "https://raw.githubusercontent.com/Warzone2100/warzone2100/refs/heads/master/data/base/stats/features.json": "features_cleaned.json",
}

for url, filename in sources.items():
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    if "templates.json" in url:
        # Just store all keys in an array
        processed = list(data.keys())
    else:
        # Process normally for structures and features
        processed = {}
        for key, value in data.items():
            new_entry = {}
            if "breadth" in value:
                new_entry["length"] = value["breadth"]
            if "width" in value:
                new_entry["width"] = value["width"]
            if new_entry:  # only save non-empty
                processed[key] = new_entry

    # Save minified JSON
    with open(filename, "w") as f:
        json.dump(processed, f, separators=(",", ":"))

    print(f"Saved {filename}")
