// https://github.com/attilabuti/SimplexNoise
b=(x,y,o,a,f,e,l)=>(r=_=>o--?(v+=a*((x,y)=>(k=(x,y,i,j,t=.5-x*x-y*y)=>t>=0&&t**4*(h=p[i+p[j&c]&c]%12&15,u=h<8?x:y,v=h<4?y:0,(h&1?-u:u)+(h&2?-v:v)),70*(k(w=x-((i=~~(x+(s=(x+y)*.5*(d-1))))-(t=(i+(j=~~(y+s)))*(g=(3-d)/6))),z=y-(j-t),i&=c,j&=c)+k(w-(q=w>z)+g,z-!q+g,i+q,j+!q)+k(w-1+2*g,z-1+2*g,i+1,j+1))))(x*f,y*f),r(a*=e,f*=l)):v)(v=0);s=a=>{_=(m=>_=>((t=(t=m((t=m(t=(a=(a|0)+0x9e3779b9|0)^a>>>16,569420461))^t>>>15,0x735a2d97))^t>>>15)>>>0)/4294967296)(Math.imul,c=255);p=[...Array(c+1).keys()].map((v,i,q,h=q[r=i+~~(_(d=3**.5)*(c+1-i))])=>(q[r]=v,h))}

const MAP_WIDTH = 250;
const MAP_LENGTH = 250;
const MAP_AREA = 62500;
const MIN_TILE_HEIGHT = 0;
const MAX_TILE_HEIGHT = 510;
const NUM_PLAYERS = 10;

const STEEPNESS = 30;
const OIL_CHANCE = 70;
const FLOOD_AREA = 761;

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
    BASE: 1,
    TRUCK: 2,
    SCAV: 3,
    CLIFF: 4,
    WATER: 5,
    OIL: 6,
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
    const NW = heightmap[i];
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

function decorate(i, x, y) {
    if (gameRand(6)) { // 1/6 chance of decorating a tile
        return;
    }

    if (tiletypemap[i] == TileType.BASE) {
        switch (gameRand(2)) {
        case 0:
            structures.push({
                name: "LookOutTower",
                position: [128 * x + 64, 128 * y + 64],
                direction: gameRand(4) * 0x4000,
                modules: 0,
                player: 10
            });
            break;
        case 1:
            structures.push({
                name: "A0TankTrap",
                position: [128 * x + 64, 128 * y + 64],
                direction: gameRand(4) * 0x4000,
                modules: 0,
                player: 10
            });
            break;
        }
    } else {
        switch (gameRand(6)) {
        case 0:
        case 1:
        case 2:
        case 3:
            structures.push({
                name: "A0BaBaBunker",
                position: [128 * x + 64, 128 * y + 64],
                direction: gameRand(4) * 0x4000,
                modules: 0,
                player: 10
            });
            break;
        case 4:
            structures.push({
                name: "LookOutTower",
                position: [128 * x + 64, 128 * y + 64],
                direction: gameRand(4) * 0x4000,
                modules: 0,
                player: 10
            });

            break;
        case 5:
            structures.push({
                name: "A0TankTrap",
                position: [128 * x + 64, 128 * y + 64],
                direction: gameRand(4) * 0x4000,
                modules: 0,
                player: 10
            });
            break;
        }
    }
    tiletypemap[i] = TileType.SCAV;
}

////////////////////////////////////////////////////////////////////////////////

let texturemap = Array(MAP_AREA);
let heightmap = Array(MAP_AREA);
let structures = [];
let droids = [];
let features = [];

let tiletypemap = Array(MAP_AREA);
let cliff_tiles = new Set();
let water_tiles = new Set();
let flood_array = Array(FLOOD_AREA);

// Height mapping
s(gameRand());
for (let i = 0; i < MAP_AREA; i++) {
    const x = i % MAP_WIDTH;
    const y = Math.floor(i / MAP_WIDTH);

    heightmap[i] = b(
        /* x           = */ x,
        /* y           = */ y,
        /* octaves     = */ 3,
        /* amplitude   = */ 1,
        /* frequency   = */ 0.01,
        /* persistence = */ 0.55,
        /* lacunarity  = */ 2.41
    );
}

// Normalize the values
let min = heightmap[0];
let max = heightmap[0];
for (let i = 1; i < MAP_AREA; i++) {
    const height = heightmap[i];
    if (height < min) min = height;
    if (height > max) max = height;
}
let range = max - min;
let scale = MAX_TILE_HEIGHT * 2.00;
let shift = MAX_TILE_HEIGHT * -0.65;
for (let i = 0; i < MAP_AREA; i++) {
    heightmap[i] = Math.max(0, Math.min(MAX_TILE_HEIGHT - 64,
            ((heightmap[i] - min) / range * scale) + shift
    ));

    // Initialize tiletypemap
    iN = i_N(i);
    iW = i_W(i);
    iNW = i_NW(i);
    const h1 = heightmap[i]
    const h2 = heightmap[iN];
    const h3 = heightmap[iW];
    const h4 = heightmap[iNW];
    if (h1 == 0 && h2 == 0 && h3 == 0 && h4 == 0) {
        tiletypemap[iNW] = TileType.WATER;
        water_tiles.add(iNW);
    } else if (Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4) > STEEPNESS) {
        tiletypemap[iNW] = TileType.CLIFF;
        cliff_tiles.add(iNW);
    } else {
        tiletypemap[iNW] = TileType.GROUND;
    }
}
for (let i = MAP_WIDTH - 1; i < MAP_AREA; i += MAP_WIDTH) {
    tiletypemap[i] = TileType.CLIFF;
    cliff_tiles.add(i);
}
for (let i = MAP_AREA - MAP_WIDTH; i < MAP_AREA; i++) {
    tiletypemap[i] = TileType.CLIFF;
    cliff_tiles.add(i);
}

// Smooth cliffs
for (const i of cliff_tiles) {
    // Ignore tiles on the map edge
    if (i < MAP_WIDTH ||i >= MAP_AREA - MAP_WIDTH || i % MAP_WIDTH == 0 || (i + 1) % MAP_WIDTH == 0) {
        continue;
    }

    let bitmap = 0b00000000;

    if (tiletypemap[i - 1 - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b10000000; // NW
    if (tiletypemap[i     - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b01000000; // N
    if (tiletypemap[i + 1 - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00100000; // NE
    if (tiletypemap[i - 1            ] == TileType.CLIFF) bitmap |= 0b00010000; // W
    if (tiletypemap[i + 1            ] == TileType.CLIFF) bitmap |= 0b00001000; // E
    if (tiletypemap[i - 1 + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000100; // SW
    if (tiletypemap[i     + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000010; // S
    if (tiletypemap[i + 1 + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000001; // SE

    if (!CliffLife.has(bitmap)) {
        tiletypemap[i] = TileType.GROUND;
        cliff_tiles.delete(i);
    }
}


// Smooth water
for (const i of water_tiles) {
    // Ignore tiles on the map edge
    if (i < MAP_WIDTH ||i >= MAP_AREA - MAP_WIDTH || i % MAP_WIDTH == 0 || (i + 1) % MAP_WIDTH == 0) {
        continue;
    }

    let bitmap = 0b00000000;

    if (tiletypemap[i - 1 - MAP_WIDTH] == TileType.WATER) bitmap |= 0b10000000; // NW
    if (tiletypemap[i     - MAP_WIDTH] == TileType.WATER) bitmap |= 0b01000000; // N
    if (tiletypemap[i + 1 - MAP_WIDTH] == TileType.WATER) bitmap |= 0b00100000; // NE
    if (tiletypemap[i - 1            ] == TileType.WATER) bitmap |= 0b00010000; // W
    if (tiletypemap[i + 1            ] == TileType.WATER) bitmap |= 0b00001000; // E
    if (tiletypemap[i - 1 + MAP_WIDTH] == TileType.WATER) bitmap |= 0b00000100; // SW
    if (tiletypemap[i     + MAP_WIDTH] == TileType.WATER) bitmap |= 0b00000010; // S
    if (tiletypemap[i + 1 + MAP_WIDTH] == TileType.WATER) bitmap |= 0b00000001; // SE

    if (!WaterLife.has(bitmap)) {
        tiletypemap[i] = TileType.GROUND;
        water_tiles.delete(i);
    }
}

// Boost cliff heights
for (const i of cliff_tiles) {
    if (tiletypemap[i_N (i)] == TileType.CLIFF &&
        tiletypemap[i_W (i)] == TileType.CLIFF &&
        tiletypemap[i_NW(i)] == TileType.CLIFF) {

        const boost = 1.5 + gameRand(6) / 10;
        heightmap[i] = Math.max(96 + gameRand(96), Math.min(MAX_TILE_HEIGHT - gameRand(32), heightmap[i] * boost));
    }
}

// Scatter trucks
let trucksPlaced = 0;
while (trucksPlaced < NUM_PLAYERS) {
    let i = gameRand((MAP_WIDTH - 6) * (MAP_LENGTH - 6));
    const x = 3 + (i % (MAP_WIDTH - 6));
    const y = 3 + Math.floor(i / (MAP_WIDTH - 6));
    i = MAP_WIDTH * y + x;

    if (tiletypemap[i] != TileType.GROUND) {
        continue;
    }

    // Flood fill
    flood_array[0] = i;

    let flooded_tiles = new Set();
    flooded_tiles.add(i);

    let collision = false;

    let head = 1; // Points to the last added tile

    for (let tail = 0; tail < head && head < FLOOD_AREA; tail++) {
        const tile_idx1 = flood_array[tail] - 1;
        const tile_idx2 = flood_array[tail] + 1;
        const tile_idx3 = flood_array[tail] - MAP_WIDTH;
        const tile_idx4 = flood_array[tail] + MAP_WIDTH;
        const tile1 = tiletypemap[tile_idx1];
        const tile2 = tiletypemap[tile_idx2];
        const tile3 = tiletypemap[tile_idx3];
        const tile4 = tiletypemap[tile_idx4];

        // If collision with another player's flood fill
        if (tile1 == TileType.BASE || tile2 == TileType.BASE || tile3 == TileType.BASE || tile4 == TileType.BASE) {
            collision = true;
            break;
        }

        if (tile1 == TileType.GROUND && !flooded_tiles.has(tile_idx1)) {
            flood_array[head] = tile_idx1;
            flooded_tiles.add(tile_idx1);
            head++;
        }
        if (tile2 == TileType.GROUND && !flooded_tiles.has(tile_idx2)) {
            flood_array[head] = tile_idx2;
            flooded_tiles.add(tile_idx2);
            head++;
        }
        if (tile3 == TileType.GROUND && !flooded_tiles.has(tile_idx3)) {
            flood_array[head] = tile_idx3;
            flooded_tiles.add(tile_idx3);
            head++;
        }
        if (tile4 == TileType.GROUND && !flooded_tiles.has(tile_idx4)) {
            flood_array[head] = tile_idx4;
            flooded_tiles.add(tile_idx4);
            head++;
        }
    }

    if (!collision && head >= FLOOD_AREA) {

        for (const idx of flood_array) {
            tiletypemap[idx] = TileType.BASE;
        }

        // Place trucks randomly in the middle of the flood filled area
        // The trucks could be placed in the map boundary region, but that's fine
        let rand = 0;
        const truck_1_x = flood_array[rand] % MAP_WIDTH
        const truck_1_y = Math.floor(flood_array[rand] / MAP_WIDTH);
        tiletypemap[flood_array[rand]] = TileType.TRUCK;

        rand += gameRand(2) + 1;
        const truck_2_x = flood_array[rand] % MAP_WIDTH
        const truck_2_y = Math.floor(flood_array[rand] / MAP_WIDTH);
        tiletypemap[flood_array[rand]] = TileType.TRUCK;

        rand += gameRand(2) + 1;
        const truck_3_x = flood_array[rand] % MAP_WIDTH
        const truck_3_y = Math.floor(flood_array[rand] / MAP_WIDTH);
        tiletypemap[flood_array[rand]] = TileType.TRUCK;

        rand += gameRand(2) + 1;
        const truck_4_x = flood_array[rand] % MAP_WIDTH
        const truck_4_y = Math.floor(flood_array[rand] / MAP_WIDTH);
        tiletypemap[flood_array[rand]] = TileType.TRUCK;

        droids.push({
            name: "ConstructionDroid",
            position: [128 * truck_1_x + 64, 128 * truck_1_y + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * truck_2_x + 64, 128 * truck_2_y + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * truck_3_x + 64, 128 * truck_3_y + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        droids.push({
            name: "ConstructionDroid",
            position: [128 * truck_4_x + 64, 128 * truck_4_y + 64],
            direction: gameRand(0x10000),
            player: trucksPlaced
        });
        trucksPlaced++;
    }
}

// Oil scattering + ground texturing
for (let i = 0; i < MAP_AREA; i++) {
    switch (tiletypemap[i]) {
    case TileType.GROUND:
    case TileType.BASE:
        if (!gameRand(OIL_CHANCE)) {
            const x = i % MAP_WIDTH;
            const y = Math.floor(i / MAP_WIDTH);

            if ((
                    // This tile must not be too close to the map edge
                    x >= 4 && y >= 4 && x <= MAP_WIDTH - 5 && y <= MAP_LENGTH - 5
                ) && (
                    // The 8 tiles surrounding this one must be BASE (1) or GROUND (0)
                    tiletypemap[i - 1 - MAP_WIDTH] <= TileType.BASE &&
                    tiletypemap[i     - MAP_WIDTH] <= TileType.BASE &&
                    tiletypemap[i + 1 - MAP_WIDTH] <= TileType.BASE &&
                    tiletypemap[i - 1            ] <= TileType.BASE &&
                    tiletypemap[i + 1            ] <= TileType.BASE &&
                    tiletypemap[i - 1 + MAP_WIDTH] <= TileType.BASE &&
                    tiletypemap[i     + MAP_WIDTH] <= TileType.BASE &&
                    tiletypemap[i + 1 + MAP_WIDTH] <= TileType.BASE
                )
            ) {
                features.push({
                    name: "OilResource",
                    position: [128 * x + 64, 128 * y + 64],
                    direction: gameRand(4) * 0x4000,
                });

                if (tiletypemap[i] == TileType.BASE ? !gameRand(4) : gameRand(2)) {
                    structures.push({
                        name: "A0ResourceExtractor",
                        position: [128 * x + 64, 128 * y + 64],
                        direction: gameRand(4) * 0x4000,
                        modules: 0,
                        player: 10
                    });
                }

                decorate(i - 1 - MAP_WIDTH, x - 1, y - 1);
                decorate(i     - MAP_WIDTH, x    , y - 1);
                decorate(i + 1 - MAP_WIDTH, x + 1, y - 1);
                decorate(i - 1            , x - 1, y    );
                decorate(i + 1            , x + 1, y    );
                decorate(i - 1 + MAP_WIDTH, x - 1, y + 1);
                decorate(i     + MAP_WIDTH, x    , y + 1);
                decorate(i + 1 + MAP_WIDTH, x + 1, y + 1);

                tiletypemap[i] = TileType.OIL;
                texturemap[i] = Texture.RED_CRATER;
                break;
            }
        }
    case TileType.TRUCK:
    case TileType.SCAV:
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
    }
}

setMapData(MAP_WIDTH, MAP_LENGTH, texturemap, heightmap, structures, droids, features);
