
const Layout = {
    isStruct(obj) {
        return !!this.STRUCTURES[obj.name];
    },
    isDroid(obj) {
        return this.DROIDS.has(obj.name);
    },
    isFeature(obj) {
        return !!this.FEATURES[obj.name];
    },
    typeOf(obj) {
        if (isStruct(obj)) {
            return "STRUCTURE";
        } else if (isDroid(obj)) {
            return "DROID";
        } else if (isFeature(obj)) {
            return "FEATURE";
        } else {
            throw new Error(`typeOf() failed to identify object as STRUCTURE DROID or FEATURE: ${JSON.stringify(obj)}`);
        }
    },
    // Check if a structure/feature fits at (x, y), where (x, y) is the bottom-right corner of the object
    // e.g. the following returns true
    // canPasteObj("A0LightFactory" 2, 2, [
    //   "fff",
    //   "fff",
    //   "fff",
    // ])
    canPasteObj(obj, x, y, layout, dictionary) {
        if (this.isDroid(obj)) {
            return true;
        }
        const { width, length } = (() => {
            if (isStruct(obj)) {
                return this.STRUCTURES[obj.name];
            } else if (isFeature(obj)) {
                return this.FEATURES[obj.name];
            }
        })();

        for () {
            for () {

            }
        }
    },
    // Append an object to its corresponding array
    pasteObj(obj, structures, droids, features) {
        switch (this.typeOf(obj)) {
            case "STRUCTURE":
                structures.push(obj);
                break;
            case "DROID":
                droids.push(obj);
                break;
            case "FEATURE":
                features.push(obj);
                break;
        }
    },
    // Return a new array
    // Handles ragged arrays (make uniformly rectangular)
    pad(layout) {
        const width = Math.max(...layout.map(s => s.length));
        return layout.map(row => row.padEnd(width, " "));
    },
    // Find the width and length of a layout. Assumes non-ragged
    dimensions(layout) {
        return {
            width: layout[0].length,
            length: layout.length,
        };
    },
    // Return a new transformed layout after (1) rotation and (2) left/right mirror
    transform(layout, rotation = 0, mirror = false) {
        const padded = this.pad(layout);
        const { width, length } = this.dimensions(padded);

        const result = [];

        for (let row = 0; row < (rotation % 2 === 0 ? length : width); row++) {
            let line = "";
            for (let col = 0; col < (rotation % 2 === 0 ? width : length); col++) {
                const char = (() => {
                    switch (rotation) {
                        case 0: // 0°
                            return mirror ? padded[row][width - 1 - col]
                                          : padded[row][col];

                        case 1: // 90° clockwise
                            return mirror ? padded[length - 1 - col][width - 1 - row]
                                          : padded[length - 1 - col][row];

                        case 2: // 180°
                            return mirror ? padded[length - 1 - row][col]
                                          : padded[length - 1 - row][width - 1 - col];

                        case 3: // 270° clockwise
                            return mirror ? padded[col][row]
                                          : padded[col][width - 1 - row];
                    }
                })();
                line += char;
            }
            result.push(line);
        }

        return { width, length, layout: result };
    },
    // layout     : an array of strings representing the layout
    // dictionary : a mapping between each character and a list of objects/functions
    // mirror     : left/right mirror
    pasteLayout(x, y, layout, dictionary, structures, droids, features, player = 0, rotation = 0, mirror = false) {
        const { width, length, layout: transformed } = this.transform(layout, rotation, mirror);
        for (let row = 0; row < length; row++) {
            for (let col = 0; col < width; col++) {
                const char = transformed[row][col];
                const entries = dictionary[char] ?? [];
                for (const entry of entries) {
                    const [x2, y2] = [x+col, y+col];
                    if (typeof entry === "function") {
                        entry(x2, y2);
                    } else {
                        entry.obj.position[0] += x2;
                        entry.obj.position[1] += y2;
                        entry.obj.direction = ((entry.obj.direction + rotation) % 4) * 0x4000;
                        entry.obj.player = player;
                        pasteObj(entry.obj, structures, droids, features);
                    }
                }
            }
        }
    },
};
