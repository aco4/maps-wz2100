// https://github.com/attilabuti/SimplexNoise
b=(x,y,o,a,f,e,l)=>(r=_=>o--?(v+=a*((x,y)=>(k=(x,y,i,j,t=.5-x*x-y*y)=>t>=0&&t**4*(h=p[i+p[j&c]&c]%12&15,u=h<8?x:y,v=h<4?y:0,(h&1?-u:u)+(h&2?-v:v)),70*(k(w=x-((i=~~(x+(s=(x+y)*.5*(d-1))))-(t=(i+(j=~~(y+s)))*(g=(3-d)/6))),z=y-(j-t),i&=c,j&=c)+k(w-(q=w>z)+g,z-!q+g,i+q,j+!q)+k(w-1+2*g,z-1+2*g,i+1,j+1))))(x*f,y*f),r(a*=e,f*=l)):v)(v=0);s=a=>{_=(m=>_=>((t=(t=m((t=m(t=(a=(a|0)+0x9e3779b9|0)^a>>>16,569420461))^t>>>15,0x735a2d97))^t>>>15)>>>0)/4294967296)(Math.imul,c=255);p=[...Array(c+1).keys()].map((v,i,q,h=q[r=i+~~(_(d=3**.5)*(c+1-i))])=>(q[r]=v,h))}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//
// Documentation
//
// "Width"  = Horizontal distance (x)
// "Length" = Vertical distance (y)
// "Height" = Terrain Elevation
//
//    <--mapWidth-->
//
//   +--------------+
//   |              |
//   |              |
//   |  +--------+  |     ^
//   |  |        |  |     |
//   |  |        |  |     |
//   |  |        |  |     |
//   <-->border  |  | mapLength
//   |  | width  |  |     |
//   |  |        |  |     |
//   |  |        |  |     |
//   |  +-^------+  |     v
//   |    |border   |
//   |    |length   |
//   +----v---------+
//
// Map functions use [x,y] coordinates:
//
//     0,0  1,0  2,0
//
//     0,1  1,1  2,1
//
//     0,2  1,2  2,2
//
//     0,3  1,3  2,3
//
// First order variables (hardcoded constants, should never change)
//
//     const CONST_ABSOLUTE_MAP_WIDTH = 250;
//     const CONST_MIN_HEIGHT = 0;
//
// Second order variables (can be manually changed or automatically generated. Either way, should not change once generated)
//
//     let BORDER_WIDTH;
//     {
//         ...
//         BORDER_WIDTH = value + extraBorder;
//     }
//
// Third order variables (everything else)
//
//     let summedBaseWidth_t = 0;
//     let origin = bases[p].bb.NW;
//
// gameRand(n)
//
//     Generates a random number between 0 and n-1 (inclusive). If called without parameters, generates a random number between 0 and 0xffffffff (inclusive).
//



//
// Hardcoded Constants
//
const CONST_ABSOLUTE_MAP_WIDTH = 150; // Width of the map, in tiles
const CONST_ABSOLUTE_MAP_LENGTH = 150; // Length of the map, in tiles
const CONST_MAP_AREA = CONST_ABSOLUTE_MAP_WIDTH * CONST_ABSOLUTE_MAP_LENGTH; // Total number of tiles on the map

const CONST_MIN_HEIGHT = 0;
const CONST_MAX_HEIGHT = 510;

const CONST_NUM_PLAYERS = 4;
const CONST_PLAYERS_PER_TEAM = 2;

const CONST_TILE_XFLIP = 0x8000; // Magic constants corresponding to the game engine's constants
const CONST_TILE_YFLIP = 0x4000;
const CONST_TILE_ROT = 0x1000;
const CONST_DROID_ROT = 0x4000;

const RMAX = 0xffffffff;


//
// Enums
//
const Corner = Object.freeze({
    NW: 0,
    NE: 1,
    SW: 2,
    SE: 3
});

const Texture = Object.freeze({ // Arizona Tileset (NOT COMPREHENSIVE; MANY ARE OMITTED)
    RUBBLE1: 5,
    RUBBLE2: 6,
    RUBBLE3: 7,
    RUBBLE4: 8,
    SANDY_BRUSH1: 9,
    SANDY_BRUSH2: 11,
    RUBBLE4: 8,
    SAND: 12,
    WATER: 17,
    DOUBLE_CLIFF: 18,
    CONCRETE1: 22,
    GREEN_MUD: 23,
    RED_BRUSH1: 44,
    CORNER_CLIFF1: 45,
    CLIFF1: 46,
    RED2: 48,
    RED3: 53,
    RED4: 53,
    RED_CRATER: 56,
    ROAD: 59,
    CLIFF2: 71,
    CORNER_CLIFF2: 75,
    PINK_ROCK: 76,
    CONCRETE2: 77
});

const CliffMap = new Map([
    [0b1010, Texture.CLIFF2 | 0 * CONST_TILE_ROT],
    [0b0101, Texture.CLIFF2 | 1 * CONST_TILE_ROT],
    [0b0110, Texture.CORNER_CLIFF2 | 0 * CONST_TILE_ROT],
    [0b0011, Texture.CORNER_CLIFF2 | 1 * CONST_TILE_ROT],
    [0b1001, Texture.CORNER_CLIFF2 | 2 * CONST_TILE_ROT],
    [0b1100, Texture.CORNER_CLIFF2 | 3 * CONST_TILE_ROT]
]);

const Edge = Object.freeze({
    N: 0b1000,
    E: 0b0100,
    S: 0b0010,
    W: 0b0001
});

//
// Classes
//
class XY {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    add(x, y) {
        return new XY(this.x + x, this.y + y);
    }

    sym() {
        return new XY(
            CONST_ABSOLUTE_MAP_WIDTH - 1 - this.x,
            CONST_ABSOLUTE_MAP_LENGTH - 1 - this.y
        );
    }

    index() {
        return CONST_ABSOLUTE_MAP_WIDTH * this.y + this.x;
    }

    height(corner) {
        switch (corner) {
            case Corner.NW:
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * this.y       + (this.x    )];
            case Corner.NE:
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * this.y       + (this.x + 1)];
            case Corner.SW:
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (this.y + 1) + (this.x    )];
            case Corner.SE:
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (this.y + 1) + (this.x + 1)];
            default:
                throw new Error("Invalid corner parameter");
        }
    }

    flat() {
        const heightNW = this.height(Corner.NW);
        return heightNW == this.height(Corner.NE)
            && heightNW == this.height(Corner.SW)
            && heightNW == this.height(Corner.SE);
    }

    texture() {
        return texture[this.index()];
    }

    water() {
        return this.texture() == Texture.WATER;
    }

    cliff() {
        let t = this.texture();
        return t == (Texture.CLIFF1 | 0 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF2 | 0 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF1 | 0 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF2 | 0 * CONST_TILE_ROT) ||
               t == (Texture.DOUBLE_CLIFF | 0 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF1 | 1 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF2 | 1 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF1 | 1 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF2 | 1 * CONST_TILE_ROT) ||
               t == (Texture.DOUBLE_CLIFF | 1 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF1 | 2 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF2 | 2 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF1 | 2 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF2 | 2 * CONST_TILE_ROT) ||
               t == (Texture.DOUBLE_CLIFF | 2 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF1 | 3 * CONST_TILE_ROT) ||
               t == (Texture.CLIFF2 | 3 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF1 | 3 * CONST_TILE_ROT) ||
               t == (Texture.CORNER_CLIFF2 | 3 * CONST_TILE_ROT) ||
               t == (Texture.DOUBLE_CLIFF | 3 * CONST_TILE_ROT);
    }

    static coordOf(index) {
        const y = Math.floor(index / CONST_ABSOLUTE_MAP_WIDTH);
        const x = index - (y * CONST_ABSOLUTE_MAP_WIDTH);
        return new XY(x, y);
    }
}

class BoundingBox {
     constructor(origin, width_t, length_t, corner = Corner.NW) {
        this.width_t = width_t;
        this.length_t = length_t;

        if (origin == null) {
            return;
        }

        switch (corner) {
            case Corner.NW:
                this.NW = origin;
                this.NE = new XY(origin.x + (width_t - 1), origin.y                 );
                this.SW = new XY(origin.x                , origin.y + (length_t - 1));
                this.SE = new XY(origin.x + (width_t - 1), origin.y + (length_t - 1));
                break;
            case Corner.NE:
                this.NE = origin;
                this.NW = new XY(origin.x - (width_t - 1), origin.y                 );
                this.SE = new XY(origin.x                , origin.y + (length_t - 1));
                this.SW = new XY(origin.x - (width_t - 1), origin.y + (length_t - 1));
                break;
            case Corner.SW:
                this.SW = origin;
                this.NW = new XY(origin.x                , origin.y - (length_t - 1));
                this.SE = new XY(origin.x + (width_t - 1), origin.y                 );
                this.NE = new XY(origin.x + (width_t - 1), origin.y - (length_t - 1));
                break;
            case Corner.SE:
                this.SE = origin;
                this.NE = new XY(origin.x                , origin.y - (length_t - 1));
                this.SW = new XY(origin.x - (width_t - 1), origin.y                 );
                this.NW = new XY(origin.x - (width_t - 1), origin.y - (length_t - 1));
                break;
            default:
                throw new Error("Invalid corner parameter");
        }
    }

    [Symbol.iterator]() {
        let row = 0;
        let col = 0;
        const xy = new XY(this.NW.x, this.NW.y);

        return {
            next: () => {
                if (this.length_t == 0 || this.width_t == 0) {
                    return {done: true};
                }

                if (row >= this.length_t) {
                    return {done: true};
                }

                xy.set(this.NW.x + col, this.NW.y + row)
                let value = {value: xy, done: false};

                col++;

                if (col >= this.width_t) {
                    col = 0;
                    row++;
                }

                return value;
            }
        };
    }
}


//
// Functions
//
function setHeight(xy, h, corner = Corner.NW) {
    switch (corner) {
        case Corner.NW:
            heightmap[xy.index()] = h; // TODO: add out-of-bounds verification?
            break;
        case Corner.NE:
            heightmap[xy.add(1,0).index()] = h;
            break;
        case Corner.SW:
            heightmap[xy.add(0,1).index()] = h;
            break;
        case Corner.SE:
            heightmap[xy.add(1,1).index()] = h;
            break;
        default:
            throw new Error("Invalid corner parameter");
    }
}
function setTileHeight(xy, h) {
    setHeight(xy, h);
    if (xy.x < CONST_ABSOLUTE_MAP_WIDTH - 1)
        setHeight(xy.add(1,0), h);
    if (xy.y < CONST_ABSOLUTE_MAP_LENGTH - 1)
        setHeight(xy.add(0,1), h);
    if (xy.x < CONST_ABSOLUTE_MAP_WIDTH - 1 && xy.y < CONST_ABSOLUTE_MAP_LENGTH - 1)
        setHeight(xy.add(1,1), h);
}
function setTexture(xy, t) {
    texture[xy.index()] = t;
}
function addStructure(xy, name, rotation, modules, player) {
    structures.push({ // For structures 2x2 in size, their position is their SW corner
        name: name,
        position: [128 * xy.x + 64, 128 * xy.y + 64],
        direction: rotation * 0x4000,
        modules: modules,
        player: player
    });
}
function addDroid(xy, name, rotation, player) {
    droids.push({
        name: name,
        position: [128 * xy.x + 64, 128 * xy.y + 64],
        direction: rotation * 0x4000,
        player: player
    });
}
function addFeature(xy, name, rotation) {
    features.push({
        name: name,
        position: [128 * xy.x + 64, 128 * xy.y + 64],
        direction: rotation * 0x4000,
    });
}
function rand(lowerInclusive, upperInclusive) {
    return lowerInclusive + gameRand(upperInclusive - lowerInclusive + 1);
}
// Algorithm
// (1) For each of the 4 corners of a tile, get the height of the 2 adjacent corners.
// (2) Identify the corner that is closer in height. Mark the edge between them as "shortest" (1). If there is a tie, don't mark anything (0).
// (3) Use the following table to set the tile
//
// N E S W Tile     Rotation
// 1   1   straight 0 (or 180)
//   1   1 straight 90 (or 270)
//   1 1   corner   0 (NW peak)
//     1 1 corner   90 (NE peak)
// 1     1 corner   180 (SE peak)
// 1 1     corner   270 (SW peak)
//
// everything else: doublecliff random rotation
function autoCliff(xy) {
    if (xy.flat() || !isSteep(xy))
        return;

    let bits = 0b0000;

    const NW = xy.height(Corner.NW);
    const NE = xy.height(Corner.NE);
    const SW = xy.height(Corner.SW);
    const SE = xy.height(Corner.SE);

    let lenNorth = Math.abs(NW - NE);
    let lenEast = Math.abs(NE - SE);
    let lenSouth = Math.abs(SW - SE);
    let lenWest = Math.abs(NW - SW);

    // Corner.NW
    if (lenNorth < lenWest) {
        bits |= Edge.N;
    } else if (lenWest < lenNorth) {
        bits |= Edge.W;
    }
    // Corner.NE
    if (lenNorth < lenEast) {
        bits |= Edge.N;
    } else if (lenEast < lenNorth) {
        bits |= Edge.E;
    }
    // Corner.SE
    if (lenSouth < lenEast) {
        bits |= Edge.S;
    } else if (lenEast < lenSouth) {
        bits |= Edge.E;
    }
    // Corner.SW
    if (lenSouth < lenWest) {
        bits |= Edge.S;
    } else if (lenWest < lenSouth) {
        bits |= Edge.W;
    }

    if (CliffMap.has(bits)) {
        setTexture(xy, CliffMap.get(bits));
    } else {
        setTexture(xy, Texture.DOUBLE_CLIFF | gameRand(4) * CONST_TILE_ROT);
    }
}
function isSteep(xy) {
    let range =
        Math.max(
            xy.height(Corner.NW),
            xy.height(Corner.NE),
            xy.height(Corner.SW),
            xy.height(Corner.SE)
        )
        -
        Math.min(
            xy.height(Corner.NW),
            xy.height(Corner.NE),
            xy.height(Corner.SW),
            xy.height(Corner.SE)
        );
    return range > 45;
}
function spiralSearch(xy, stopCondition) {
    let x = xy.x;
    let y = xy.y;
    let direction = 0;
    let length = 1;
    let steps = 0;
    let half = 0;
    while (steps < 1296) {
        for (let i = 0; i < length; i++) {
            if (stopCondition(xy) == true)
                return xy;

            switch (direction) {
                case 0: x++; break;
                case 1: y++; break;
                case 2: x--; break;
                case 3: y--; break;
            }
            xy.set(x, y);
            steps++;
        }

        half++;
        if (half == 2) {
            length++;
            half = 0;
        }
        direction++;
        if (direction == 4)
            direction = 0;
    }
    return xy;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let GROUND_TEXTURE = Texture.RED_BRUSH1;

let bb_map = new BoundingBox(
    new XY(0,0),
    CONST_ABSOLUTE_MAP_WIDTH,
    CONST_ABSOLUTE_MAP_LENGTH
);
let bb_inner = new BoundingBox(
    new XY(1,1),
    CONST_ABSOLUTE_MAP_WIDTH - 2,
    CONST_ABSOLUTE_MAP_LENGTH - 2
);

//
// Basic data structures of the map
//
let texture = Array(CONST_MAP_AREA).fill(null);
let heightmap = Array(CONST_MAP_AREA).fill(0);
let structures = [];
let droids = [];
let features = [];


s(gameRand());
for (const xy of bb_map) {
    let value = b(
        /* x           = */ xy.x,
        /* y           = */ xy.y,
        /* octaves     = */ 4,
        /* amplitude   = */ 1,
        /* frequency   = */ 0.015,
        /* persistence = */ 0.5,
        /* lacunarity  = */ 2
    );
    setTexture(xy, GROUND_TEXTURE);
    setHeight(xy, value);
}

// Normalize the values to be between [0, 1]
let min = Math.min.apply(null, heightmap);
let max = Math.max.apply(null, heightmap);
let range = max - min;
let scale = CONST_MAX_HEIGHT * 2.15;
let shift = CONST_MAX_HEIGHT * -0.70;

for (let i = 0; i < heightmap.length; i++) {
    heightmap[i] = Math.max(0, Math.min(CONST_MAX_HEIGHT - 64,
            ((heightmap[i] - min) / range * scale) + shift
    ));
}
// let scale = CONST_MAX_HEIGHT - 64;
// let overshoot = (CONST_MAX_HEIGHT - 64) * 1.35;
//
// for (let i = 0; i < heightmap.length; i++) {
//     heightmap[i] = Math.max(0, Math.min(CONST_MAX_HEIGHT - 64,
//             (((heightmap[i] - min) / range) * (scale + overshoot)) - (overshoot / 2)
//     ));
// }


//
// Auto-cliff
//
for (const xy of bb_map) {
    autoCliff(xy);
}


//
// Cellular Automata to smooth cliffs
//
for (let numPasses = 0; numPasses < 6; numPasses++) {
    for (const xy of bb_inner) {
        if (xy.cliff()) {
            let neighbors =
                xy.add(-1,-1).cliff() +
                xy.add( 0,-1).cliff() +
                xy.add( 1,-1).cliff() +
                xy.add(-1, 0).cliff() +
                // xy.add( 0, 0).cliff() +
                xy.add( 1, 0).cliff() +
                xy.add(-1, 1).cliff() +
                xy.add( 0, 1).cliff() +
                xy.add( 1, 1).cliff();

            if (neighbors <= 3) {
                setTexture(xy, GROUND_TEXTURE);
            } else if (neighbors >= 6) {
                setTexture(xy, Texture.DOUBLE_CLIFF);
            }
        }
    }
}


//
// Boost cliff heights
//
for (const xy of bb_inner) {
    if (xy.cliff() && xy.add( 0,-1).cliff() && xy.add(-1, 0).cliff() && xy.add(-1,-1).cliff())
        setHeight(xy, Math.min(CONST_MAX_HEIGHT, xy.height(Corner.NW) * 1.50))
}


//
// Apply textures
//
for (const xy of bb_map) {
    if (xy.flat()) {
        if (xy.height(Corner.NW) == 0) {
            setTexture(xy, Texture.WATER);
        } else {
            setTexture(xy, Texture.CONCRETE1);
        }
    }
}

//
// Cellular Automata to smooth water
//
for (let numPasses = 0; numPasses < 2; numPasses++) {
    for (const xy of bb_inner) {
        if (xy.texture() == Texture.WATER) {
            if (xy.add(-1,0).texture() != Texture.WATER && xy.add(1,0).texture() != Texture.WATER)
                setTexture(xy, Texture.SAND);
            if (xy.add(0,-1).texture() != Texture.WATER && xy.add(0,1).texture() != Texture.WATER)
                setTexture(xy, Texture.SAND);
        }
    }
}

for (const xy of bb_map) {
    if (
        xy.texture() == GROUND_TEXTURE && (
        xy.add(-1,-1).texture() == Texture.WATER ||
        xy.add( 0,-1).texture() == Texture.WATER ||
        xy.add( 1,-1).texture() == Texture.WATER ||
        xy.add(-1, 0).texture() == Texture.WATER ||
        xy.add( 1, 0).texture() == Texture.WATER ||
        xy.add(-1, 1).texture() == Texture.WATER ||
        xy.add( 0, 1).texture() == Texture.WATER ||
        xy.add( 1, 1).texture() == Texture.WATER)
    ) {
        setTexture(xy, Texture.SAND);
    }
}


//
// Scatter trucks
//
let trucksPlaced = 0;
while (trucksPlaced < CONST_NUM_PLAYERS) {
    let randLoc = new XY(
        rand(3,CONST_ABSOLUTE_MAP_WIDTH-3),
        rand(3,CONST_ABSOLUTE_MAP_LENGTH-3)
    );
    let collision = false;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let check = randLoc.add(i,j);
            if (check.cliff() || check.water()) {
                collision = true;
                break;
            }
        }
        if (collision)
            break;
    }
    if (collision)
        continue;

    addDroid(randLoc, "ConstructionDroid", /*rotation=*/gameRand(4), /*player=*/trucksPlaced);
    trucksPlaced++;
}
// let pos0 = new XY(
//     1 * Math.floor(CONST_ABSOLUTE_MAP_WIDTH / 4),
//     1 * Math.floor(CONST_ABSOLUTE_MAP_LENGTH / 4)
// );
// let pos1 = new XY(
//     3 * Math.floor(CONST_ABSOLUTE_MAP_WIDTH / 4),
//     1 * Math.floor(CONST_ABSOLUTE_MAP_LENGTH / 4)
// );
// let pos2 = new XY(
//     1 * Math.floor(CONST_ABSOLUTE_MAP_WIDTH / 4),
//     3 * Math.floor(CONST_ABSOLUTE_MAP_LENGTH / 4)
// );
// let pos3 = new XY(
//     3 * Math.floor(CONST_ABSOLUTE_MAP_WIDTH / 4),
//     3 * Math.floor(CONST_ABSOLUTE_MAP_LENGTH / 4)
// );
// let starts = [pos0, pos1, pos2, pos3];
// for (let i = 0; i < starts.length; i++) {
//     let endpoint = spiralSearch(starts[i], (xy) => {
//         return xy.texture() == Texture.CONCRETE1;
//     });
//     addDroid(endpoint, "ConstructionDroid", /*rotation=*/gameRand(4), /*player=*/i);
// }

//
// Scatter oils
//
let oilsPlaced = 0;
while (oilsPlaced < 20 * CONST_NUM_PLAYERS) {
    let randLoc = new XY(
        rand(3,CONST_ABSOLUTE_MAP_WIDTH-3),
        rand(3,CONST_ABSOLUTE_MAP_LENGTH-3)
    );
    let collision = false;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let check = randLoc.add(i,j);
            if (check.cliff() || check.water()) {
                collision = true;
                break;
            }
        }
        if (collision)
            break;
    }
    if (collision)
        continue;

    addFeature(randLoc, "OilResource", /*rotation=*/gameRand(4));
    setTexture(randLoc, Texture.RED_CRATER);
    oilsPlaced++;
}


// Return the data.
setMapData(CONST_ABSOLUTE_MAP_WIDTH, CONST_ABSOLUTE_MAP_LENGTH, texture, heightmap, structures, droids, features);
