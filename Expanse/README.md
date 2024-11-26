# Expanse
"Expanse" is a Warzone 2100 map that features natural terrain.
- **Expanse**: First attempt at natural terrain
- **Expanse2**: Better generation and performance

# Script-Generated
This map is not handmade with a tool such as [FlaME](https://warzone.atlassian.net/wiki/spaces/FLAME/overview). It is coded using JavaScript, and uses randomness to generate a new map each time you play.

# Make your own script-generated map
First, decide:
1. Map size
2. Tileset (arizona, etc.)
3. Map name
4. Number of players
5. License (CC0, etc.)

Then, create a map in [FlaME](https://warzone.atlassian.net/wiki/spaces/FLAME/overview).
1. Resize the map
2. Pick the tileset
3. Paint the map with any texture (so you can compile without errors)
4. Place a command center for each player anywhere on the map (so you can compile without errors)
5. Place a truck for each player anywhere on the map (so you can compile without errors)
6. Compile the map.
7. FlaME will output a `.wz`, containing the required files for your map (`.lev`, `.gam`).
8. Rename the `.wz` to `.zip`
9. Extract the `.lev`, `.gam`, and `ttypes.ttp`. Everything else can be deleted.
10. Create the folder structure

# Folder Structure
```
10c-Expanse2/
├── multiplay/
│   └── maps/
│       ├── 10c-Expanse2/
│       │   ├── game.js
│       │   └── ttypes.ttp
│       │
│       └── 10c-Expanse2.gam
│
└── 10c-Expanse2.xplayers.lev
```
To play it, compress to a `.zip`, then rename to `.wz`:
```
10c-Expanse2.wz
├── multiplay/
│   └── maps/
│       ├── 10c-Expanse2/
│       │   ├── game.js
│       │   └── ttypes.ttp
│       │
│       └── 10c-Expanse2.gam
│
└── 10c-Expanse2.xplayers.lev
```
Then place the `.wz` file in Warzone 2100's `/map/` directory.

# Script Explanation
All the code is in `game.js`.

The map is represented by 5 variables:
```js
let texturemap = Array(MAP_AREA);
let heightmap = Array(MAP_AREA);
let structures = [];
let droids = [];
let features = [];
```
At the end of the generation process, they will be passed into:
```js
setMapData(MAP_WIDTH, MAP_LENGTH, texturemap, heightmap, structures, droids, features);
```
To help with map generation, some internal structures are needed:
```js
let tiletypemap = Array(MAP_AREA);
let cliff_tiles = new Set();
let water_tiles = new Set();
```
## Step 1: Height Mapping
Random noise is generated with https://github.com/attilabuti/SimplexNoise. This is the primary generation time bottleneck, and could be sped up by using Warzone 2100's [native noise generator](https://github.com/Warzone2100/warzone2100/pull/2341) (available since 4.2.1). Unfortunately, at the time of writing, it's too buggy to be useful.

Seed the noise generator:
```js
s(gameRand());
```
`gameRand(n)` generates a random number between `0` and `n-1` (inclusive). If called without parameters, generates a random number between `0` and `0xffffffff` (inclusive).

Generate a random noise value for each tile:
```js
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
```
The noise values range from roughly -1.7 to 1.7. We want to normalize the values. To do this, we need the exact range:
```js
let min = heightmap[0];
let max = heightmap[0];
for (let i = 1; i < MAP_AREA; i++) {
    const height = heightmap[i];
    if (height < min) min = height;
    if (height > max) max = height;
}
let range = max - min;
```
Now, transform the noise to achieve the desired heightmap. The scaling and shifting are for making flat areas (water/plateaus):
```js
let scale = MAX_TILE_HEIGHT * 2.00;
let shift = MAX_TILE_HEIGHT * -0.65;
for (let i = 0; i < MAP_AREA; i++) {
    heightmap[i] = Math.max(0, Math.min(MAX_TILE_HEIGHT - 64,
            ((heightmap[i] - min) / range * scale) + shift
    ));
    ...
```
The map is very large (250 * 250 = 62500 tiles). It's important to reduce the amount of `for` loops that iterate over the entire map. We can do this by combining multiple processes into a single loop. In this case, we also initialize the tiletypemap in the same loop. This process uses the height of each tile to determine it's type:
- Water: flat tile with height = 0
- Cliff: tile that meets the STEEPNESS threshold
- Ground: everything else
```js
if (flat and height is 0) {
    tiletypemap[i] = TileType.WATER;
} else if (steep) {
    tiletypemap[i] = TileType.CLIFF;
} else {
    tiletypemap[i] = TileType.GROUND;
}
```
The height of a tile is determined by its 4 corners:
```js
heightmap[i];
heightmap[i + 1];              // East
heightmap[i + MAP_WIDTH];      // South
heightmap[i + 1 + MAP_WIDTH];  // Southeast
tiletypemap[i] = ...
```
But there is a problem. Since we are initializing the tiletypemap at the same time as the heightmap transformation, the code above accesses pre-transformed values.
```js
heightmap[i];                 // transformed
heightmap[i + 1];             // not transformed
heightmap[i + MAP_WIDTH];     // not transformed
heightmap[i + 1 + MAP_WIDTH]; // not transformed
```
Solution:
```js
heightmap[i]
heightmap[i - 1];             // West
heightmap[i - MAP_WIDTH];     // North
heightmap[i - 1 - MAP_WIDTH]; // Northwest
tiletypemap[i - 1 - MAP_WIDTH] = ...
```
To deal with out-of-bounds issues, use safe functions:
```js
...
// y - 1
function i_N(i) { // North
    return i - MAP_WIDTH < 0 ? i : i - MAP_WIDTH;
}
// x + 1
function i_E(i) { // East
    return (i + 1) % MAP_WIDTH == 0 ? i : i + 1;
}
...
```
Now we can get the heights:
```js
    ...
    iN = i_N(i);
    iW = i_W(i);
    iNW = i_NW(i);
    const h1 = heightmap[i]
    const h2 = heightmap[iN];
    const h3 = heightmap[iW];
    const h4 = heightmap[iNW];
    ...
```
Then use them to determine the tile type:
```js
    ...
    if (h1 == 0 && h2 == 0 && h3 == 0 && h4 == 0) {
        tiletypemap[iNW] = TileType.WATER;
    } else if (Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4) > STEEPNESS) {
        tiletypemap[iNW] = TileType.CLIFF;
    } else {
        tiletypemap[iNW] = TileType.GROUND;
    }
}
```
For optimization purposes, store the index each water tile in a set. This will be useful later so we don't have to iterate over the entire map when we are only interested in water tiles:
```js
water_tiles.add(iNW);
```
Do the same for cliff tiles:
```js
cliff_tiles.add(iNW);
```
## Step 2: Smooth Cliffs
Sometimes cliffs will generate with a stub that cannot be sloped correctly:
```
c . . . .
c c . . .
c c c  <- needs to be deleted
c c . . .
c c . . .
```
Iterate over every cliff tile:
```js
for (const i of cliff_tiles) {
    // Ignore tiles on the map edge
    if (i < MAP_WIDTH ||i >= MAP_AREA - MAP_WIDTH || i % MAP_WIDTH == 0 || (i + 1) % MAP_WIDTH == 0) {
        continue;
    }
    ...
```
Kill the cliff tile if its 8 neighbors are in a certain pattern. First, count the neighbors. neighbor = 1, no neighbor = 0:
```js
    ...
    let bitmap = 0b00000000;

    if (tiletypemap[i - 1 - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b10000000; // NW
    if (tiletypemap[i     - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b01000000; // N
    if (tiletypemap[i + 1 - MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00100000; // NE
    if (tiletypemap[i - 1            ] == TileType.CLIFF) bitmap |= 0b00010000; // W
    if (tiletypemap[i + 1            ] == TileType.CLIFF) bitmap |= 0b00001000; // E
    if (tiletypemap[i - 1 + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000100; // SW
    if (tiletypemap[i     + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000010; // S
    if (tiletypemap[i + 1 + MAP_WIDTH] == TileType.CLIFF) bitmap |= 0b00000001; // SE
    ...
}
```
Use a lookup table to decide if the cliff tile should die:
```js
...
const CliffLife = new Set([
    0b00001111,
    0b00010110,
    0b00010111,
    0b00011011,
    0b00011110,
    0b00011111,
    0b00101011,
    ...
```
```js
    if (!CliffLife.has(bitmap)) {
        tiletypemap[i] = TileType.GROUND;
        cliff_tiles.delete(i);
    }
```
## Step 3: Smooth Water
Isolated water tiles are invisible (on Normal terrain) and should be deleted
```
. . . . .
. . w  <- needs to be deleted
w w w . .
w w w . .
```
Use a similar process to cliff tiles:
```js
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
```
## Step 4: Raise Cliffs
When there is a group of 4 cliffs:
```
. . . .
. c c .
. c c .
. . . .
```
The vertex in the middle should be raised up:
```js
for (const i of cliff_tiles) {
    if (tiletypemap[i_N (i)] == TileType.CLIFF &&
        tiletypemap[i_W (i)] == TileType.CLIFF &&
        tiletypemap[i_NW(i)] == TileType.CLIFF) {

        const boost = 1.5 + gameRand(6) / 10;
        heightmap[i] = Math.max(64 + gameRand(128), Math.min(MAX_TILE_HEIGHT - gameRand(32), heightmap[i] * boost));
    }
}
```
Some random variation is added for a natural look.
## Step 5: Scatter Trucks
Place trucks randomly around the map.
```js
let trucksPlaced = 0;
while (trucksPlaced < NUM_PLAYERS) {
    ...
    // pick a random spot
    ...
    // place the truck
    ...
    trucksPlaced++;
}
```
The random spot should not be too close to the edge of the map:
```js
x = random(3, MAP_WIDTH - 4)
y = random(3, MAP_LENGTH - 4)
```
For performance, use only a single `gameRand()` call:
```js
    ...
    let i = gameRand((MAP_WIDTH - 6) * (MAP_LENGTH - 6));
    const x = 3 + (i % (MAP_WIDTH - 6));
    const y = 3 + Math.floor(i / (MAP_WIDTH - 6));
    i = MAP_WIDTH * y + x;
    ...
```
Only place truck if there is a 3x3 space:
```js
    ...
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
```
Start with 4 trucks and give the player 1 guaranteed oil:
```js
    ) {
        tiletypemap[i] = TileType.OIL;
        texturemap[i] = Texture.RED_CRATER;
        features.push({
            name: "OilResource",
            position: [128 * x + 64, 128 * y + 64],
            direction: gameRand(4) * 0x4000,
        });

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
```
## Step 6: Texture Mapping
```js
for (let i = 0; i < MAP_AREA; i++) {
    switch (tiletypemap[i]) {
    case TileType.GROUND:
    case TileType.TRUCK:
        texturemap[i] = ...
        break;
    case TileType.CLIFF:
        texturemap[i] = ...
        break;
    case TileType.WATER:
        texturemap[i] = Texture.WATER;
        break;
    }
}
```
`GROUND` and `TRUCK` tiles should have the same texture, so no `break` is used between them.
- If tile is next to water, place sand
- If tile is flat, place concrete
- Otherwise, place red dirt
```js
        ...
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
    ...
```
`TileType.CLIFF` is difficult, and we need to do some thinking for it.
```js
    case TileType.CLIFF:
        texturemap[i] = autoCliff(i);
        break;
```
### Auto-Cliff Algorithm
1. For each of the 4 corners of a tile, compare the two adjacent edges
2. If one edge is significantly shorter than the other, mark it.
3. Use a table to set the tile
```js
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
```
## Step 7: Scatter Oils
For optimization, combine this with the for loop in **Step 6**:
```js
    case TileType.GROUND:
        // place oil
```
We can't place an oil on every single available tile, so use a random chance to decide:
```js
    case TileType.GROUND:
        if (!gameRand(OIL_CHANCE)) {
            ...
```
If the random chance `!= 0`, don't try to place an oil. Lower `OIL_CHANCE` = more oils. Higher `OIL_CHANCE` = less oils. For each tile, the probability of attempting to place an oil is roughly `1/OIL_CHANCE`.

Once the random chance succeeds, convert `i` to `x,y`:
```js
            ...
            const x = i % MAP_WIDTH;
            const y = Math.floor(i / MAP_WIDTH);
            ...
```
Check if too close to the map edge:
```js
            ...
            if ((
                    x >= 3 && y >= 3 && x <= MAP_WIDTH - 4 && y <= MAP_LENGTH - 4
            ...
```
Require 3x3 empty space:
```js
            ...
                ) && (
                    tiletypemap[i - 1 - MAP_WIDTH] == TileType.GROUND &&
                    tiletypemap[i -     MAP_WIDTH] == TileType.GROUND &&
                    tiletypemap[i + 1 - MAP_WIDTH] == TileType.GROUND &&
                    tiletypemap[i - 1            ] == TileType.GROUND &&
                    tiletypemap[i + 1            ] == TileType.GROUND &&
                    tiletypemap[i - 1 + MAP_WIDTH] == TileType.GROUND &&
                    tiletypemap[i +     MAP_WIDTH] == TileType.GROUND &&
                    tiletypemap[i + 1 + MAP_WIDTH] == TileType.GROUND
                )
            ) {
```
Place the oil:
```js
            ) {
                tiletypemap[i] = TileType.OIL;
                texturemap[i] = Texture.RED_CRATER;
                features.push({
                    name: "OilResource",
                    position: [128 * x + 64, 128 * y + 64],
                    direction: gameRand(4) * 0x4000,
                });
```
Place a scav derrick over 50% of oils:
```js
                if (gameRand(2)) {
                    structures.push({
                        name: "A0ResourceExtractor",
                        position: [128 * x + 64, 128 * y + 64],
                        direction: gameRand(4) * 0x4000,
                        modules: 0,
                        player: 10
                    });
                }
                break;
            }
        }
```

Done!
```js
setMapData(MAP_WIDTH, MAP_LENGTH, texturemap, heightmap, structures, droids, features);
```


---
stackedit.io
