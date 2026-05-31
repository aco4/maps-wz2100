const Texture = Object.freeze({
    TRANSITION:       0, // sand + yellow
    TRANSITION:       1, // sand + yellow
    TRANSITION:       2, // brown + sand
    TRANSITION:       3, // brown + sand
    TRANSITION:       4, // brown + sand
    BROWN_1:          5, // darkness: -1
    BROWN_2:          6, // darkness: 0
    BROWN_3:          7, // darkness: 1
    BROWN_4:          8, // darkness: 2
    YELLOW_1:         9, // light
    TRANSITION:       10, // sand + yellow
    YELLOW_2:         11, // dark
    SAND:             12,
    TRANSITION:       13, // brown + sand + water
    TRANSITION:       14, // sand + water
    TRANSITION:       15, // sand + water
    TRANSITION:       16, // sand + water
    WATER:            17,
    CLIFF_DOUBLE:     18,
    TRANSITION:       19, // concrete + red
    TRANSITION:       20, // concrete + red
    TRANSITION:       21, // concrete + red
    CONCRETE_1:       22, // dirty
    GREEN:            23,
    TRANSITION:       24, // green + brown
    TRANSITION:       25, // green + brown
    TRANSITION:       26, // green + brown
    TRANSITION:       27, // red + yellow
    TRANSITION:       28, // red + yellow
    TRANSITION:       29, // red + yellow
    TRANSITION:       30, // brown + green + water
    TRANSITION:       31, // green + water
    TRANSITION:       32, // green + water
    TRANSITION:       33, // green + water
    TRANSITION:       34, // brown + red
    TRANSITION:       35, // brown + red
    TRANSITION:       36, // brown + red
    ROAD_PATH:        37,
    TRANSITION:       38,
    TRANSITION:       39,
    TRANSITION:       40,
    TRANSITION:       41,
    TRANSITION:       42,
    TRANSITION:       43,
    RED_1:            44, // darkness: 0
    CLIFF_CORNER_1:   45, // light
    CLIFF_STRAIGHT_1: 46, // light
    ROAD_END:         47,
    RED_2:            48, // darkness: 4
    PATH_STRAIGHT_1:  49, // weak
    PATH_CORNER:      50,
    PATH_STRAIGHT_2:  51, // strong
    PATH_END:         52,
    RED_3:            53, // darkness: 3
    RED_4:            54, // darkness: 5
    CRATER_YELLOW:    55,
    CRATER_RED:       56,
    ROAD_T:           57,
    CRATER_BROWN:     58,
    ROAD_STRAIGHT:    59,
    DITCH_1:          60, // weak
    DITCH_2:          61, // strong
    CRATER_GREEN:     62,
    CRATER_BIG:       63,
    CRATER_BIG:       64,
    CRATER_BIG:       65,
    CRATER_BIG:       66,
    CRATER_BIG:       67,
    CRATER_BIG:       68,
    CRATER_BIG:       69,
    CRATER_BIG:       70,
    CLIFF_STRAIGHT_2: 71, // dark
    PATH_T:           72,
    PATH_PLUS:        73,
    RED_5:            74, // darkness: 1
    CLIFF_CORNER_2:   75, // dark
    RED_6:            76, // darkness: 2
    CONCRETE_2:       77, // clean

    // Returns the texture without rotation data
    id(texture) {
        return texture & 0x0fff;
    },
    // Returns the rotation of the texture (0, 1, 2, 3)
    rotation(texture) {
        return texture >> 12;
    },
    // Returns the texture rotated by some amount
    rotate(texture, amount=1) {
        if (amount === 0) return texture;
        if (amount < 0 || amount > 3) throw new Error("Texture.rotate() accepts 0, 1, 2, or 3");
        const rotation = ((texture >> 12) + amount) % 4;
        return texture & 0x0fff | (rotation * 0x1000);
    },
    // Returns the texture rotated by a random amount
    spin(texture) {
        return texture | (gameRand(4) * 0x1000);
    },
    isBrown(texture) {
        const id = this.id(texture);
        return id === this.BROWN_1
            || id === this.BROWN_2
            || id === this.BROWN_3
            || id === this.BROWN_4;
    },
    isRed(texture) {
        const id = this.id(texture);
        return id === this.RED_1
            || id === this.RED_2
            || id === this.RED_3
            || id === this.RED_4
            || id === this.RED_5
            || id === this.RED_6;
    },
    isConcrete(texture) {
        const id = this.id(texture);
        return id === this.CONCRETE_1
            || id === this.CONCRETE_2;
    },
    isYellow(texture) {
        const id = this.id(texture);
        return id === this.YELLOW_1
            || id === this.YELLOW_2;
    },
    isRoad(texture) {
        const id = this.id(texture);
        return id === this.ROAD_PATH
            || id === this.ROAD_END
            || id === this.ROAD_T
            || id === this.ROAD_STRAIGHT;
    },
    isCliff(texture) {
        const id = this.id(texture);
        return id === this.CLIFF_DOUBLE
            || id === this.CLIFF_CORNER_1
            || id === this.CLIFF_STRAIGHT_1
            || id === this.CLIFF_CORNER_2
            || id === this.CLIFF_STRAIGHT_2;
    },
    isWater(texture) {
        return this.id(texture) === this.WATER;
    },
    isSand(texture) {
        return this.id(texture) === this.SAND;
    },
    red() {
        const r = gameRand(964);
        if (r < 157) {
            return Texture.RED_1 | (gameRand(4) * 0x1000);
        } else if (r < 314) {
            return Texture.RED_2 | (gameRand(4) * 0x1000);
        } else if (r < 471) {
            return Texture.RED_3 | (gameRand(4) * 0x1000);
        } else if (r < 628) {
            return Texture.RED_4 | (gameRand(4) * 0x1000);
        } else if (r < 785) {
            return Texture.RED_5 | (gameRand(4) * 0x1000);
        } else if (r < 942) {
            return Texture.RED_6 | (gameRand(4) * 0x1000);
        } else {
            return Texture.CRATER_RED | (gameRand(4) * 0x1000);
        }
    },
    yellow() {
        const r = gameRand(100);
        if (r < 49) {
            return Texture.YELLOW_1 | (gameRand(4) * 0x1000);
        } else if (r < 98) {
            return Texture.YELLOW_2 | (gameRand(4) * 0x1000);
        } else {
            return Texture.CRATER_YELLOW | (gameRand(4) * 0x1000);
        }
    },
    brown() {
        const r = gameRand(100);
        if (r < 24) {
            return Texture.BROWN_1 | (gameRand(4) * 0x1000);
        } else if (r < 48) {
            return Texture.BROWN_2 | (gameRand(4) * 0x1000);
        } else if (r < 72) {
            return Texture.BROWN_3 | (gameRand(4) * 0x1000);
        } else if (r < 96) {
            return Texture.BROWN_4 | (gameRand(4) * 0x1000);
        } else {
            return Texture.CRATER_BROWN | (gameRand(4) * 0x1000);
        }
    },
    green() {
        const r = gameRand(100);
        if (r < 96) {
            return Texture.GREEN | (gameRand(4) * 0x1000);
        } else {
            return Texture.CRATER_GREEN | (gameRand(4) * 0x1000);
        }
    },
    concrete() {
        const r = gameRand(2);
        if (r) {
            return Texture.CONCRETE_1 | (gameRand(4) * 0x1000);
        } else {
            return Texture.CONCRETE_2 | (gameRand(4) * 0x1000);
        }
    }
});
