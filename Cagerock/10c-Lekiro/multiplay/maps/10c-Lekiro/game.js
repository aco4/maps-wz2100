// https://github.com/attilabuti/SimplexNoise
b=(x,y,o,a,f,e,l)=>(r=_=>o--?(v+=a*((x,y)=>(k=(x,y,i,j,t=.5-x*x-y*y)=>t>=0&&t**4*(h=p[i+p[j&c]&c]%12&15,u=h<8?x:y,v=h<4?y:0,(h&1?-u:u)+(h&2?-v:v)),70*(k(w=x-((i=~~(x+(s=(x+y)*.5*(d-1))))-(t=(i+(j=~~(y+s)))*(g=(3-d)/6))),z=y-(j-t),i&=c,j&=c)+k(w-(q=w>z)+g,z-!q+g,i+q,j+!q)+k(w-1+2*g,z-1+2*g,i+1,j+1))))(x*f,y*f),r(a*=e,f*=l)):v)(v=0);s=a=>{_=(m=>_=>((t=(t=m((t=m(t=(a=(a|0)+0x9e3779b9|0)^a>>>16,569420461))^t>>>15,0x735a2d97))^t>>>15)>>>0)/4294967296)(Math.imul,c=255);p=[...Array(c+1).keys()].map((v,i,q,h=q[r=i+~~(_(d=3**.5)*(c+1-i))])=>(q[r]=v,h))}


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
// gameRand(n)
//
//     Generates a random number between 0 and n-1 (inclusive). If called without parameters, generates a random number between 0 and 0xffffffff (inclusive).
//


//
// Hardcoded Constants
//
const CONST_ABSOLUTE_MAP_WIDTH = 250; // Width of the map, in tiles
const CONST_ABSOLUTE_MAP_LENGTH = 250; // Length of the map, in tiles
const CONST_MAP_AREA = CONST_ABSOLUTE_MAP_WIDTH * CONST_ABSOLUTE_MAP_LENGTH; // Total number of tiles on the map

const CONST_MIN_HEIGHT = 0;
const CONST_MAX_HEIGHT = 510;

const CONST_NUM_PLAYERS = 10;

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
    RED1: 44,
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

const TileType = Object.freeze({
    WATER: 0,
    CLIFF: 1,
    GROUND: 2
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
class BoundingBox {
     constructor(x, y, width_t, length_t, corner = Corner.NW) {
        this.x = x;
        this.y = y;
        this.width_t = width_t;
        this.length_t = length_t;

        switch (corner) {
            case Corner.NW:
                this.NW = [x                , y                 ];
                this.NE = [x + (width_t - 1), y                 ];
                this.SW = [x                , y + (length_t - 1)];
                this.SE = [x + (width_t - 1), y + (length_t - 1)];
                break;
            case Corner.NE:
                this.NE = [x                , y                 ];
                this.NW = [x + (width_t - 1), y                 ];
                this.SE = [x                , y + (length_t - 1)];
                this.SW = [x + (width_t - 1), y + (length_t - 1)];
                break;
            case Corner.SW:
                this.SW = [x                , y                 ];
                this.SE = [x + (width_t - 1), y                 ];
                this.NW = [x                , y + (length_t - 1)];
                this.NE = [x + (width_t - 1), y + (length_t - 1)];
                break;
            case Corner.SE:
                this.SE = [x                , y                 ];
                this.SW = [x + (width_t - 1), y                 ];
                this.NE = [x                , y + (length_t - 1)];
                this.NW = [x + (width_t - 1), y + (length_t - 1)];
                break;
            default:
                throw new Error("Invalid corner parameter");
        }
    }

    [Symbol.iterator]() {
        let row = 0;
        let col = 0;

        return {
            next: () => {
                if (this.length_t == 0 || this.width_t == 0) {
                    return {done: true};
                }

                if (row >= this.length_t) {
                    return {done: true};
                }

                let value = {value: [this.x + col, this.y + row], done: false};

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
function index(x, y) {
    return CONST_ABSOLUTE_MAP_WIDTH * y + x;
}
function coord(idx) {
    const y = Math.floor(idx / CONST_ABSOLUTE_MAP_WIDTH);
    const x = idx - (y * CONST_ABSOLUTE_MAP_WIDTH);
    return [x, y];
}
function inBounds(x, y) {
    return x >= 0 && x < CONST_ABSOLUTE_MAP_WIDTH && y >= 0 && y < CONST_ABSOLUTE_MAP_LENGTH;
}

function height(x, y, corner = Corner.NW) {
    switch (corner) {
        case Corner.NW:
            if (inBounds(x, y))
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (y    ) + (x    )];
            break;
        case Corner.NE:
            if (inBounds(x + 1, y))
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (y    ) + (x + 1)];
            break;
        case Corner.SW:
            if (inBounds(x, y + 1))
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (y + 1) + (x    )];
            break;
        case Corner.SE:
            if (inBounds(x + 1, y + 1))
                return heightmap[CONST_ABSOLUTE_MAP_WIDTH * (y + 1) + (x + 1)];
            break;
        default:
            throw new Error("Invalid corner");
    }
    return 0;
}
function setHeight(x, y, h, corner = Corner.NW) {
    switch (corner) {
        case Corner.NW:
            if (inBounds(x, y))
                heightmap[index(x, y)] = h;
            break;
        case Corner.NE:
            if (inBounds(x + 1, y))
                heightmap[index(x + 1, y)] = h;
            break;
        case Corner.SW:
            if (inBounds(x, y + 1))
                heightmap[index(x, y + 1)] = h;
            break;
        case Corner.SE:
            if (inBounds(x + 1, y + 1))
                heightmap[index(x + 1, y + 1)] = h;
            break;
        default:
            throw new Error("Invalid corner parameter");
    }
}
function setTileHeight(x, y, h) {
    setHeight(x, y, h, Corner.NW);
    setHeight(x, y, h, Corner.NE);
    setHeight(x, y, h, Corner.SW);
    setHeight(x, y, h, Corner.SE);
}
function flat(x, y) {
    const heightNW = height(x, y, Corner.NW);
    return heightNW == height(x, y, Corner.NE) && heightNW == height(x, y, Corner.SW) && heightNW == height(x, y, Corner.SE);
}
function steep(x, y) {
    let h1 = height(x, y, Corner.NW);
    let h2 = height(x, y, Corner.NE);
    let h3 = height(x, y, Corner.SW);
    let h4 = height(x, y, Corner.SE);
    let range = Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4);
    return range > 40;
}


function texture(x, y) {
    if (inBounds(x, y)) {
        return texturemap[index(x, y)];
    }
    return null;
}
function setTexture(x, y, t) {
    texturemap[index(x, y)] = t;
}
function tileType(x, y) {
    if (inBounds(x, y)) {
        return tiletypemap[index(x, y)];
    }
    return null;
}
function setTileType(x, y, t) {
    if (inBounds(x, y))
        tiletypemap[index(x, y)] = t;
}
function water(x, y) {
    return tileType(x, y) == TileType.WATER;
}
function cliff(x, y) {
    return tileType(x, y) == TileType.CLIFF;
}
function ground(x, y) {
    return tileType(x, y) == TileType.GROUND;
}


function addStructure(x, y, name, rotation, modules, player) {
    structures.push({ // For structures 2x2 in size, their position is their SW corner
        name: name,
        position: [128 * x + 64, 128 * y + 64],
        direction: rotation * 0x4000,
        modules: modules,
        player: player
    });
}
function addDroid(x, y, name, rotation, player) {
    droids.push({
        name: name,
        position: [128 * x + 64, 128 * y + 64],
        direction: rotation * 0x4000,
        player: player
    });
}
function addFeature(x, y, name, rotation) {
    features.push({
        name: name,
        position: [128 * x + 64, 128 * y + 64],
        direction: rotation * 0x4000,
    });
}


function rand(lowerInclusive, upperInclusive) {
    return lowerInclusive + gameRand(upperInclusive - lowerInclusive + 1);
}


function dumbCliff(x, y) {
    if (steep(x, y))
        setTileType(x, y, TileType.CLIFF);
}
// Algorithm
// (1) For each of the 4 corners of a tile, get the height of the 2 adjacent corners.
// (2) Identify the corner that is closer in height. Mark the edge between them as "shortest" (1). If there is a tie, don't mark anything (0). // TODO: should be "If the two edges are too similar, don't mark anything"
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
function autoCliff(x, y) {
    if (flat(x, y) || !steep(x, y))
        return;

    let bits = 0b0000;

    const NW = height(x, y, Corner.NW);
    const NE = height(x, y, Corner.NE);
    const SW = height(x, y, Corner.SW);
    const SE = height(x, y, Corner.SE);

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
        setTexture(x, y, CliffMap.get(bits));
        setTileType(x, y, TileType.CLIFF);
    } else {
        setTexture(x, y, Texture.DOUBLE_CLIFF | gameRand(4) * CONST_TILE_ROT);
        setTileType(x, y, TileType.CLIFF);
    }
}


function spiralSearch(x, y, stopCondition) {
    let direction = 0;
    let length = 1;
    let steps = 0;
    let half = 0;
    while (steps < 1296) {
        for (let i = 0; i < length; i++) {
            if (stopCondition(x, y) == true)
                return [x, y];

            switch (direction) {
                case 0: x++; break;
                case 1: y++; break;
                case 2: x--; break;
                case 3: y--; break;
            }
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
    throw new Error(`Spiral search algorithm failed to find suitable target after ${steps} steps. Last location checked: ${x}, ${y}`);
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


let GROUND_TEXTURE = Texture.RED1;


let bb_map = new BoundingBox(
    0, 0,
    CONST_ABSOLUTE_MAP_WIDTH,
    CONST_ABSOLUTE_MAP_LENGTH
);


//
// Create the basic data structures of the map
//
let texturemap = Array(CONST_MAP_AREA).fill(null);
let tiletypemap = Array(CONST_MAP_AREA).fill(null); // For internal use. CLIFF, WATER, GROUND, etc.
let heightmap = Array(CONST_MAP_AREA).fill(0);
let structures = [];
let droids = [];
let features = [];


//
// Height mapping
//
s(gameRand());
for (const [x, y] of bb_map) {
    let value = b(
        /* x           = */ x,
        /* y           = */ y,
        /* octaves     = */ 4,
        /* amplitude   = */ 1,
        /* frequency   = */ 0.015,
        /* persistence = */ 0.5,
        /* lacunarity  = */ 2
    );
    setHeight(x, y, value);
}

// Normalize the values to be between [0, 1]
let min = Math.min.apply(null, heightmap);
let max = Math.max.apply(null, heightmap);
let range = max - min;
let scale = CONST_MAX_HEIGHT * 2.05;
let shift = CONST_MAX_HEIGHT * -0.65;

for (let i = 0; i < heightmap.length; i++) {
    heightmap[i] = Math.max(0, Math.min(CONST_MAX_HEIGHT - 64,
            ((heightmap[i] - min) / range * scale) + shift
    ));
}


//
// Texture mapping + initial auto-cliff
//
for (const [x, y] of bb_map) {
    if (flat(x, y)) {
        if (height(x, y, Corner.NW) == 0) {
            setTexture(x, y, Texture.WATER);
            setTileType(x, y, TileType.WATER);
        } else {
            setTexture(x, y, Texture.CONCRETE1);
            setTileType(x, y, TileType.GROUND);
        }
    } else {
        setTexture(x, y, GROUND_TEXTURE);
        setTileType(x, y, TileType.GROUND);
    }

    dumbCliff(x, y);
}


//
// Cellular Automata to smooth cliffs + water
//
for (let numPasses = 0; numPasses < 6; numPasses++) {
    for (const [x, y] of bb_map) {
        if (cliff(x, y)) {
            let neighbors = cliff(x - 1, y - 1) +
                            cliff(x    , y - 1) +
                            cliff(x + 1, y - 1) +
                            cliff(x - 1, y    ) +
                            cliff(x + 1, y    ) +
                            cliff(x - 1, y + 1) +
                            cliff(x    , y + 1) +
                            cliff(x + 1, y + 1);
            if (neighbors <= 3) {
                setTexture(x, y, GROUND_TEXTURE);
                setTileType(x, y, TileType.GROUND);
            } else if (neighbors >= 6) {
                setTexture(x, y, Texture.DOUBLE_CLIFF);
                setTileType(x, y, TileType.CLIFF);
            }
        }

        if (
            water(x, y) && (
                (!water(x - 1, y) && !water(x + 1, y)) ||
                (!water(x, y - 1) && !water(x, y + 1))
            )
        ) {
            setTexture(x, y, Texture.SAND);
            setTileType(x, y, TileType.GROUND);
        }
    }
}


//
// Boost cliff heights + prune unboosted cliff tiles
//
for (const [x, y] of bb_map) {
    // NOTE: Boosting can make dumb-cliffed tiles FLATTER. This is unintentional, but OK! The auto-cliff system will make 1-tile wide cliffs that actually look fine.
    if (cliff(x, y) && cliff(x, y - 1) && cliff(x - 1, y) && cliff(x - 1, y - 1))
        setHeight(x, y, Math.min(CONST_MAX_HEIGHT, height(x, y, Corner.NW) * 1.60))

    if (cliff(x, y) && (
        !(cliff(x - 1, y - 1) && cliff(x, y - 1) && cliff(x - 1, y)) &&
        !(cliff(x, y - 1) && cliff(x + 1, y - 1) && cliff(x + 1, y)) &&
        !(cliff(x - 1, y) && cliff(x - 1, y + 1) && cliff(x, y + 1)) &&
        !(cliff(x + 1, y) && cliff(x, y + 1) && cliff(x + 1, y + 1))
    )) {
        setTexture(x, y, GROUND_TEXTURE);
        setTileType(x, y, TileType.GROUND);
    }
}


//
// Final cliff mapping + sand placement
//
for (const [x, y] of bb_map) {
    if (cliff(x, y))
        autoCliff(x, y);

    if (
        ground(x, y) && (
            water(x - 1, y - 1) ||
            water(x    , y - 1) ||
            water(x + 1, y - 1) ||
            water(x - 1, y    ) ||
            water(x + 1, y    ) ||
            water(x - 1, y + 1) ||
            water(x    , y + 1) ||
            water(x + 1, y + 1)
        )
    ) {
        setTexture(x, y, Texture.SAND);
    }
}


//
// Scatter trucks
//
let trucksPlaced = 0;
while (trucksPlaced < CONST_NUM_PLAYERS) {
    let x = rand(3, CONST_ABSOLUTE_MAP_WIDTH - 4);
    let y = rand(3, CONST_ABSOLUTE_MAP_LENGTH - 4);
    let collision = false;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (cliff(x + i, y + j) || water(x + i, y + j)) {
                collision = true;
                break;
            }
        }
        if (collision)
            break;
    }
    if (collision)
        continue;

    addDroid(x, y, "ConstructionDroid", /*rotation=*/gameRand(4), /*player=*/trucksPlaced);
    trucksPlaced++;
}


//
// Scatter oils
//
let oilsPlaced = 0;
while (oilsPlaced < 20 * CONST_NUM_PLAYERS) {
    let x = rand(3, CONST_ABSOLUTE_MAP_WIDTH - 4);
    let y = rand(3, CONST_ABSOLUTE_MAP_LENGTH - 4);
    let collision = false;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (cliff(x + i, y + j) || water(x + i, y + j)) {
                collision = true;
                break;
            }
        }
        if (collision)
            break;
    }
    if (collision)
        continue;

    addFeature(x, y, "OilResource", /*rotation=*/gameRand(4));
    setTexture(x, y, Texture.RED_CRATER);
    oilsPlaced++;
}


// Return the data.
setMapData(CONST_ABSOLUTE_MAP_WIDTH, CONST_ABSOLUTE_MAP_LENGTH, texturemap, heightmap, structures, droids, features);
