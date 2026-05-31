const Layout = {
    /**
     * Pad the ragged array with spaces so it is rectangular (non-ragged)
     * @param {string[]} layout
     * @returns {string[]} A rectangular (non-ragged) layout
     */
    pad(layout) {
        const width = Math.max(...layout.map(s => s.length));
        return layout.map(row => row.padEnd(width, " "));
    },
    /**
     * @param {string[]} layout - A rectangular (non-ragged) layout
     * @returns {{ width: number, length: number }} width and length of the layout
     */
    dimensions(layout) {
        return [ layout[0].length, layout.length ];
    },
    /**
     * @param {number} direction - number in range [0, 65535]
     * @param {number} rotation - Counter-clockwise rotation: 0, 1, 2, or 3 (none, 90 degrees, 180 degrees, or 270 degrees)
     * @returns {number} rotated direction
     */
    applyRotation(direction, rotation = 0) {
        const delta = rotation * 0x4000;
        return (direction + delta) % 0x10000;
    },
    /**
     * @param {number} direction - number in range [0, 65535]
     * @param {"HORIZONTAL"|"VERTICAL"|null} mirror
     * @returns {number} rotated direction
     */
    applyMirror(direction, mirror = null) {
        if (mirror === null) {
            return;
        }

        if (mirror === "HORIZONTAL") {
            if (direction === 0x0000) {
                return 0x0000;
            } else {
                return 0x10000 - direction;
            }
        } else if (mirror === "VERTICAL") {
            if (direction <= 0x8000) {
                return 0x8000 - direction;
            } else {
                return 0x18000 - direction;
            }
        }
    },
    /**
     * Rotate a layout
     * @param {string[]} old_layout - A rectangular (non-ragged) layout
     * @param {number} rotation - Counter-clockwise rotation: 0, 1, 2, or 3 (none, 90 degrees, 180 degrees, or 270 degrees)
     * @returns {string[]} new layout
     */
    rotateLayout(old_layout, rotation = 0) {
        if (rotation === 0) {
            return old_layout;
        }

        const [ old_width, old_length ] = this.dimensions(old_layout);
        const new_width = rotation === 1 || rotation === 3 ? old_length : old_width;
        const new_length = rotation === 1 || rotation === 3 ? old_width : old_length;

        const new_layout = [];
        for (let row = 0; row < new_length; row++) {
            let line = "";
            for (let col = 0; col < new_width; col++) {
                const char = (() => {
                    switch (rotation) {
                        case 1: // 90° counter-clockwise
                            return old_layout[col][old_width - 1 - row];
                        case 2: // 180°
                            return old_layout[old_length - 1 - row][old_width - 1 - col];
                        case 3: // 270° counter-clockwise
                            return old_layout[old_length - 1 - col][row];
                    }
                })();
                line += char;
            }
            new_layout.push(line);
        }
        return new_layout;
    },
    /**
     * Mirror a layout
     * @param {string[]} old_layout - A rectangular (non-ragged) layout
     * @param {"HORIZONTAL"|"VERTICAL"|null} mirror
     * @returns {string[]} new layout
     */
    mirrorLayout(old_layout, mirror = null) {
        if (mirror === null) {
            return old_layout;
        }

        const [ width, length ] = this.dimensions(old_layout);

        const new_layout = [];
        for (let row = 0; row < length; row++) {
            let line = "";
            for (let col = 0; col < width; col++) {
                const char = (() => {
                    switch (mirror) {
                        case "HORIZONTAL":
                            return old_layout[row][width - 1 - col];
                        case "VERTICAL":
                            return old_layout[length - 1 - row][col];
                    }
                })();
                line += char;
            }
            new_layout.push(line);
        }
        return new_layout;
    },
    /**
     * Rotate a dictionary
     * @param {string[]} old_dictionary - A rectangular (non-ragged) layout
     * @param {number} rotation - Counter-clockwise rotation: 0, 1, 2, or 3 (none, 90 degrees, 180 degrees, or 270 degrees)
     * @returns {string[]} new dictionary
     */
    rotateDictionary(old_dictionary, rotation = 0) {
        if (rotation === 0) {
            return old_dictionary;
        }

        const new_dictionary = {};
        for (const [ key, old_object ] of Object.entries(old_dictionary)) {

            // (1) Rotate
            const old_direction = old_object.direction ?? 0;
            const new_direction = this.applyRotation(old_direction, rotation);

            const new_object = {
                ...old_object,
                direction: new_direction
            };

            const width = old_object.width ?? 1;
            const length = old_object.length ?? 1;

            // (2) Update width/length
            if (rotation % 2 !== 0 && width !== length) {
                [new_object.width, new_object.length] = [length, width];
            }

            if (width > 1 || length > 1) {
                // (3) Translate
                new_object.position ??= [0, 0];

                if (rotation === 1) {
                    if (width === 2 && length === 2) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 128;
                    } else if (width === 3 && length === 3) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 2*128;
                    } else if (width === 1 && length === 2) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 0;
                    } else if (width === 2 && length === 1) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 128;
                    }
                } else if (rotation === 2) {
                    if (width === 2 && length === 2) {
                        new_object.position[0] += 128;
                        new_object.position[1] += 128;
                    } else if (width === 3 && length === 3) {
                        new_object.position[0] += 2*128;
                        new_object.position[1] += 2*128;
                    } else if (width === 1 && length === 2) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 128;
                    } else if (width === 2 && length === 1) {
                        new_object.position[0] += 128;
                        new_object.position[1] += 0;
                    }
                } else if (rotation === 3) {
                    if (width === 2 && length === 2) {
                        new_object.position[0] += 128;
                        new_object.position[1] += 0;
                    } else if (width === 3 && length === 3) {
                        new_object.position[0] += 2*128;
                        new_object.position[1] += 0;
                    } else if (width === 1 && length === 2) {
                        new_object.position[0] += 128;
                        new_object.position[1] += 0;
                    } else if (width === 2 && length === 1) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 0;
                    }
                }
            }

            new_dictionary[key] = new_object;
        }
        return new_dictionary;
    },
    /**
     * Mirror a dictionary
     * @param {string[]} old_dictionary - A rectangular (non-ragged) layout
     * @param {"HORIZONTAL"|"VERTICAL"|null} mirror
     * @returns {string[]} new dictionary
     */
    mirrorDictionary(old_dictionary, mirror = null) {
        if (mirror === null) {
            return old_dictionary;
        }

        const new_dictionary = {};
        for (const [ key, old_object ] of Object.entries(old_dictionary)) {

            // (1) Rotate
            const old_direction = old_object.direction ?? 0;
            const new_direction = this.applyMirror(old_direction, mirror);

            const new_object = {
                ...old_object,
                direction: new_direction
            };

            const width = old_object.width ?? 1;
            const length = old_object.length ?? 1;

            if (width > 1 || length > 1) {
                // (2) Translate
                new_object.position ??= [0, 0];

                if (mirror === "HORIZONTAL") {
                    if (width === 2 && length === 2) {
                        if (new_direction === 0x8000) {
                            new_object.position[0] -= 128;
                            new_object.position[1] += 0;
                        } else if (new_direction === 0x4000) {
                            new_object.position[0] -= 128;
                            new_object.position[1] += 0;
                        } else {
                            new_object.position[0] += 128;
                            new_object.position[1] += 0;
                        }
                    } else if (width === 3 && length === 3) {
                        if (new_direction === 0x0000) {
                            new_object.position[0] -= 2*128;
                            new_object.position[1] += 0;
                        } else if (new_direction === 0xC000) {
                            new_object.position[0] -= 2*128;
                            new_object.position[1] += 0;
                        } else {
                            new_object.position[0] += 2*128;
                            new_object.position[1] += 0;
                        }
                    } else if (width === 1 && length === 2) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 0;
                    } else if (width === 2 && length === 1) {
                        if (new_direction === 0x4000) {
                            new_object.position[0] -= 128;
                            new_object.position[1] += 0;
                        } else {
                            new_object.position[0] += 128;
                            new_object.position[1] += 0;
                        }
                    }
                } else if (mirror === "VERTICAL") {
                    if (width === 2 && length === 2) {
                        if (new_direction === 0x4000) {
                            new_object.position[0] += 0;
                            new_object.position[1] -= 128;
                        } else if (new_direction === 0x0000) {
                            new_object.position[0] += 0;
                            new_object.position[1] -= 128;
                        } else {
                            new_object.position[0] += 0;
                            new_object.position[1] += 128;
                        }
                    } else if (width === 3 && length === 3) {
                        if (new_direction === 0xC000) {
                            new_object.position[0] += 0;
                            new_object.position[1] -= 2*128;
                        } else if (new_direction === 0x8000) {
                            new_object.position[0] += 0;
                            new_object.position[1] -= 2*128;
                        } else {
                            new_object.position[0] += 0;
                            new_object.position[1] += 2*128;
                        }
                    } else if (width === 1 && length === 2) {
                        if (new_direction === 0x0000) {
                            new_object.position[0] += 0;
                            new_object.position[1] -= 128;
                        } else {
                            new_object.position[0] += 0;
                            new_object.position[1] += 128;
                        }
                    } else if (width === 2 && length === 1) {
                        new_object.position[0] += 0;
                        new_object.position[1] += 0;
                    }
                }
            }

            new_dictionary[key] = new_object;
        }
        return new_dictionary;
    },
    /**
     * @param {number} x - top left corner of where the layout will be pasted
     * @param {number} y - top left corner of where the layout will be pasted
     * @param {string[]} layout - an array of strings representing the layout
     * @param {Record<string, { type: string, name: string, width: number, length: number, position?: number[], direction?: number, modules?: number }>} dictionary
     * @param {number} player - 0, 1, 2, 3, 4, 5, 6, 7, 8, or 9
     */
    paste(x, y, layout, dictionary, player = 0) {
        const [ width, length ] = this.dimensions(layout);
        for (let row = 0; row < length; row++) {
            for (let col = 0; col < width; col++) {
                const char = layout[row][col];
                const entry = dictionary[char];
                if (!entry) {
                    continue;
                }
                const [x2, y2] = [x+col, y+row];
                switch (entry.type) {
                    case "STRUCTURE":
                        this.pasteStructure({
                            name: entry.name,
                            position: [entry.position?.[0] ?? 0, entry.position?.[1] ?? 0],
                            direction: entry.direction ?? 0,
                            modules: entry.modules ?? 0,
                            player: player
                        }, x2, y2, entry.width, entry.length);
                        break;
                    case "DROID":
                        this.pasteDroid({
                            name: entry.name,
                            position: [entry.position?.[0] ?? 0, entry.position?.[1] ?? 0],
                            direction: entry.direction ?? 0,
                            player: player
                        }, x2, y2);
                        break;
                    case "FEATURE":
                        this.pasteFeature({
                            name: entry.name,
                            position: [entry.position?.[0] ?? 0, entry.position?.[1] ?? 0],
                            direction: entry.direction ?? 0
                        }, x2, y2, entry.width, entry.length);
                        break;
                }
            }
        }
    },
    /**
     * Mutates the structure's position
     * @param {object} structure
     * @param {number} x - bottom right tile position of the structure
     * @param {number} y - bottom right tile position of the structure
     * @param {number} width - width of the structure (in tiles)
     */
    pasteStructure(structure, x, y, width, length) {
        structure.position[0] += 128 * x;
        structure.position[1] += 128 * y;
        if (width === 3 && length === 3) {
            structure.position[0] -= 128;
            structure.position[1] -= 128;
        }
        structures.push(structure);
    },
    /**
     * Mutates the droid's position
     * @param {object} structure
     * @param {number} x - tile position of the droid
     * @param {number} y - tile position of the droid
     */
    pasteDroid(droid, x, y) {
        droid.position[0] += 128 * x;
        droid.position[1] += 128 * y;
        droids.push(droid);
    },
    /**
     * Mutates the feature's position
     * @param {object} structure
     * @param {number} x - bottom right tile position of the feature
     * @param {number} y - bottom right tile position of the feature
     * @param {number} width - width of the feature (in tiles)
     */
    pasteFeature(feature, x, y, width, length) {
        feature.position[0] += 128 * x;
        feature.position[1] += 128 * y;
        if (width === 3 && length === 3) {
            structure.position[0] -= 128;
            structure.position[1] -= 128;
        }
        features.push(feature);
    }
};

const texturemap = Array(11881).fill(17);
const heightmap = Array(11881).fill(510);
const structures = [];
const droids = [];
const features = [];

for (let x = 4; x < 105; x++) {
    for (let y = 4; y < 105; y++) {
        const i = y*109 + x;
        texturemap[i] = 22;
    }
}

const team_B = [
    "... ... ... ... ...",
    "... ... ... ... ...",
    "..f ..f ..f ..f ..f",
    "                   ",
    ".. .. ..t..t. . . .",
    ".p .p .pt.Htc c c c",
    "                   ",
    ".. .. .. .. .. .. .",
    ".p .r .r .r .r .r c",
    "                   ",
    ".. .. .. .. .. .. o",
    ".p .p .p .p .p .p o",
    "                   ",
    "ooooooooooooooooooo",
    "ooooooooooooooooooo",
];

const team_B_dict = {
    "p": {
        type: "STRUCTURE",
        name: "A0PowerGenerator",
        width: 2,
        length: 2,
        modules: 1
    },
    "r": {
        type: "STRUCTURE",
        name: "A0ResearchFacility",
        width: 2,
        length: 2,
        modules: 1
    },
    "c": {
        type: "STRUCTURE",
        name: "A0CyborgFactory",
        width: 1,
        length: 2,
        direction: 2 * 0x4000
    },
    "f": {
        type: "STRUCTURE",
        name: "A0LightFactory",
        width: 3,
        length: 3,
        modules: 2,
        direction: 2 * 0x4000
    },
    "t": {
        type: "DROID",
        name: "ConstructionDroid",
        position: [64, 64],
        direction: 2 * 0x4000
    },
    "H": {
        type: "STRUCTURE",
        name: "A0CommandCentre",
        width: 2,
        length: 2
    },
    "o": {
        type: "STRUCTURE",
        name: "A0ResourceExtractor",
        width: 1,
        length: 1
    }
};

const team_A = Layout.rotateLayout(team_B, 2);
const team_A_dict = Layout.rotateDictionary(team_B_dict, 2);

Layout.paste(5, 5, team_A, team_A_dict, 0);
Layout.paste(25, 5, team_A, team_A_dict, 1);
Layout.paste(45, 5, team_A, team_A_dict, 2);
Layout.paste(65, 5, team_A, team_A_dict, 3);
Layout.paste(85, 5, team_A, team_A_dict, 4);

Layout.paste(5, 89, team_B, team_B_dict, 5);
Layout.paste(25, 89, team_B, team_B_dict, 6);
Layout.paste(45, 89, team_B, team_B_dict, 7);
Layout.paste(65, 89, team_B, team_B_dict, 8);
Layout.paste(85, 89, team_B, team_B_dict, 9);

setMapData(109, 109, texturemap, heightmap, structures, droids, features);
