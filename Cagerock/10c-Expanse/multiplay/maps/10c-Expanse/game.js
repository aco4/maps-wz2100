// https://github.com/attilabuti/SimplexNoise
b=(x,y,o,a,f,e,l)=>(r=_=>o--?(v+=a*((x,y)=>(k=(x,y,i,j,t=.5-x*x-y*y)=>t>=0&&t**4*(h=p[i+p[j&c]&c]%12&15,u=h<8?x:y,v=h<4?y:0,(h&1?-u:u)+(h&2?-v:v)),70*(k(w=x-((i=~~(x+(s=(x+y)*.5*(d-1))))-(t=(i+(j=~~(y+s)))*(g=(3-d)/6))),z=y-(j-t),i&=c,j&=c)+k(w-(q=w>z)+g,z-!q+g,i+q,j+!q)+k(w-1+2*g,z-1+2*g,i+1,j+1))))(x*f,y*f),r(a*=e,f*=l)):v)(v=0);s=a=>{_=(m=>_=>((t=(t=m((t=m(t=(a=(a|0)+0x9e3779b9|0)^a>>>16,569420461))^t>>>15,0x735a2d97))^t>>>15)>>>0)/4294967296)(Math.imul,c=255);p=[...Array(c+1).keys()].map((v,i,q,h=q[r=i+~~(_(d=3**.5)*(c+1-i))])=>(q[r]=v,h))}

const MAP_WIDTH = 250;
const MAP_LENGTH = 250;
const MAP_AREA = 62500;
const MIN_TILE_HEIGHT = 0;
const MAX_TILE_HEIGHT = 510;
const NUM_PLAYERS = 10;

const STEEPNESS = 40;
const OIL_ATTEMPTS = 350;

// Arizona Tileset (MANY OMITTED)
const Texture = Object.freeze({
    SAND: 12,
    WATER: 17,
    DOUBLE_CLIFF: 18,
    CONCRETE1: 22,
    RED1: 44,
    RED_CRATER: 56,
    CLIFF2: 71,
    CORNER_CLIFF2: 75,
});

const TileType = Object.freeze({
    GROUND: 0,
    CLIFF: 1,
    WATER: 2,
    TRUCK: 3,
    OIL: 4
});

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

//
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

//
function rand(lowerInclusive, upperInclusive) {
    return lowerInclusive + gameRand(upperInclusive - lowerInclusive + 1);
}

// Auto-Cliff Algorithm
// (1) For each of the 4 corners of a tile, compare the two adjacent edges
// (2) If one edge is significantly shorter than the other, mark it.
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
const CliffMap = new Map([
    [0b1010, Texture.CLIFF2 | 0 * 0x1000],
    [0b0101, Texture.CLIFF2 | 1 * 0x1000],
    [0b0110, Texture.CORNER_CLIFF2 | 0 * 0x1000],
    [0b0011, Texture.CORNER_CLIFF2 | 1 * 0x1000],
    [0b1001, Texture.CORNER_CLIFF2 | 2 * 0x1000],
    [0b1100, Texture.CORNER_CLIFF2 | 3 * 0x1000]
]);

const Edge = Object.freeze({
    N: 0b1000,
    E: 0b0100,
    S: 0b0010,
    W: 0b0001
});

function autoCliff(i) {
    const NW = heightmap[i]
    const NE = heightmap[i_E(i)];
    const SW = heightmap[i_S(i)];
    const SE = heightmap[i_SE(i)];

    let bits = 0b0000;

    const lenNorth = Math.abs(NW - NE);
    const lenEast = Math.abs(NE - SE);
    const lenSouth = Math.abs(SW - SE);
    const lenWest = Math.abs(NW - SW);

    const range = Math.max(NW, NE, SW, SE) - Math.min(NW, NE, SW, SE);
    const threshold = Math.floor(range * 0.30);

    // Corner NW
    if (lenWest - lenNorth > threshold) {
        bits |= Edge.N;
    } else if (lenNorth - lenWest > threshold) {
        bits |= Edge.W;
    }
    // Corner NE
    if (lenEast - lenNorth > threshold) {
        bits |= Edge.N;
    } else if (lenNorth - lenEast > threshold) {
        bits |= Edge.E;
    }
    // Corner SE
    if (lenEast - lenSouth > threshold) {
        bits |= Edge.S;
    } else if (lenSouth - lenEast > threshold) {
        bits |= Edge.E;
    }
    // Corner SW
    if (lenWest - lenSouth > threshold) {
        bits |= Edge.S;
    } else if (lenSouth - lenWest > threshold) {
        bits |= Edge.W;
    }

    if (CliffMap.has(bits)) {
        return CliffMap.get(bits);
    } else {
        return Texture.DOUBLE_CLIFF | gameRand(4) * 0x1000;
    }
}

////////////////////////////////////////////////////////////////////////////////

let texturemap = Array(MAP_AREA);
let heightmap = Array(MAP_AREA);
let structures = [];
let droids = [];
let features = [];

let tiletypemap = Array(MAP_AREA);

// Height mapping
s(gameRand());
for (let i = 0; i < MAP_AREA; i++) {
    const x = i % MAP_WIDTH;
    const y = Math.floor(i / MAP_WIDTH);

    heightmap[i] = b(
        /* x           = */ x,
        /* y           = */ y,
        /* octaves     = */ 4,
        /* amplitude   = */ 1,
        /* frequency   = */ 0.015,
        /* persistence = */ 0.5,
        /* lacunarity  = */ 2
    );
}

// Normalize the values to be between [0, 1]
let min = Math.min.apply(null, heightmap);
let max = Math.max.apply(null, heightmap);
let range = max - min;
let scale = MAX_TILE_HEIGHT * 2.05;
let shift = MAX_TILE_HEIGHT * -0.65;

for (let i = 0; i < MAP_AREA; i++) {
    heightmap[i] = Math.max(0, Math.min(MAX_TILE_HEIGHT - 64,
            ((heightmap[i] - min) / range * scale) + shift
    ));
}

// Initialize tiletypemap
for (let i = 0; i < MAP_AREA; i++) {
    let h1 = heightmap[i]
    let h2 = heightmap[i_E (i)];
    let h3 = heightmap[i_S (i)];
    let h4 = heightmap[i_SE(i)];
    if (h1 == 0 && h2 == 0 && h3 == 0 && h4 == 0) {
        tiletypemap[i] = TileType.WATER;
    } else if (Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4) > STEEPNESS) {
        tiletypemap[i] = TileType.CLIFF;
    } else {
        tiletypemap[i] = TileType.GROUND;
    }
}

// Cellular Automata to smooth cliffs + water
for (let numPasses = 0; numPasses < 4; numPasses++) {
    for (let i = 0; i < MAP_AREA; i++) {
        if (tiletypemap[i] == TileType.GROUND) {
            continue;
        }

        const tNW = tiletypemap[i_NW(i)];
        const tN  = tiletypemap[i_N (i)];
        const tNE = tiletypemap[i_NE(i)];
        const tW  = tiletypemap[i_W (i)];
        const tE  = tiletypemap[i_E (i)];
        const tSW = tiletypemap[i_SW(i)];
        const tS  = tiletypemap[i_S (i)];
        const tSE = tiletypemap[i_SE(i)];

        switch (tiletypemap[i]) {
        case TileType.CLIFF:
            const neighbors = (tNW == TileType.CLIFF || tNW == TileType.WATER) +
                              (tN  == TileType.CLIFF || tN  == TileType.WATER) +
                              (tNE == TileType.CLIFF || tNE == TileType.WATER) +
                              (tW  == TileType.CLIFF || tW  == TileType.WATER) +
                              (tE  == TileType.CLIFF || tE  == TileType.WATER) +
                              (tSW == TileType.CLIFF || tSW == TileType.WATER) +
                              (tS  == TileType.CLIFF || tS  == TileType.WATER) +
                              (tSE == TileType.CLIFF || tSE == TileType.WATER);

            if (neighbors <= 3) {
                tiletypemap[i] = TileType.GROUND;
            } else if (neighbors >= 5) {
                tiletypemap[i] = TileType.CLIFF;
            }
            break;

        case TileType.WATER:
            if ((tN != TileType.WATER && tS != TileType.WATER) ||
                (tW != TileType.WATER && tE != TileType.WATER)) {
                tiletypemap[i] = TileType.GROUND;
            }
            break;
        }
    }
}

// Boost cliff heights + prune unboosted cliff tiles
for (let i = 0; i < MAP_AREA; i++) {
    if (tiletypemap[i] != TileType.CLIFF) {
        continue;
    }

    const tNW = tiletypemap[i_NW(i)];
    const tN  = tiletypemap[i_N (i)];
    const tNE = tiletypemap[i_NE(i)];
    const tW  = tiletypemap[i_W (i)];
    const tE  = tiletypemap[i_E (i)];
    const tSW = tiletypemap[i_SW(i)];
    const tS  = tiletypemap[i_S (i)];
    const tSE = tiletypemap[i_SE(i)];

    // Boost
    if (tE == TileType.CLIFF && tS == TileType.CLIFF && tSE == TileType.CLIFF) {
        heightmap[i_SE(i)] = Math.max(128, Math.min(MAX_TILE_HEIGHT, heightmap[i_SE(i)] * 1.60));
    }

    // Prune
    if (
        !(tNW == TileType.CLIFF && tN  == TileType.CLIFF && tW  == TileType.CLIFF) &&
        !(tN  == TileType.CLIFF && tNE == TileType.CLIFF && tE  == TileType.CLIFF) &&
        !(tW  == TileType.CLIFF && tSW == TileType.CLIFF && tS  == TileType.CLIFF) &&
        !(tE  == TileType.CLIFF && tS  == TileType.CLIFF && tSE == TileType.CLIFF)
    ) {
        tiletypemap[i] =  TileType.GROUND;
    }
}

// Scatter trucks
let trucksPlaced = 0;
while (trucksPlaced < NUM_PLAYERS) {
    let x = rand(3, MAP_WIDTH - 4);
    let y = rand(3, MAP_LENGTH - 4);

    let i = MAP_WIDTH * y + x;

    if (
        tiletypemap[i                ] == TileType.GROUND &&
        tiletypemap[i - 1 - MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i -     MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i + 1 - MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i - 1            ] == TileType.GROUND &&
        tiletypemap[i + 1            ] == TileType.GROUND &&
        tiletypemap[i - 1 + MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i +     MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i + 1 + MAP_WIDTH] == TileType.GROUND
    ) {
        tiletypemap[i] = TileType.OIL;
        addFeature(x, y, "OilResource", /*rotation=*/gameRand(4));

        tiletypemap[i - 1 - MAP_WIDTH] = TileType.TRUCK;
        tiletypemap[i + 1 - MAP_WIDTH] = TileType.TRUCK;
        tiletypemap[i - 1 + MAP_WIDTH] = TileType.TRUCK;
        tiletypemap[i + 1 + MAP_WIDTH] = TileType.TRUCK;
        droids.push({
            name: "ConstructionDroid",
            position: [128 * (x - 1) + 64, 128 * (y - 1) + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * (x + 1) + 64, 128 * (y - 1) + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * (x - 1) + 64, 128 * (y + 1) + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * (x + 1) + 64, 128 * (y + 1) + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        trucksPlaced++;
    }
}

// Scatter oils
for (let i = 0; i < OIL_ATTEMPTS; i++) {
    let x = rand(3, MAP_WIDTH - 4);
    let y = rand(3, MAP_LENGTH - 4);

    let i = MAP_WIDTH * y + x;

    if (
        tiletypemap[i                ] == TileType.GROUND &&
        tiletypemap[i - 1 - MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i -     MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i + 1 - MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i - 1            ] == TileType.GROUND &&
        tiletypemap[i + 1            ] == TileType.GROUND &&
        tiletypemap[i - 1 + MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i +     MAP_WIDTH] == TileType.GROUND &&
        tiletypemap[i + 1 + MAP_WIDTH] == TileType.GROUND
    ) {
        tiletypemap[i] = TileType.OIL;
        addFeature(x, y, "OilResource", /*rotation=*/gameRand(4));
        if (gameRand(2)) {
            addStructure(x, y, "A0ResourceExtractor", /*rotation=*/gameRand(4), 0, 10);
        }
    }
}

// Texture mapping
for (let i = 0; i < MAP_AREA; i++) {
    switch (tiletypemap[i]) {
    case TileType.GROUND:
    case TileType.TRUCK:
        if (
            tiletypemap[i_NW(i)] == TileType.WATER ||
            tiletypemap[i_N (i)] == TileType.WATER ||
            tiletypemap[i_NE(i)] == TileType.WATER ||
            tiletypemap[i_W (i)] == TileType.WATER ||
            tiletypemap[i_E (i)] == TileType.WATER ||
            tiletypemap[i_SW(i)] == TileType.WATER ||
            tiletypemap[i_S (i)] == TileType.WATER ||
            tiletypemap[i_SE(i)] == TileType.WATER
        ) {
            texturemap[i] = Texture.SAND;
        } else if (heightmap[i] == heightmap[i_E (i)] &&
                   heightmap[i] == heightmap[i_S (i)] &&
                   heightmap[i] == heightmap[i_SE(i)]) {
            texturemap[i] = Texture.CONCRETE1;
        } else {
            texturemap[i] = Texture.RED1;
        }
        break;

    case TileType.CLIFF:
        texturemap[i] = autoCliff(i);
        break;

    case TileType.WATER:
        texturemap[i] = Texture.WATER;
        break;

    case TileType.OIL:
        texturemap[i] = Texture.RED_CRATER;
        break;
    }
}

setMapData(MAP_WIDTH, MAP_LENGTH, texturemap, heightmap, structures, droids, features);
