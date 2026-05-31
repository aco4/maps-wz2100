/**
 * Convert from x, y coordinate to index position
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @returns {number} the position represented as an index
 */
function toi(x, y) {
    return y*MAP_WIDTH + x;
}

/**
 * Convert from index position to x, y coordinate
 * @param {number} i - The position represented as an index
 * @returns {[number, number]} the position represented as x, y
 */
function toxy(i) {
    const x = i % MAP_WIDTH;
    const y = Math.floor(i / MAP_WIDTH);
    return [x, y];
}

function isOnNorthEdge(i) {
    return i < MAP_WIDTH;
}
function isOnEastEdge(i) {
    return i % MAP_WIDTH === MAP_WIDTH-1;
}
function isOnSouthEdge(i) {
    return i >= MAP_AREA - MAP_WIDTH;
}
function isOnWestEdge(i) {
    return i % MAP_WIDTH === MAP_WIDTH;
}

/**
 * Boost cliffs: increase the height of each 2x2 cliff square.
 * Requires cliff_tiles, tiletypemap, and heightmap.
 */
for (const i of cliff_tiles) {
    // Skip tiles on the north/west edges
    if (i < MAP_WIDTH || i % MAP_WIDTH === 0) {
        continue;
    }

    // Check for a 2x2 square
    if (tiletypemap[i-MAP_WIDTH  ] === TileType.CLIFF &&
        tiletypemap[i-1          ] === TileType.CLIFF &&
        tiletypemap[i-MAP_WIDTH-1] === TileType.CLIFF) {

        // Apply a random height increase
        heightmap[i] = Math.min(
            MAX_TILE_HEIGHT - gameRand(32),
            heightmap[i] + 128 + gameRand(128)
        );
    }
}


// Min-Heap implementation
class BucketQueue {
    // max_priority : the max possible priority of any item. Should be ideally small
    // get_priority : a function that takes in an item and returns a priority
    constructor(max_priority, get_priority) {
        this.buckets = Array.from({ length: max_priority + 1 }, () => []);
        this.currentMin = Infinity;  // Start with Infinity to properly track min
        this.length = 0;
        this.get_priority = get_priority;
    }

    enqueue(item) {
        const priority = this.get_priority(item);
        this.buckets[priority].push(item);
        if (priority < this.currentMin) {
            this.currentMin = priority;
        }
        this.length++;
    }

    dequeue() {
        while (this.currentMin < this.buckets.length) {
            const bucket = this.buckets[this.currentMin];
            if (bucket.length > 0) {
                this.length--;
                return bucket.shift();
            }
            this.currentMin++;
        }
        return null; // empty
    }

    isEmpty() {
        return this.length === 0;
    }
}

// Faster flood fill by ChatGPT 5.5 Thinking
// const flood_fill = create_flood_fill(MAP_WIDTH, MAP_LENGTH);
//
// flood_fill(i, max_count, shape,
//     i => texturemap[i] === Texture.SAND,
//     i => texturemap[i] = Texture.WATER,
//     () => false
// );
function create_flood_fill(width, length) {
    const size = width * length;

    const seen = new Array(size);
    const queue = new Array(size);

    let stamp = 1;

    return function flood_fill_i(
        start_i,
        max_count,
        shape,
        can_visit,
        visit,
        stop = () => false
    ) {
        if (start_i < 0 || start_i >= size) {
            return 0;
        }

        if (max_count == null) {
            max_count = Infinity;
        }

        const current_stamp = stamp++;

        if (stamp === 0xffffffff) {
            seen.fill(0);
            stamp = 1;
        }

        let head = 0;
        let tail = 0;
        let visit_count = 0;

        seen[start_i] = current_stamp;
        queue[tail++] = start_i;

        while (head < tail && visit_count < max_count && !stop()) {
            const i = queue[head++];

            if (!can_visit(i)) {
                continue;
            }

            visit(i);
            visit_count++;

            const hasNorth = i >= width;
            const hasSouth = i < size - width;
            const hasWest = i % width !== 0;
            const hasEast = (i + 1) % width !== 0;

            let ni;

            // Cardinal neighbors.
            // South
            if (hasSouth) {
                ni = i + width;
                if (seen[ni] !== current_stamp) {
                    seen[ni] = current_stamp;
                    queue[tail++] = ni;
                }
            }

            // East
            if (hasEast) {
                ni = i + 1;
                if (seen[ni] !== current_stamp) {
                    seen[ni] = current_stamp;
                    queue[tail++] = ni;
                }
            }

            // North
            if (hasNorth) {
                ni = i - width;
                if (seen[ni] !== current_stamp) {
                    seen[ni] = current_stamp;
                    queue[tail++] = ni;
                }
            }

            // West
            if (hasWest) {
                ni = i - 1;
                if (seen[ni] !== current_stamp) {
                    seen[ni] = current_stamp;
                    queue[tail++] = ni;
                }
            }

            if (shape) {
                // Preserve original behavior: one RNG roll per ordinal direction.
                if (gameRand(100) < shape && hasSouth && hasEast) {
                    ni = i + width + 1;
                    if (seen[ni] !== current_stamp) {
                        seen[ni] = current_stamp;
                        queue[tail++] = ni;
                    }
                }

                if (gameRand(100) < shape && hasNorth && hasEast) {
                    ni = i - width + 1;
                    if (seen[ni] !== current_stamp) {
                        seen[ni] = current_stamp;
                        queue[tail++] = ni;
                    }
                }

                if (gameRand(100) < shape && hasSouth && hasWest) {
                    ni = i + width - 1;
                    if (seen[ni] !== current_stamp) {
                        seen[ni] = current_stamp;
                        queue[tail++] = ni;
                    }
                }

                if (gameRand(100) < shape && hasNorth && hasWest) {
                    ni = i - width - 1;
                    if (seen[ni] !== current_stamp) {
                        seen[ni] = current_stamp;
                        queue[tail++] = ni;
                    }
                }
            }
        }

        return visit_count;
    };
}

// Shapeful Non-Prioritized Flood-Fill Algorithm
//
// sx, sy    : 0-indexed x,y-coordinate of the flood-fill's starting position.
// width     : width of the bounded area.
// length    : length of the bounded area.
// max_count : how many cells should be visited.
// shape     : integer in range [0,100] that controls how circular the flood-fill is.
//             0 = diamond
//             25 = roughly circular
//             100 = square
// can_visit : a function that takes in x, y, and returns true if it can be visited.
// visit     : a function that takes in x, y, and performs an operation on it.
// stop      : a function that returns true if the flood-fill should stop.
//
// EXAMPLE USAGE
//
// flood_fill(125, 125, MAP_WIDTH, MAP_LENGTH, 3500, 25,
//     (x, y) => {
//         const i = y*MAP_WIDTH + x;
//         return texturemap[i] === Texture.WATER;
//     },
//     (x, y) => {
//         const i = y*MAP_WIDTH + x;
//         texturemap[i] = Texture.SAND;
//     },
//     () => {
//         return false;
//     }
// );
//
function flood_fill(sx, sy, width, length, max_count, shape, can_visit, visit, stop) {
    function add_to_queue([x, y]) {
        if (x >= 0 && y >= 0 && x < width && y < length && !seen[x][y]) {
            seen[x][y] = true;
            queue.push([x, y]);
        }
    }
    const seen = Array(width).fill().map(() => Array(length).fill(false));
    const queue = [[sx, sy]];
    let queue_head = 0;
    let visit_count = 0;
    seen[sx][sy] = true;
    while (queue_head < queue.length && visit_count < max_count && !stop()) {
        const [x, y] = queue[queue_head++];
        if (can_visit(x, y)) {
            visit(x, y);
            visit_count++;
            for (const [dx, dy] of Cardinals) {
                add_to_queue([x+dx, y+dy]);
            }
            for (const [dx, dy] of Ordinals) {
                if (shape && gameRand(100) < shape) {
                    add_to_queue([x+dx, y+dy]);
                }
            }
        }
    }
    return visit_count;
}

// Shapeless Prioritized Flood-Fill Algorithm
//
// sx, sy       : 0-indexed x,y-coordinate of the flood-fill's starting position.
// width        : width of the bounded area.
// length       : length of the bounded area.
// max_count    : how many cells should be visited. For example, 5.
// max_priority : the maximum possible priority value
// get_priority : a function that takes in an item and returns a priority value
// can_visit    : a function that takes in x, y, and returns true if it can be visited.
// visit        : a function that takes in x, y, and performs an operation on it.
// stop         : a function that returns true if the flood-fill should stop.
//
// EXAMPLE USAGE
//
// flood_fill(125, 125, MAP_WIDTH, MAP_LENGTH, 3500, MAX_TILE_HEIGHT,
//     ([x, y]) => {
//         const i = y*MAP_WIDTH + x;
//         return heightmap[i];
//     },
//     (x, y) => {
//         const i = y*MAP_WIDTH + x;
//         return texturemap[i] === Texture.WATER || texturemap[i] === Texture.SAND;
//     },
//     (x, y) => {
//         const i = y*MAP_WIDTH + x;
//         texturemap[i] = Texture.CONCRETE;
//     },
//     () => {
//         return false;
//     }
// );
//
function flood_fill(sx, sy, width, length, max_count, max_priority, get_priority, can_visit, visit, stop) {
    const Cardinals = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const Ordinals = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    const seen = Array(width).fill().map(() => Array(length).fill(false));
    const queue = new BucketQueue(max_priority, get_priority);
    queue.enqueue([sx, sy]);
    let visit_count = 0;
    seen[sx][sy] = true;
    while (!queue.isEmpty() && visit_count < max_count && !stop()) {
        const [x, y] = queue.dequeue();
        if (can_visit(x, y)) {
            visit(x, y);
            visit_count++;
            for (const [dx, dy] of Cardinals) {
                const [nx, ny] = [x+dx, y+dy];
                if (nx >= 0 && ny >= 0 && nx < width && ny < length && !seen[nx][ny]) {
                    seen[nx][ny] = true;
                    queue.enqueue([nx, ny]);
                }
            }
        }
    }
    return visit_count;
}

// Returns true if every tile in a rectangular area matches the condition.
// Returns false otherwise.
// x, y      : the top left corner of the rectangle
// width     : the width of the rectangle
// length    : the length of the rectangle
// condition : a function that takes in an x, y, and returns true or false
function area_check(x, y, width, length, condition) {
    for (let dy = 0; dy < length; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (!condition(x+dx, y+dy)) {
                return false;
            }
        }
    }
    return true;
}

// Returns true if every tile in the square area centered on (x, y) matches the
// condition. Returns false otherwise.
// x, y      : the center of the square area
// radius    : radius of the square area to check (e.g. 1 = 3x3 area)
// condition : a function that takes in an x, y, and returns true or false
function radius_check(x, y, radius, condition) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (!condition(x+dx, y+dy)) {
                return false;
            }
        }
    }
    return true;
}

// Perform an operation on a rectangular area.
// x, y      : the top left corner of the rectangle
// width     : the width of the rectangle
// length    : the length of the rectangle
// operation : a function that takes in x, y, and performs an operation
function fill(x, y, width, length, operation) {
    for (let dy = 0; dy < length; dy++) {
        for (let dx = 0; dx < width; dx++) {
            operation(x+dx, y+dy);
        }
    }
}

// Fill an area (negative) e.g. create a pit
// x, y      : the top left corner of the rectangle
// width   : the width of the rectangle
// length  : the length of the rectangle
// texture : a function that takes in x, y, and returns a texture for that position
// height  : a function that takes in x, y, and returns a height for that position
function fill_negative(x, y, width, length, texture, height) {
    for (let dy = 0; dy < length; dy++) { // Main body
        for (let dx = 0; dx < width; dx++) {
            const i = (y+dy)*MAP_WIDTH + (x+dx);
            heightmap[i] = height(x+dx, y+dy);
            texturemap[i] = texture(x+dx, y+dy);
        }
    }
    for (let dy = 0; dy < length + 1; dy++) { // Get the right edge
        const i = (y+dy)*MAP_WIDTH + (x+width);
        heightmap[i] = height(x+width, y+dy);
    }
    for (let dx = 0; dx < width; dx++) { // Get the bottom edge
        const i = (y+length)*MAP_WIDTH + (x+dx);
        heightmap[i] = height(x+dx, y+length);
    }
}

// Fill an area (positive) e.g. create a plateau
// x, y    : the upper left corner of the rectangle
// width   : the width of the rectangle
// length  : the length of the rectangle
// texture : a function that takes in x, y, and returns a texture for that position
// height  : a function that takes in x, y, and returns a height for that position
function fill_positive(x, y, width, length, texture, height) {
    for (let dy = 1; dy < length; dy++) { // Main body
        for (let dx = 1; dx < width; dx++) {
            const i = (y+dy)*MAP_WIDTH + (x+dx);
            heightmap[i] = height(x+dx, y+dy);
            texturemap[i] = texture(x+dx, y+dy);
        }
    }
    for (let dy = 0; dy < length; dy++) { // Get the left edge
        const i = (y+dy)*MAP_WIDTH + (x);
        texturemap[i] = texture(x, y+dy);
    }
    for (let dx = 1; dx < width; dx++) { // Get the top edge
        const i = (y)*MAP_WIDTH + (x+dx);
        texturemap[i] = texture(x+dx, y);
    }
}

function squared_distance(x1, y1, x2, y2) {
    return (x1-x2)**2 + (y1-y2)**2;
}

function euclidean_distance(x1, y1, x2, y2) {
    return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

// const Weights = Object.freeze({
//     "Red": 10,
//     "Blue": 75,
//     "Green": 15,
// });
function weightedRandom(object) {
    let sum = 0;
    for (const property in object) {
        sum += object[property];
    }

    let choice = gameRand(sum) + 1;
    for (const property in object) {
        choice -= object[property];
        if (choice <= 0) {
            return property;
        }
    }
    throw new Error("weightedRandom");
}

// Returns the corresponding symmetrical [x, y] on the other side of the map.
// WARNING: 90 degree rotation only works on square maps!
// i    : a position on the map, represented as either an index or [x, y]
// type : 90 rotation, 180 rotation, horizontal mirror, vertical mirror, or diagonal mirror
function sym(i, type) {
    if (Array.isArray(i)) {
        const [x, y] = i;
        switch (type) {
            case "90" : return [MAP_WIDTH-1-y, x];
            case "180": return [MAP_WIDTH-1-x, MAP_LENGTH-1-y];
            case "HOR": return [MAP_WIDTH-1-x, y];
            case "VER": return [x, MAP_LENGTH-1-y];
            case "DIA": return [y, x];
        }
    } else {
        switch (type) {
            case "90" : return (i % MAP_WIDTH) * MAP_LENGTH + (MAP_WIDTH-1 - Math.floor(i / MAP_WIDTH));
            case "180": return MAP_AREA-1-i;
            case "HOR": return i - (i % MAP_WIDTH) + MAP_WIDTH - 1 - (i % MAP_WIDTH);
            case "VER": return (MAP_LENGTH - 1 - Math.floor(i / MAP_WIDTH)) * MAP_WIDTH + (i % MAP_WIDTH);
            case "DIA": return sym(toxy(i), "DIA");
        }
    }
}

// Transform a heightmap into a symmetrical heightmap, in-place
// This function uses a self-additive method, which causes the height values to increase
// Post-normalization may be needed
// arr  : the heightmap
// type : symmetry type
function symmetricalize(arr, type) {
    switch (type) {
        case "90":   return type90();
        case "180":  return type180();
        case "HOR":  return typeHOR();
        case "VER":  return typeVER();
        case "DIA":  return typeDIA();
        case "TWIN": return typeTWIN();
        case "FULL": return typeFULL();
    }
    // 90 degree rotational symmetry
    function type90() {
        // return the index located in the next quadrant
        function rotate90(i) {
            return (i % MAP_WIDTH) * MAP_LENGTH + (MAP_WIDTH-1 - Math.floor(i / MAP_WIDTH));
        }

        if (MAP_WIDTH != MAP_LENGTH) {
            throw new Error("90 degree rotational symmetry is only supported on square maps!");
        }

        for (let x = 0; x < Math.ceil(MAP_WIDTH/2); x++) {
            for (let y = 0; y < Math.ceil(MAP_LENGTH/2); y++) {
                const i1 = y*MAP_WIDTH + x;
                const i2 = rotate90(i1);
                const i3 = rotate90(i2);
                const i4 = rotate90(i3);
                arr[i1] = arr[i1] + arr[i2] + arr[i3] + arr[i4];
                arr[i4] = arr[i3] = arr[i2] = arr[i1];
            }
        }
        return arr;
    }
    // 180 degree rotational symmetry
    function type180() {
        for (let i = 0; i < MAP_AREA; i++) {
            if (i < Math.ceil(MAP_AREA/2)) {
                arr[i] = arr[i] + arr[sym(i,"180")];
            } else {
                arr[i] = arr[sym(i,"180")];
            }
        }
        return arr;
    }
    // Horizontal (left-right) mirror symmetry
    function typeHOR() {
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_LENGTH; y++) {
                const i = y*MAP_WIDTH + x;
                if (x < Math.ceil(MAP_WIDTH/2)) {
                    arr[i] = arr[i] + arr[sym(i,"HOR")];
                } else {
                    arr[i] = arr[sym(i,"HOR")];
                }
            }
        }
        return arr;
    }
    // Vertical (top-bottom) mirror symmetry
    function typeVER() {
        for (let y = 0; y < MAP_LENGTH; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const i = y*MAP_WIDTH + x;
                if (y < Math.ceil(MAP_LENGTH/2)) {
                    arr[i] = arr[i] + arr[sym(i,"VER")];
                } else {
                    arr[i] = arr[sym(i,"VER")];
                }
            }
        }
        return arr;
    }
    // Diagonal mirror symmetry
    function typeDIA() {
        if (MAP_WIDTH != MAP_LENGTH) {
            throw new Error("Diagonal mirror symmetry is only supported on square maps!");
        }
        for (let y = 0; y < MAP_LENGTH; y++) {
            for (let x = 0; x <= y; x++) {
                const i1 = y*MAP_WIDTH + x;
                const i2 = x*MAP_WIDTH + y;
                arr[i1] = arr[i1] + arr[i2];

            }
        }
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < x; y++) {
                const i1 = y*MAP_WIDTH + x;
                const i2 = x*MAP_WIDTH + y;
                arr[i1] = arr[i2];
            }
        }
        return arr;
    }
    // Twin (horizontal + vertical) mirror symmetry
    function typeTWIN() {
        typeHOR();
        typeVER();
        return arr;
    }
    // Twin mirror + 90 degree rotational symmetry
    function typeFULL() {
        if (MAP_WIDTH != MAP_LENGTH) {
            throw new Error("Twin mirror + 90 degree rotational symmetry is only supported on square maps!");
        }
        typeHOR();
        typeVER();
        type90();
        return arr;
    }
}

// Normalize an array to the range [a, b]
function normalize(arr, a, b) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = a + ((arr[i] - min) / (max - min)) * (b - a);
    }
    return arr;
}

function sigmoid(x) {
    return (Math.E**x) / (1 + Math.E**x);
}

// Returns the minimum height of a rectangular area
function min_height(x, y, width, length) {
    let min = MAX_TILE_HEIGHT;
    for (let dy = 0; dy < length; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const i = (y+dy)*MAP_WIDTH + (x+dx);
            if (heightmap[i] < min) {
                min = heightmap[i];
            }
        }
    }
    return min;
}

// Returns the maximum height of a rectangular area
function max_height(x, y, width, length) {
    let max = 0;
    for (let dy = 0; dy < length; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const i = (y+dy)*MAP_WIDTH + (x+dx);
            if (heightmap[i] > max) {
                max = heightmap[i];
            }
        }
    }
    return max;
}

// The following functions take in an index i, which represents a position at
// coordinate (x, y), and return the index when the position is offset.
// If the offset position exceeds the map boundaries, they return i.

// y - 1
function i_N(i) {
    return i - MAP_WIDTH < 0 ? i : i - MAP_WIDTH;
}
// x + 1
function i_E(i) {
    return (i + 1) % MAP_WIDTH == 0 ? i : i + 1;
}
// y + 1
function i_S(i) {
    return i + MAP_WIDTH >= MAP_AREA ? i : i + MAP_WIDTH;
}
// x - 1
function i_W(i) {
    return i % MAP_WIDTH == 0 ? i : i - 1;
}
// x - 1, y - 1
function i_NW(i) {
    return i - MAP_WIDTH < 0 || i % MAP_WIDTH == 0 ? i : i - 1 - MAP_WIDTH;
}
// x + 1, y - 1
function i_NE(i) {
    return i - MAP_WIDTH < 0 || (i + 1) % MAP_WIDTH == 0 ? i : i + 1 - MAP_WIDTH;
}
// x - 1, y + 1
function i_SW(i) {
    return i + MAP_WIDTH >= MAP_AREA || i % MAP_WIDTH == 0 ? i : i - 1 + MAP_WIDTH;
}
// x + 1, y + 1
function i_SE(i) {
    return i + MAP_WIDTH >= MAP_AREA || (i + 1) % MAP_WIDTH == 0 ? i : i + 1 + MAP_WIDTH;
}

const AutoCliff = [
    null,                                  // 0b0000
    Texture.CLIFF_CORNER_2   | 3 * 0x1000, // 0b0001
    Texture.CLIFF_CORNER_2   | 2 * 0x1000, // 0b0010
    Texture.CLIFF_STRAIGHT_2 | 0 * 0x1000, // 0b0011
    Texture.CLIFF_CORNER_2   | 1 * 0x1000, // 0b0100
    null,                                  // 0b0101
    Texture.CLIFF_STRAIGHT_2 | 1 * 0x1000, // 0b0110
    Texture.CLIFF_CORNER_2   | 0 * 0x1000, // 0b0111
    Texture.CLIFF_CORNER_2   | 0 * 0x1000, // 0b1000
    Texture.CLIFF_STRAIGHT_2 | 1 * 0x1000, // 0b1001
    null,                                  // 0b1010
    Texture.CLIFF_CORNER_2   | 1 * 0x1000, // 0b1011
    Texture.CLIFF_STRAIGHT_2 | 0 * 0x1000, // 0b1100
    Texture.CLIFF_CORNER_2   | 2 * 0x1000, // 0b1101
    Texture.CLIFF_CORNER_2   | 3 * 0x1000, // 0b1110
    null                                   // 0b1111
];

function auto_cliff(i) {
    // Get the height of each corner
    const onEastEdge = i % MAP_WIDTH === MAP_WIDTH-1;
    const onSouthEdge = i >= MAP_AREA - MAP_WIDTH;
    const NW = heightmap[i];
    const NE = !onEastEdge ? heightmap[i+1] : heightmap[i];
    let SE;
    if (i === MAP_AREA-1) {
        SE = heightmap[i];
    } else if (!onEastEdge && onSouthEdge) {
        SE = heightmap[i+1];
    } else if (onEastEdge && !onSouthEdge) {
        SE = heightmap[i+MAP_WIDTH];
    } else {
        SE = heightmap[i+1+MAP_WIDTH];
    }
    const SW = !onSouthEdge ? heightmap[i+MAP_WIDTH] : heightmap[i];

    // Use the height of each corner to calculate the correct cliff texture
    const avg = (NW + NE + SE + SW) >> 2;
    let key = 0b0000;
    if (NW > avg) key |= 0b1000;
    if (NE > avg) key |= 0b0100;
    if (SE > avg) key |= 0b0010;
    if (SW > avg) key |= 0b0001;
    return AutoCliff[key] ?? Texture.CLIFF_DOUBLE | gameRand(4) * 0x1000;
}

// // I think this handles edges wrong
// function auto_cliff(i) {
//     const NW = heightmap[i];
//     const NE = heightmap[i+1];
//     const SE = heightmap[i+1+MAP_WIDTH];
//     const SW = heightmap[i+MAP_WIDTH];
//     const avg = (NW + NE + SE + SW) / 4;
//     let key = 0b0000;
//     if (NW > avg) key |= 0b1000;
//     if (NE > avg) key |= 0b0100;
//     if (SE > avg) key |= 0b0010;
//     if (SW > avg) key |= 0b0001;
//     return AutoCliff[key] ?? Texture.CLIFF_DOUBLE | gameRand(4) * 0x1000;
// }

// Returns the average height of the tile located at x, y, determined by its
// four corner points. Safely handles tiles on the edges of the map.
function avg_height(x, y) {
    const x2 = Math.min(MAP_WIDTH-1, x+1);
    const y2 = Math.min(MAP_LENGTH-1, y+1);
    const i1 = y*MAP_WIDTH + x;
    const i2 = y2*MAP_WIDTH + x;
    const i3 = y*MAP_WIDTH + x2;
    const i4 = y2*MAP_WIDTH + x2;
    return (heightmap[i1] + heightmap[i2] + heightmap[i3] + heightmap[i4]) >> 2;
}

// Returns the steepness of the tile at index i.
function steepness(i) {
    const h1 = heightmap[i];
    const h2 = heightmap[i+1];
    const h3 = heightmap[i+MAP_WIDTH];
    const h4 = heightmap[i+1+MAP_WIDTH];
    let min = h1;
    let max = h1;
    if (h2 < min) min = h2;
    if (h2 > max) max = h2;
    if (h3 < min) min = h3;
    if (h3 > max) max = h3;
    if (h4 < min) min = h4;
    if (h4 > max) max = h4;
    return max - min;
}

// Returns the squared steepness of the tile at index i.
// Safely handles tiles on the edges of the map.
function steepness(i) {
    const h1 = heightmap[i];
    const h2 = heightmap[i+1] ?? 0;
    const h3 = heightmap[i+MAP_WIDTH] ?? 0;
    const h4 = heightmap[i+1+MAP_WIDTH] ?? 0;
    const dx = h2 + h4 - h1 - h3;
    const dy = h3 + h4 - h1 - h2;
    return dx*dx + dy*dy;
}

// Returns the average height of the 8 neighbor vertices
// WARNING: Assumes all 8 vertices are in-bounds
function smooth(i) {
    let sum = heightmap[i+1] +
              heightmap[i-1] +
              heightmap[i+MAP_WIDTH] +
              heightmap[i-MAP_WIDTH] +
              heightmap[i+1+MAP_WIDTH] +
              heightmap[i+1-MAP_WIDTH] +
              heightmap[i-1+MAP_WIDTH] +
              heightmap[i-1-MAP_WIDTH];
    return Math.round(sum / 8);
}

// https://stackoverflow.com/a/12646864
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = gameRand(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Returns true if the tile at index i is flat, or false otherwise.
// Safely handles tiles on the edges of the map.
function flat(i) {
    const h = heightmap[i];
    return h === heightmap[i+1] && h === heightmap[i+MAP_WIDTH] && h === heightmap[i+1+MAP_WIDTH];
}

// Code snippet for detecting if x,y is near the edge
if (x < 2 || y < 2 || x >= MAP_WIDTH-2 || y >= MAP_WIDTH-2) {
    foo();
}
if (x >= 2 && y >= 2 && x < MAP_WIDTH-2 && y < MAP_WIDTH-2) {
    bar();
}

// Imagine a map border r tiles wide. Returns true if the tile at x,y is on that border.
// on_border(2, 2, 1) === false
// on_border(2, 2, 2) === false
// on_border(2, 2, 3) === true
function on_border(x, y, r) {
    return x < r || y < r || x >= MAP_WIDTH-r || y >= MAP_WIDTH-r;
}

const Road = Object.freeze({
    W: Texture.ROAD_END | 0 * 0x1000,
    N: Texture.ROAD_END | 1 * 0x1000,
    E: Texture.ROAD_END | 2 * 0x1000,
    S: Texture.ROAD_END | 3 * 0x1000,

    EW: Texture.ROAD_STRAIGHT | 0 * 0x1000,
    NS: Texture.ROAD_STRAIGHT | 1 * 0x1000,

    ESW: Texture.ROAD_T | 0 * 0x1000,
    NSW: Texture.ROAD_T | 1 * 0x1000,
    ENW: Texture.ROAD_T | 2 * 0x1000,
    ENS: Texture.ROAD_T | 3 * 0x1000
});

const Path = Object.freeze({
    S: Texture.PATH_END | 0 * 0x1000,
    W: Texture.PATH_END | 1 * 0x1000,
    N: Texture.PATH_END | 2 * 0x1000,
    E: Texture.PATH_END | 3 * 0x1000,

    NS: Texture.PATH_STRAIGHT_2 | 0 * 0x1000,
    EW: Texture.PATH_STRAIGHT_2 | 1 * 0x1000,

    ES: Texture.PATH_CORNER | 0 * 0x1000,
    SW: Texture.PATH_CORNER | 1 * 0x1000,
    NW: Texture.PATH_CORNER | 2 * 0x1000,
    EN: Texture.PATH_CORNER | 3 * 0x1000,

    ENS: Texture.PATH_T | 0 * 0x1000,
    ESW: Texture.PATH_T | 1 * 0x1000,
    NSW: Texture.PATH_T | 2 * 0x1000,
    ENW: Texture.PATH_T | 3 * 0x1000,

    ENSW: Texture.PATH_PLUS
});


const TexRot = {
    ROAD_T: {
        S: 0,
        W: 1,
        N: 2,
        E: 3
    },
    ROAD_END: {
        E: 0,
        S: 1,
        W: 2,
        N: 3
    },
    ROAD_STRAIGHT: {
        W: 0,
        E: 0,
        N: 1,
        S: 1
    },
    PATH_T: {
        E: 0,
        S: 1,
        W: 2,
        N: 3
    },
    PATH_PLUS: {
        N: 0,
        E: 1,
        S: 2,
        W: 3
    },
    PATH_STRAIGHT_2: {
        N: 0,
        S: 0,
        E: 1,
        W: 1
    },
    PATH_CORNER: {
        E: 0,
        S: 1,
        W: 2,
        N: 3
    },
    PATH_END: {
        N: 0,
        E: 1,
        S: 2,
        W: 3
    }
}

const Delta = {
    E: {
        i: 1,
        x: 1,
        y: 0,
        invert: "W"
    },
    N: {
        i: -MAP_WIDTH,
        x: 0,
        y: -1,
        invert: "S"
    },
    S: {
        i: MAP_WIDTH,
        x: 0,
        y: 1,
        invert: "N"
    },
    W: {
        i: -1,
        x: -1,
        y: 0,
        invert: "E"
    }
}

function getDecoration() {
    const r = gameRand(100);
    if (r < 14) {
        return "Ruin1";
    } else if (r < 28) {
        return "Ruin3";
    } else if (r < 42) {
        return "Ruin5";
    } else if (r < 56) {
        return "Ruin7";
    } else if (r < 70) {
        return "Ruin9";
    } else if (r < 84) {
        return "BarbHUT";
    } else if (r < 90) {
        return "WaterTower";
    } else if (r < 92) {
        return "Chevy";
    } else if (r < 94) {
        return "Pickup";
    } else if (r < 96) {
        return "WreckedVertCampVan";
    } else if (r < 98) {
        return "WreckedSuzukiJeep";
    } else {
        return "BlueCar";
    }
}

// Each bit represents one of the 8 neighbors
// If the combination of neighbors is NOT in this set, change the tile to ground
const CliffLife = new Set([
    0b00001111,
    0b00010110,
    0b00010111,
    0b00011011,
    0b00011110,
    0b00011111,
    0b00101011,
    0b00101111,
    0b00111011,
    0b00111110,
    0b00111111,
    0b01001111,
    0b01010110,
    0b01010111,
    0b01011011,
    0b01011110,
    0b01011111,
    0b01101000,
    0b01101001,
    0b01101010,
    0b01101011,
    0b01101110,
    0b01101111,
    0b01110110,
    0b01110111,
    0b01111000,
    0b01111001,
    0b01111010,
    0b01111011,
    0b01111100,
    0b01111101,
    0b01111110,
    0b01111111,
    0b10010110,
    0b10010111,
    0b10011011,
    0b10011110,
    0b10011111,
    0b10111011,
    0b10111110,
    0b10111111,
    0b11001011,
    0b11001111,
    0b11010000,
    0b11010010,
    0b11010011,
    0b11010100,
    0b11010110,
    0b11010111,
    0b11011000,
    0b11011001,
    0b11011010,
    0b11011011,
    0b11011100,
    0b11011101,
    0b11011110,
    0b11011111,
    0b11101000,
    0b11101001,
    0b11101010,
    0b11101011,
    0b11101110,
    0b11101111,
    0b11110000,
    0b11110010,
    0b11110011,
    0b11110100,
    0b11110110,
    0b11110111,
    0b11111000,
    0b11111001,
    0b11111010,
    0b11111011,
    0b11111100,
    0b11111101,
    0b11111110,
    0b11111111,
]);

const WaterLife = new Set([
    0b00001011,
    0b00001111,
    0b00010110,
    0b00010111,
    0b00011011,
    0b00011110,
    0b00011111,
    0b00101011,
    0b00101111,
    0b00110110,
    0b00110111,
    0b00111011,
    0b00111110,
    0b00111111,
    0b01001011,
    0b01001111,
    0b01010110,
    0b01010111,
    0b01011011,
    0b01011110,
    0b01011111,
    0b01101000,
    0b01101001,
    0b01101010,
    0b01101011,
    0b01101100,
    0b01101101,
    0b01101110,
    0b01101111,
    0b01110110,
    0b01110111,
    0b01111000,
    0b01111001,
    0b01111010,
    0b01111011,
    0b01111100,
    0b01111101,
    0b01111110,
    0b01111111,
    0b10001011,
    0b10001111,
    0b10010110,
    0b10010111,
    0b10011011,
    0b10011110,
    0b10011111,
    0b10101011,
    0b10101111,
    0b10110110,
    0b10110111,
    0b10111011,
    0b10111110,
    0b10111111,
    0b11001011,
    0b11001111,
    0b11010000,
    0b11010001,
    0b11010010,
    0b11010011,
    0b11010100,
    0b11010101,
    0b11010110,
    0b11010111,
    0b11011000,
    0b11011001,
    0b11011010,
    0b11011011,
    0b11011100,
    0b11011101,
    0b11011110,
    0b11011111,
    0b11101000,
    0b11101001,
    0b11101010,
    0b11101011,
    0b11101100,
    0b11101101,
    0b11101110,
    0b11101111,
    0b11110000,
    0b11110001,
    0b11110010,
    0b11110011,
    0b11110100,
    0b11110101,
    0b11110110,
    0b11110111,
    0b11111000,
    0b11111001,
    0b11111010,
    0b11111011,
    0b11111100,
    0b11111101,
    0b11111110,
    0b11111111,
]);

// Take an object containing weights and return a closure that can be called
// repeatedly. Also takes a post-processing function. Usage example:
//
// const randomColor = make_randomizer(k => k.toUpperCase(), {
//     "Red": 4,
//     "Blue": 5,
//     "Green": 16
// });
//
// const color1 = randomColor();
// const color2 = randomColor();
// const color3 = randomColor();
//
// (by claude.ai)
function make_randomizer(postprocess, weights) {
    // Precompute total sum
    let totalWeight = 0;

    // Create an array of cumulative thresholds and keys
    const thresholds = [];
    const keys = [];

    for (const key in weights) {
        totalWeight += weights[key];
        thresholds.push(totalWeight);
        keys.push(key);
    }

    // Return a closure that can be called repeatedly
    return function () {
        const rand = gameRand(totalWeight);

        for (let i = 0; i < thresholds.length; i++) {
            if (rand < thresholds[i]) {
                return postprocess(keys[i]);
            }
        }

        throw new Error("Impossible");
    };
}

// Create an object containing pre-computed weighted random functions.
// Usage: texturemap[i] = WeightedRandom.RED();
const WeightedRandom = Object.freeze({
    RED: make_randomizer(k => k | gameRand(4) * 0x1000, {
        [Texture.RED_1]:      157,
        [Texture.RED_2]:      157,
        [Texture.RED_3]:      157,
        [Texture.RED_4]:      157,
        [Texture.RED_5]:      157,
        [Texture.RED_6]:      157,
        [Texture.CRATER_RED]: 22
    }),
    YELLOW: make_randomizer(k => k | gameRand(4) * 0x1000, {
        [Texture.YELLOW_1]:      49,
        [Texture.YELLOW_2]:      49,
        [Texture.CRATER_YELLOW]: 2
    }),
    BROWN: make_randomizer(k => k | gameRand(4) * 0x1000, {
        [Texture.BROWN_1]:      24,
        [Texture.BROWN_2]:      24,
        [Texture.BROWN_3]:      24,
        [Texture.BROWN_4]:      24,
        [Texture.CRATER_BROWN]: 4
    }),
    GREEN: make_randomizer(k => k | gameRand(4) * 0x1000, {
        [Texture.GREEN]:        96,
        [Texture.CRATER_GREEN]: 4
    }),
    CONCRETE: make_randomizer(k => k | gameRand(4) * 0x1000, {
        [Texture.CONCRETE_1]: 50,
        [Texture.CONCRETE_2]: 50
    }),
    ARIZONA: make_randomizer(k => k, {
        "Chevy":                 2,
        "Pickup":                2,
        "WreckedVertCampVan":    2,
        "WreckedSuzukiJeep":     2,
        "BlueCar":               2,
        "WaterTower":            6,
        "Ruin1":                 14,
        "Ruin3":                 14,
        "Ruin5":                 14,
        "Ruin7":                 14,
        "Ruin9":                 14,
        "BarbHUT":               14
    })
});


// // Steepen cliffs
// for (let i = 0; i < MAP_AREA; i++) {
//     if (tiletypemap[i] !== TileType.CLIFF) {
//         continue;
//     }
//
//     const x = i % MAP_WIDTH;
//     const y = Math.floor(i / MAP_WIDTH);
//
//     if (on_border(x, y, 2)) {
//         continue;
//     }
//
//     let v0 = heightmap[i];
//     let v1 = heightmap[i+1];
//     let v2 = heightmap[i+MAP_WIDTH];
//     let v3 = heightmap[i+MAP_WIDTH+1];
//
//     // Case 1: The north edge is sufficiently higher than the south edge
//     if (Math.min(v0, v1) - Math.max(v2, v3) > STEEPNESS) {
//         // Raise the north edge
//         heightmap[i] = heightmap[i+1] = Math.max(heightmap[i-MAP_WIDTH], heightmap[i-MAP_WIDTH+1]);
//
//         // Lower the south edge
//         heightmap[i+MAP_WIDTH] = heightmap[i+MAP_WIDTH+1] = Math.min(heightmap[i+MAP_WIDTH+MAP_WIDTH], heightmap[i+MAP_WIDTH+MAP_WIDTH+1]);
//
//         continue;
//     }
//     // Case 2: The south edge is sufficiently higher than the north edge
//     if (Math.min(v2, v3) - Math.max(v0, v1) > STEEPNESS) {
//         // Raise the south edge
//         heightmap[i+MAP_WIDTH] = heightmap[i+MAP_WIDTH+1] = Math.max(heightmap[i+MAP_WIDTH+MAP_WIDTH], heightmap[i+MAP_WIDTH+MAP_WIDTH+1]);
//
//         // Lower the north edge
//         heightmap[i] = heightmap[i+1] = Math.min(heightmap[i-MAP_WIDTH], heightmap[i-MAP_WIDTH+1]);
//
//         continue;
//     }
//     // Case 3: The west edge is sufficiently higher than the east edge
//     if (Math.min(v0, v2) - Math.max(v1, v3) > STEEPNESS) {
//         // Raise the west edge
//         heightmap[i] = heightmap[i+MAP_WIDTH] = Math.max(heightmap[i-1], heightmap[i+MAP_WIDTH-1]);
//
//         // Lower the east edge
//         heightmap[i+1] = heightmap[i+MAP_WIDTH+1] = Math.min(heightmap[i+1+1], heightmap[i+MAP_WIDTH+1+1]);
//
//         continue;
//     }
//
//     // Case 4: The east edge is sufficiently higher than the west edge
//     if (Math.min(v1, v3) - Math.max(v0, v2) > STEEPNESS) {
//         // Raise the east edge
//         heightmap[i+1] = heightmap[i+MAP_WIDTH+1] = Math.max(heightmap[i+1+1], heightmap[i+MAP_WIDTH+1+1]);
//
//         // Lower the west edge
//         heightmap[i] = heightmap[i+MAP_WIDTH] = Math.min(heightmap[i-1], heightmap[i+MAP_WIDTH-1]);
//
//         continue;
//     }
// }
