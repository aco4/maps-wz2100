// https://github.com/josephg/noisejs
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function(global){
  var module = global.noise = {};

  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  module.seed = function(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
      seed |= seed << 8;
    }

    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  module.seed(0);

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  var F3 = 1/3;
  var G3 = 1/6;

  // 2D simplex noise
  module.simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  module.simplex3 = function(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin+zin)*F3; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var k = Math.floor(zin+s);

    var t = (i+j+k)*G3;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    var z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i+   perm[j+   perm[k   ]]];
    var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
    var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
    var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  function lerp(a, b, t) {
    return (1-t)*a + t*b;
  }

  // 2D Perlin Noise
  module.perlin2 = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = gradP[X+perm[Y]].dot2(x, y);
    var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
    var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
    var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
       fade(y));
  };

  // 3D Perlin Noise
  module.perlin3 = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X; y = y - Y; z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255; Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
    var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
    var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
    var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
    var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
    var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
    var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
    var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

    // Compute the fade curve value for x, y, z
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    // Interpolate
    return lerp(
        lerp(
          lerp(n000, n100, u),
          lerp(n001, n101, u), w),
        lerp(
          lerp(n010, n110, u),
          lerp(n011, n111, u), w),
       v);
  };

})(this);


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
// e.g. setHeight([2,1], 100)
//
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


//
// Hardcoded Constants
//
const CONST_ABSOLUTE_MAP_WIDTH = 250; // Width of the map, in tiles
const CONST_ABSOLUTE_MAP_LENGTH = 250; // Length of the map, in tiles
const CONST_MAP_AREA = CONST_ABSOLUTE_MAP_WIDTH * CONST_ABSOLUTE_MAP_LENGTH; // Total number of tiles on the map

const CONST_MIN_HEIGHT = 0;
const CONST_MAX_HEIGHT = 510;

const CONST_NUM_PLAYERS = 10;
const CONST_PLAYERS_PER_TEAM = 5;

const CONST_TILE_XFLIP = 0x8000; // Magic constants corresponding to the game engine's constants
const CONST_TILE_YFLIP = 0x4000;
const CONST_TILE_ROT = 0x1000;
const CONST_DROID_ROT = 0x4000;

const RMAX = 0xffffffff;


//
// Enums
//
const BaseLayouts = Object.freeze({
    "normal-f": [
        "                             ",
        "        x   x   x   x   x    ",
        "        c   c   c   c   c    ",
        "                             ",
        "      xxx xxx xxx xxx xxx    ",
        "      xfx xfx xfx xfx xfx    ",
        "      xxx xxx xxx xxx xxx    ",
        "                             ",
        "          tt xx              ",
        " o o o o  tt xh              ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xr xr xr xr xr     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        "                             "
    ],
    "normal-b": [
        "                             ",
        "      xxx xxx xxx xxx xxx    ",
        "      xfx xfx xfx xfx xfx    ",
        "      xxx xxx xxx xxx xxx    ",
        "                             ",
        "        ttx x xx x x x       ",
        " o o o ottc c xh c c c       ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xr xr xr xr xr     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        "                             "
    ],
    "compact-b": [
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "         ttx x xx x x x      ",
        "    oo oottc c xh c c c      ",
        "    oo oo                    ",
        "    oo oo  xx xx xx xx xx    ",
        "    oo oo  xr xr xr xr xr    ",
        "    oo oo                    ",
        "    oo oo  xx xx xx xx xx    ",
        "    oo oo  xp xp xp xp xp    ",
        "    oo oo                    ",
        "    oo oo  xx xx xx xx xx    ",
        "    oo oo  xp xp xp xp xp    ",
        "                             "
    ],
    "short-3-c": [
        "                             ",
        "      x   x   x   x   x      ",
        "      c   c   c   c   c      ",
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "   xx xx xxtxxtxx xx xx xx   ",
        "   xp xr xrtxhtxr xr xr xp   ",
        "                             ",
        "   xx xx oo oo oo oo xx xx   ",
        "   xp xp oo oo oo oo xp xp   ",
        "         oo oo oo oo         ",
        "   xx xx oo oo oo oo xx xx   ",
        "   xp xp oo oo oo oo xp xp   ",
        "                             "
    ],
    "short-4-c": [
        "                             ",
        "      x   x   x   x   x      ",
        "      c   c   c   c   c      ",
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "   xx xx xxtxxtxx xx xx xx   ",
        "   xp xr xrtxhtxr xr xr xp   ",
        "                             ",
        "   xx xx xx xx xx xx xx xx   ",
        "   xp xp xp xp xp xp xp xp   ",
        "                             ",
        "   ooooo ooooo ooooo ooooo   ",
        "   ooooo ooooo ooooo ooooo   ",
        "                             "
    ],
    "short-5": [
        "                             ",
        "        x   x   x   x   x    ",
        "        c   c   c   c   c    ",
        "                             ",
        "        xxx xxx xxx xxx xxx  ",
        "    txxtxfx xfx xfx xfx xfx  ",
        "    txhtxxx xxx xxx xxx xxx  ",
        "                             ",
        "   o o o o o xx xx xx xx xx  ",
        "   o o o o o xr xr xr xr xr  ",
        "   o o o o o                 ",
        "   o o o o o xx xx xx xx xx  ",
        "   o o o o o xp xp xp xp xp  ",
        "   o o o o o                 ",
        "   o o o o o xx xx xx xx xx  ",
        "   o o o o o xp xp xp xp xp  ",
        "                             "
    ],
    "short-5-1": [
        "                             ",
        "   x   x   x   x   x         ",
        "   c   c   c   c   c         ",
        "                             ",
        "   xxx xxx xxx xxx xxx       ",
        "   xfx xfx xfx xfx xfxtxxt   ",
        "   xxx xxx xxx xxx xxxtxht   ",
        "                             ",
        "   xx xx xx xx xx o o o o o  ",
        "   xr xr xr xr xr o o o o o  ",
        "                  o o o o o  ",
        "   xx xx xx xx xx o o o o o  ",
        "   xp xp xp xp xp o o o o o  ",
        "                  o o o o o  ",
        "   xx xx xx xx xx o o o o o  ",
        "   xp xp xp xp xp o o o o o  ",
        "                             "
    ],
    "twin-1": [
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "         x xtxxtx x x        ",
        " o o     c ctxhtc c c    o o ",
        " o o                     o o ",
        " o o     xx xx xx xx xx  o o ",
        " o o     xr xr xr xr xr  o o ",
        " o o                     o o ",
        " o o     xx xx xx xx xx  o o ",
        " o o     xp xp xp xp xp  o o ",
        " o o                     o o ",
        " o o     xx xx xx xx xx  o o ",
        " o o     xp xp xp xp xp  o o ",
        "                             "
    ],
    "twin-2": [
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "        x x xtxxtx x         ",
        " o o    c c ctxhtc c     o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xx     o o ",
        " o o  xr xr xr xr xr     o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xx     o o ",
        " o o  xp xp xp xp xp     o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xx     o o ",
        " o o  xp xp xp xp xp     o o ",
        "                             "
    ],
    "twin-3": [
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "      x   x   x   x   x      ",
        " o o  c   c   c   c   c  o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xxtxxt o o ",
        " o o  xr xr xr xr xrtxht o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xx     o o ",
        " o o  xp xp xp xp xp     o o ",
        " o o                     o o ",
        " o o  xx xx xx xx xx     o o ",
        " o o  xp xp xp xp xp     o o ",
        "                             "
    ],
    "twin-4": [
        "                             ",
        "     xxx xxx xxx xxx xxx     ",
        "     xfx xfx xfx xfx xfx     ",
        "     xxx xxx xxx xxx xxx     ",
        "                             ",
        "      x   x   x   x   x      ",
        " o o  c   c   c   c   c  o o ",
        " o o                     o o ",
        " o o txxtxx xx xx xx xx  o o ",
        " o o txhtxr xr xr xr xr  o o ",
        " o o                     o o ",
        " o o     xx xx xx xx xx  o o ",
        " o o     xp xp xp xp xp  o o ",
        " o o                     o o ",
        " o o     xx xx xx xx xx  o o ",
        " o o     xp xp xp xp xp  o o ",
        "                             "
    ],
    // "random-1": [
    //     "            tttt             ",
    //     " o           xx  x xxx       ",
    //     "    x   o    xh  c xfx    x  ",
    //     "    c              xxx xx c  ",
    //     "       xx              xp    ",
    //     "    o  xp    xx  xx xx       ",
    //     " o           xp  xr xp oo oo ",
    //     " o   xx xxx                  ",
    //     "     xp xfx o  xxx xx xx xx  ",
    //     "        xxx o  xfx xr xr xr  ",
    //     "  xxx       o  xxx           ",
    //     "  xfx xx xx o        x oo oo ",
    //     "  xxx xp xr   xxx oo c oo oo ",
    //     "              xfx o          ",
    //     "    oo x oooo xxx   xx xx xx ",
    //     " xx oo c oooo       xp xp xp ",
    //     " xp            oooo          "
    // ],
    // "random-2": [
    //     "                             ",
    //     "    xxx o xx xx      x  o    ",
    //     " xx xfx   xr xh xxx tc     o ",
    //     " xr xxx         xfx          ",
    //     "         xx ot  xxx  xx x  xx",
    //     "xx o xx  xp o        xr c  xr",
    //     "xp   xp       x  oo          ",
    //     "         txxx c   o xx       ",
    //     "   xx    txfx     o xp   xxx ",
    //     "   xp oo  xxx  xx        xfx ",
    //     "               xp  xx oo xxx ",
    //     "o  x   xx oo o     xp oo     ",
    //     "oo c   xp o  ooo           oo",
    //     " o                xxx    x   ",
    //     "   oo xx      o o xfx    c xx",
    //     "   oo xr o xx o   xxx  o   xp",
    //     "         o xp          o     ",
    // ],
    "narrow-1": [
        "  x x x x x  ",
        "  c c c c c  ",
        "             ",
        " xxx xxx xxx ",
        " xfx xfx xfx ",
        " xxx xxx xxx ",
        "             ",
        " xxx t t xxx ",
        " xfx     xfx ",
        " xxx t t xxx ",
        "             ",
        " xx xx xx xx ",
        " xr xh xr xr ",
        "             ",
        " xx xx xx xx ",
        " xr xr xp xp ",
        "             ",
        " xx xx xx xx ",
        " xp xp xp xp ",
        "             ",
        " xx xx xx xx ",
        " xp xp xp xp ",
        "             ",
        " ooooo ooooo ",
        " ooooo ooooo ",
        "             ",
        " ooooo ooooo ",
        " ooooo ooooo ",
        "             "
    ],
    "narrow-2": [
        "  x x x x x  ",
        "  c c c c c  ",
        "             ",
        " xxx xxx xxx ",
        " xfx xfx xfx ",
        " xxx xxx xxx ",
        "             ",
        " t xxx xxx t ",
        "   xfx xfx   ",
        " t xxx xxx t ",
        "             ",
        " xx xx xx xx ",
        " xp xh xr xp ",
        "             ",
        " xx xx xx xx ",
        " xp xr xr xp ",
        "             ",
        " xx xx xx xx ",
        " xp xr xr xp ",
        "             ",
        " xx oo oo xx ",
        " xp oo oo xp ",
        "    oo oo    ",
        " xx oo oo xx ",
        " xp oo oo xp ",
        "             ",
        " ooooo ooooo ",
        " ooooo ooooo ",
        "             "
    ],
    "wide-1-f": [
        "                               ",
        "       x   x   x   x   x       ",
        "       c   c   c   c   c       ",
        "                               ",
        "      xxx xxx xxx xxx xxx      ",
        "      xfx xfx xfx xfx xfx      ",
        "      xxx xxx xxx xxx xxx      ",
        "                               ",
        "       xx xxtxxtxx xx xx       ",
        "       xr xrtxhtxr xr xr       ",
        "                               ",
        " xx xx xx xx xx xx xx xx xx xx ",
        " xp xp xp xp xp xp xp xp xp xp ",
        "                               ",
        " oo oo oo oo oo oo oo oo oo oo ",
        " oo oo oo oo oo oo oo oo oo oo ",
        "                               ",
    ],
    "wide-1-b": [
        "                               ",
        "      xxx xxx xxx xxx xxx      ",
        "      xfx xfx xfx xfx xfx      ",
        "      xxx xxx xxx xxx xxx      ",
        "                               ",
        "       x   x   x   x   x       ",
        "       c   c   c   c   c       ",
        "                               ",
        "       xx xxtxxtxx xx xx       ",
        "       xr xrtxhtxr xr xr       ",
        "                               ",
        " xx xx xx xx xx xx xx xx xx xx ",
        " xp xp xp xp xp xp xp xp xp xp ",
        "                               ",
        " oo oo oo oo oo oo oo oo oo oo ",
        " oo oo oo oo oo oo oo oo oo oo ",
        "                               ",
    ],
    "wide-2-f": [
        "                               ",
        "       x   x   x   x   x       ",
        "       c   c   c   c   c       ",
        "                               ",
        "      xxx xxx xxx xxx xxx      ",
        "      xfx xfx xfx xfx xfx      ",
        "      xxx xxx xxx xxx xxx      ",
        "                               ",
        "       xx xxtxxtxx xx xx       ",
        "       xr xrtxhtxr xr xr       ",
        "                               ",
        "     oooooooooo oooooooooo     ",
        "     oooooooooo oooooooooo     ",
        "                               ",
        " xx xx xx xx xx xx xx xx xx xx ",
        " xp xp xp xp xp xp xp xp xp xp ",
        "                               ",
    ],
    "wide-2-b": [
        "                               ",
        "      xxx xxx xxx xxx xxx      ",
        "      xfx xfx xfx xfx xfx      ",
        "      xxx xxx xxx xxx xxx      ",
        "                               ",
        "       x   x   x   x   x       ",
        "       c   c   c   c   c       ",
        "                               ",
        "       xx xxtxxtxx xx xx       ",
        "       xr xrtxhtxr xr xr       ",
        "                               ",
        "     oooooooooo oooooooooo     ",
        "     oooooooooo oooooooooo     ",
        "                               ",
        " xx xx xx xx xx xx xx xx xx xx ",
        " xp xp xp xp xp xp xp xp xp xp ",
        "                               ",
    ],
    "superwide-1": [
        "                                           ",
        "             x   x   x   x   x             ",
        "             c   c   c   c   c             ",
        "                                           ",
        "            xxx xxx xxx xxx xxx            ",
        "      xx xx xfx xfx xfx xfx xfx xx xx      ",
        "      xp xp xxx xxx xxx xxx xxx xp xp      ",
        "                                           ",
        "    xx xx xx xx xxtxxtxx xx xx xx xx xx    ",
        "    xp xp xp xr xrtxhtxr xr xr xp xp xp    ",
        "                                           ",
        " oooooooooooooooooooo oooooooooooooooooooo ",
        "                                           ",
    ],
    // "SPECIAL_RANDOM": [ // TODO
    //     ""
    // ]
});

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

const BaseLayoutSelectionMode = Object.freeze({
    SAME_LAYOUT: 0,
    SAME_WIDTH: 1,
    RANDOM: 2
});

// Variant: selectionChance
const Variant = Object.freeze({
    ISLAND:  0.25, // Map border is water (and is accessible)
    ISLANDX: 0.25, // Map border is water (but inaccessible)
    OCEAN:   0.10, // Battlefield is water
    BRIDGE:  0.80, // Narrow battlefield
    SCATTER: 0.10, // Oils are removed from the base and scattered across the battlefield
    PERLIN:  0.25  // Hilly battlefield
});

const Compatible = Object.freeze({
    ISLAND: ["ISLAND", "OCEAN", "BRIDGE", "SCATTER"],
    ISLANDX: ["ISLANDX", "BRIDGE", "SCATTER"],
    OCEAN: ["OCEAN", "ISLAND", "BRIDGE", "SCATTER"],
    BRIDGE: ["BRIDGE", "ISLAND", "ISLANDX", "OCEAN", "SCATTER"],
    SCATTER: ["SCATTER", "ISLAND", "ISLANDX", "OCEAN", "BRIDGE"],
    PERLIN: ["PERLIN"]
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

class Base {
    constructor(layout, bb) {
        this.layout = layout;
        this.bb = bb;

    }
}

//
// Functions
//
// function sym(xy) {
//     return [CONST_ABSOLUTE_MAP_WIDTH - 1 - xy.x, CONST_ABSOLUTE_MAP_LENGTH - 1 - xy.y];
// }
function symp(playerNum) {
    return CONST_NUM_PLAYERS - 1 - playerNum;
}
function symbb(xy, bb) {
    return new XY(
        bb.width_t - 1 - (xy.x - bb.NW.x) + bb.NW.x,
        bb.length_t - 1 - (xy.y - bb.NW.y) + bb.NW.y
    );
}
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
    if (x < CONST_ABSOLUTE_MAP_WIDTH - 1)
        setHeight(xy.add(1,0), h);
    if (y < CONST_ABSOLUTE_MAP_LENGTH - 1)
        setHeight(xy.add(0,1), h);
    if (x < CONST_ABSOLUTE_MAP_WIDTH - 1 && y < CONST_ABSOLUTE_MAP_LENGTH - 1)
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
    droids.push({
        name: name,
        position: [128 * xy.x + 64, 128 * xy.y + 64],
        direction: rotation * 0x4000,
    });
}
function weightedRandom(object) {
  let sum = 0;
  for (const property in object) {
    sum += object[property];
  }

  let choice = gameRand(sum) + 1;
  for (const property in object) {
    choice -= object[property];
    if (choice <= 0)
      return property;
  }
  throw new Error("weightedRandom");
}
function rand(lowerInclusive, upperInclusive) {
    return lowerInclusive + gameRand(upperInclusive - lowerInclusive + 1);
}
// TODO
// function randomBaseLayout() {
//     return string;
// }
function roughen(height) { // Decrease the height of a vertex by a random amount
    return Math.floor(Math.max(0, height - ROUGHNESS) + (gameRand() / RMAX * ROUGHNESS));
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


//
// Select layouts
//
let BASE_LAYOUT_SELECTION_MODE = (() => {
    switch (
        weightedRandom({
            a: 4,
            b: 4,
            c: 1
        })
    ) {
        case "a": return BaseLayoutSelectionMode.SAME_LAYOUT;
        case "b": return BaseLayoutSelectionMode.SAME_WIDTH;
        case "c": return BaseLayoutSelectionMode.RANDOM;
    }
})();

let bases = Array(CONST_NUM_PLAYERS); // Array of Base objects

// Initialize the array
for (let i = 0; i < CONST_NUM_PLAYERS; i++) {
    bases[i] = new Base(null, new BoundingBox(null, null, null));
}

let MAX_BASE_WIDTH = 0;
let MAX_BASE_LENGTH = 0;
let SUMMED_BASE_WIDTH = 0;

{
    let layoutProperty;
    let baseWidth_t;
    let baseLength_t;
    let matching = [];

    switch (BASE_LAYOUT_SELECTION_MODE) {

        case BaseLayoutSelectionMode.SAME_LAYOUT:
            // Select a random base layout
            layoutProperty = Object.keys(BaseLayouts)[gameRand(Object.keys(BaseLayouts).length)];

            // Calculate the size
            baseWidth_t = BaseLayouts[layoutProperty][0].length;
            baseLength_t = BaseLayouts[layoutProperty].length;

            // Update maxes
            if (baseWidth_t > MAX_BASE_WIDTH) {
                MAX_BASE_WIDTH = baseWidth_t;
            }
            if (baseLength_t > MAX_BASE_LENGTH) {
                MAX_BASE_LENGTH = baseLength_t;
            }

            // Apply the layout to every Base object
            for (let i = 0; i < CONST_NUM_PLAYERS; i++) {
                bases[i].layout = layoutProperty;
                bases[i].bb.width_t = baseWidth_t;
                bases[i].bb.length_t = baseLength_t;
            }

            // Calculate the summed base width
            SUMMED_BASE_WIDTH = CONST_PLAYERS_PER_TEAM * baseWidth_t;

            break;

        case BaseLayoutSelectionMode.SAME_WIDTH:
            // Select a random base layout
            layoutProperty = Object.keys(BaseLayouts)[gameRand(Object.keys(BaseLayouts).length)];

            // Calculate the size
            baseWidth_t = BaseLayouts[layoutProperty][0].length;
            baseLength_t = BaseLayouts[layoutProperty].length;

            // Make a list of all base layouts that match the width
            for (const property in BaseLayouts) {
                if (BaseLayouts[property][0].length == baseWidth_t) {
                    matching.push(property)
                }
            }

            // Select random base layouts
            for (let i = 0; i < CONST_PLAYERS_PER_TEAM; i++) {
                layoutProperty = matching[gameRand(matching.length)];

                baseWidth_t = BaseLayouts[layoutProperty][0].length;
                baseLength_t = BaseLayouts[layoutProperty].length;

                // Update maxes
                if (baseWidth_t > MAX_BASE_WIDTH) {
                    MAX_BASE_WIDTH = baseWidth_t;
                }
                if (baseLength_t > MAX_BASE_LENGTH) {
                    MAX_BASE_LENGTH = baseLength_t;
                }

                // Apply the layout
                bases[i].layout = layoutProperty;
                bases[i].bb.width_t = baseWidth_t;
                bases[i].bb.length_t = baseLength_t;
                bases[symp(i)].layout = layoutProperty;
                bases[symp(i)].bb.width_t = baseWidth_t;
                bases[symp(i)].bb.length_t = baseLength_t;

                // Update sum
                SUMMED_BASE_WIDTH += baseWidth_t;
            }
            break;

        case BaseLayoutSelectionMode.RANDOM:
            for (let i = 0; i < CONST_PLAYERS_PER_TEAM; i++) {
                // Select a random base layout
                layoutProperty = Object.keys(BaseLayouts)[gameRand(Object.keys(BaseLayouts).length)];

                // Calculate the size
                baseWidth_t = BaseLayouts[layoutProperty][0].length;
                baseLength_t = BaseLayouts[layoutProperty].length;

                // Update maxes
                if (baseWidth_t > MAX_BASE_WIDTH) {
                    MAX_BASE_WIDTH = baseWidth_t;
                }
                if (baseLength_t > MAX_BASE_LENGTH) {
                    MAX_BASE_LENGTH = baseLength_t;
                }

                // Apply the layout
                bases[i].layout = layoutProperty;
                bases[i].bb.width_t = baseWidth_t;
                bases[i].bb.length_t = baseLength_t;
                bases[symp(i)].layout = layoutProperty;
                bases[symp(i)].bb.width_t = baseWidth_t;
                bases[symp(i)].bb.length_t = baseLength_t;

                // Update sum
                SUMMED_BASE_WIDTH += baseWidth_t;
            }
            break;

        default:
            throw new Error("Unrecognized BaseLayoutSelectionMode");
    }
}


//
// Divide the remaining horizontal space among the dividers and borders
//
let MIN_BORDER_WIDTH = 4;
let MIN_DIVIDER_WIDTH = 0;
let NUM_DIVIDERS = CONST_PLAYERS_PER_TEAM - 1;

let DIVIDER_WIDTH;
let BORDER_WIDTH;
let BASEZONE_WIDTH;
let BATTLEFIELD_WIDTH;
let TEAMFIELD_WIDTH;
{
    let space = CONST_ABSOLUTE_MAP_WIDTH - SUMMED_BASE_WIDTH - 2 * (MIN_BORDER_WIDTH + 1);

    // Find the maximum divider width
    let maxDividerWidth_t = 250;
    while (NUM_DIVIDERS * (maxDividerWidth_t + 2) > space) {
        maxDividerWidth_t--;
    }

    // Select a divider width
    switch (
        weightedRandom({
            a: 2,
            b: 5,
            c: 3,
            d: 1,
            e: 1,
            f: 2
        })
    ) {
        case "a":
            DIVIDER_WIDTH = 0;
            break;
        case "b":
            DIVIDER_WIDTH = 1;
            break;
        case "c":
            DIVIDER_WIDTH = Math.floor(maxDividerWidth_t * 0.25);
            break;
        case "d":
            DIVIDER_WIDTH = Math.floor(maxDividerWidth_t * 0.50);
            break;
        case "e":
            DIVIDER_WIDTH = Math.floor(maxDividerWidth_t * 0.75);
            break;
        case "f":
            DIVIDER_WIDTH = maxDividerWidth_t;
            break;
    }

    let summedDividerWidth_t = NUM_DIVIDERS * (DIVIDER_WIDTH + (DIVIDER_WIDTH == 0 ? 0 : 2));
    let extraSpace = space - summedDividerWidth_t;
    let extraBorder = Math.floor(extraSpace / 2);
    // let remainder = extraSpace % 2; // the remainder can be ignored. It will be implicitly added onto the east border (?)

    BORDER_WIDTH = MIN_BORDER_WIDTH + extraBorder;

    BASEZONE_WIDTH = SUMMED_BASE_WIDTH + summedDividerWidth_t;
    BATTLEFIELD_WIDTH = BASEZONE_WIDTH;
    TEAMFIELD_WIDTH = BASEZONE_WIDTH;
}


//
// Divide the remaining vertical space among the battleField and borders
//
let MIN_BORDER_LENGTH = 4;

let BASEZONE_BUFFER = 1 + gameRand(6); // How much room in front of the bases
let BASEZONE_LENGTH = MAX_BASE_LENGTH + BASEZONE_BUFFER;

let BATTLEFIELD_LENGTH;
let BORDER_LENGTH;
let TEAMFIELD_LENGTH;
{
    let space = CONST_ABSOLUTE_MAP_LENGTH - 2 * BASEZONE_LENGTH - 2 * (MIN_BORDER_LENGTH + 1);

    // Select a battlefield length
    switch (
        weightedRandom({
            a: 1,
            b: 4,
            c: 7,
            d: 4,
            e: 1
        })
    ) {
        case "a":
            BATTLEFIELD_LENGTH = rand(
                Math.floor(space * 0.05), // 0.00
                Math.floor(space * 0.10)
            );
            break;
        case "b":
            BATTLEFIELD_LENGTH = rand(
                Math.floor(space * 0.20), // 0.25
                Math.floor(space * 0.30)
            );
            break;
        case "c":
            BATTLEFIELD_LENGTH = rand(
                Math.floor(space * 0.45), // 0.50
                Math.floor(space * 0.55)
            );
            break;
        case "d":
            BATTLEFIELD_LENGTH = rand(
                Math.floor(space * 0.70), // 0.75
                Math.floor(space * 0.80)
            );
            break;
        case "e":
            BATTLEFIELD_LENGTH = rand(
                Math.floor(space * 0.90), // 1.00
                Math.floor(space * 1.00)
            );
            break;
    }

    let extraSpace = space - BATTLEFIELD_LENGTH;
    let extraBorder = Math.floor(extraSpace / 2);
    let remainder = extraSpace % 2; // the remainder can be ignored. It will be implicitly added onto the south border (?)

    BORDER_LENGTH = MIN_BORDER_LENGTH + extraBorder;
    TEAMFIELD_LENGTH = Math.floor(BATTLEFIELD_LENGTH / 2);
}


let DIVIDER_LENGTH = (() => {
    switch (
        weightedRandom({
            a: 2,
            b: 1,
            c: 2,
            d: 3
        })
    ) {
        case "a": return 0;
        case "b": return Math.floor((MAX_BASE_LENGTH - 1) * 0.50);
        case "c": return Math.floor((MAX_BASE_LENGTH - 1) * 0.75);
        case "d": return MAX_BASE_LENGTH - 1;
    }

})();


let DITCH_WIDTH = rand(
    Math.floor(BATTLEFIELD_WIDTH * 0.05),
    Math.floor(TEAMFIELD_WIDTH / 2) - 2
);

let DITCH_LENGTH = BATTLEFIELD_LENGTH - 2 * rand(3, TEAMFIELD_LENGTH - 1);


//
// Select variants
//
let selectedVariants = (() => {

    let candidateVariants = [];

    for (const prop in Variant) {
        if (gameRand() / RMAX < Variant[prop])
            candidateVariants.push(prop);
    }

    if (candidateVariants.length == 0)
        return [];

    let key = candidateVariants[gameRand(candidateVariants.length)];

    return Compatible[key].filter((element) => candidateVariants.includes(element));

})();


// const ROUGHNESS = rand(25, 50);
const ROUGHNESS = 50;


//
// Select heights
//
let BASE_HEIGHT = Math.floor(CONST_MAX_HEIGHT / 2);

let BASEZONE_HEIGHT = BASE_HEIGHT;

let BATTLEFIELD_HEIGHT = BASE_HEIGHT;

let BORDER_HEIGHT = (() => {

    if (selectedVariants.includes("ISLAND")) {
        return BASE_HEIGHT;
    }

    if (selectedVariants.includes("ISLANDX")) {
        return rand(0, BASE_HEIGHT - ROUGHNESS);
    }

    if (selectedVariants.includes("OCEAN")) {
        return rand(BATTLEFIELD_HEIGHT, CONST_MAX_HEIGHT);
    }

    switch (
        weightedRandom({
            a: 1,
            b: 1
        })
    ) {
        case "a": return rand(0, BASE_HEIGHT - ROUGHNESS);
        case "b": return rand(BASE_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
    }

})();

let DIVIDER_HEIGHT = (() => {

    if (selectedVariants.includes("ISLAND")) {
        switch (
            weightedRandom({
                a: 1,
                b: 3
            })
        ) {
            case "a": return BASE_HEIGHT;
            case "b": return rand(BASE_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
        }
    }

    if (selectedVariants.includes("ISLANDX")) {
        switch (
            weightedRandom({
                a: 1,
                b: 3
            })
        ) {
            case "a": return BORDER_HEIGHT;
            case "b": return rand(BORDER_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
        }
    }

    switch (
        weightedRandom({
            a: 1,
            b: 1
        })
    ) {
        case "a": return rand(0, BASE_HEIGHT - ROUGHNESS);
        case "b": return rand(BASE_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
    }

})();

let DITCH_HEIGHT = (() => {

    if (selectedVariants.includes("ISLAND")) {
        switch (
            weightedRandom({
                a: 1,
                b: 3
            })
        ) {
            case "a": return BORDER_HEIGHT;
            case "b": return rand(BATTLEFIELD_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
        }
    }

    if (selectedVariants.includes("ISLANDX")) {
        return rand(BORDER_HEIGHT, CONST_MAX_HEIGHT);
    }

    if (selectedVariants.includes("OCEAN")) {

        switch (
            weightedRandom({
                a: 1,
                b: 1
            })
        ) {
            case "a": return BATTLEFIELD_HEIGHT;
            case "b": return rand(BATTLEFIELD_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
        }
    }

    let ditchWaterChance = BORDER_HEIGHT > BATTLEFIELD_HEIGHT ? 1 : 0;
    switch (
        weightedRandom({
            a: 3,
            b: ditchWaterChance,
            c: 3
        })
    ) {
        case "a": return rand(0, BATTLEFIELD_HEIGHT - ROUGHNESS);
        case "b": return BATTLEFIELD_HEIGHT;
        case "c": return rand(BATTLEFIELD_HEIGHT + ROUGHNESS, CONST_MAX_HEIGHT);
    }

})();


//
// Select textures
//
let BASE_TEXTURE = Texture.CONCRETE1;
let BASEZONE_TEXTURE = BASE_TEXTURE;

let BORDER_TEXTURE = (() => {

    if (selectedVariants.includes("ISLAND") || selectedVariants.includes("ISLANDX")) {
        return Texture.WATER;
    }

    return Texture.DOUBLE_CLIFF

})();

let DIVIDER_TEXTURE = (() => {

    if (selectedVariants.includes("ISLAND") && DIVIDER_HEIGHT == BORDER_HEIGHT) {
        if (DIVIDER_WIDTH > 1) {
            return Texture.WATER;
        }
        return BASE_TEXTURE;
    }

    if (selectedVariants.includes("ISLANDX")) {
        if (DIVIDER_HEIGHT == BORDER_HEIGHT && DIVIDER_WIDTH > 1) {
            return Texture.WATER;
        }
        return Texture.DOUBLE_CLIFF;
    }

    if (DIVIDER_HEIGHT < BASE_HEIGHT && DIVIDER_WIDTH > 1 && DIVIDER_LENGTH > 1 && gameRand(2)) {
        return Texture.WATER;
    }

    return Texture.DOUBLE_CLIFF;

})();

let BATTLEFIELD_TEXTURE = (() => {

    if (selectedVariants.includes("OCEAN")) {
        return Texture.WATER;
    }

    switch (
        weightedRandom({
            a: 1,
            b: 1,
            c: 5,
            d: 2,
            e: 2,
        })
    ) {
        case "a": return Texture.GREEN_MUD;
        case "b": return Texture.RUBBLE1;
        case "c": return Texture.CONCRETE1;
        case "d": return Texture.SAND;
        case "e": return Texture.RED1;
    }

})();

let DITCH_TEXTURE = (() => {

    if (selectedVariants.includes("ISLAND") || selectedVariants.includes("ISLANDX")) {
        if (DITCH_HEIGHT == BORDER_HEIGHT && !selectedVariants.includes("OCEAN")) {
            return Texture.WATER;
        }
        switch (
            weightedRandom({
                a: 1,
                b: 1,
                c: 5,
                d: 2,
                e: 2,
            })
        ) {
            case "a": return Texture.GREEN_MUD;
            case "b": return Texture.RUBBLE1;
            case "c": return Texture.CONCRETE1;
            case "d": return Texture.SAND;
            case "e": return Texture.RED1;
        }
    }

    if (selectedVariants.includes("OCEAN")) {
        let waterChance = 0;
        if (DITCH_HEIGHT == BATTLEFIELD_HEIGHT) {
            waterChance = 11;
        }
        switch (
            weightedRandom({
                a: 1,
                b: 1,
                c: 5,
                d: 2,
                e: 2,
                f: waterChance
            })
        ) {
            case "a": return Texture.GREEN_MUD;
            case "b": return Texture.RUBBLE1;
            case "c": return Texture.CONCRETE1;
            case "d": return Texture.SAND;
            case "e": return Texture.RED1;
            case "f": return Texture.WATER;
        }
    }

    if (DITCH_HEIGHT == BATTLEFIELD_HEIGHT) return Texture.WATER;

    let waterChance = 0;
    if (DITCH_HEIGHT <= BORDER_HEIGHT && DITCH_HEIGHT < BATTLEFIELD_HEIGHT) {
        waterChance = 4;
    }

    switch (
        weightedRandom({
            a: 1,
            b: 1,
            c: 5,
            d: 2,
            e: 2,
            f: waterChance
        })
    ) {
        case "a": return Texture.GREEN_MUD;
        case "b": return Texture.RUBBLE1;
        case "c": return Texture.CONCRETE1;
        case "d": return Texture.SAND;
        case "e": return Texture.RED1;
        case "f": return Texture.WATER;
    }

})();

let scatterPercentage = (() => {

    switch (
        weightedRandom({
            a: 5,
            b: 4,
            c: 3,
            d: 2,
            e: 1
        })
    ) {
        case "a": return 0.1;
        case "b": return 0.2;
        case "c": return 0.4;
        case "d": return 0.6;
        case "e": return 1.0;
    }

})();

// const CLIFF_DIFF = 35; // minimum height difference between two tiles for a cliff to make sense between them

let NUM_OILS = 40;

// Array representing all the oils in a base
let scatterArray = Array(NUM_OILS).fill(true);
// Number of oils that should be removed from each base and scattered into the battlefield
let numOilsToScatter = Math.ceil(Math.floor(NUM_OILS / 4) * scatterPercentage) * 4;
{
    let d = 0; // Current number of oils withheld from scatterArray
    while (d < numOilsToScatter) {
        let randomIndex = gameRand(NUM_OILS);

        if (scatterArray[randomIndex]) { // If true
            scatterArray[randomIndex] = false; // Remove it
            d++; // Increment the number of oils currently withheld
        }
    }
}


let bridge = selectedVariants.includes("BRIDGE");
let scatter = selectedVariants.includes("SCATTER");
let perlin = selectedVariants.includes("PERLIN");


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
// Generate bounding boxes
//
let bb_innerMap = new BoundingBox(
    new XY(
        BORDER_WIDTH + 1,
        BORDER_LENGTH + 1
    ),
    BASEZONE_WIDTH,
    2 * BASEZONE_LENGTH + BATTLEFIELD_LENGTH
);

let bb_basezoneNorth = new BoundingBox(
    bb_innerMap.NW,
    BASEZONE_WIDTH,
    BASEZONE_LENGTH
);

let bb_basezoneSouth = new BoundingBox(
    bb_innerMap.SE,
    BASEZONE_WIDTH,
    BASEZONE_LENGTH,
    Corner.SE
);

let bb_battlefield = new BoundingBox(
    bb_basezoneNorth.SW.add(0,1),
    BATTLEFIELD_WIDTH,
    BATTLEFIELD_LENGTH
);

let bb_teamfieldNorth = new BoundingBox(
    bb_battlefield.NW,
    TEAMFIELD_WIDTH,
    TEAMFIELD_LENGTH
);

let bb_teamfieldSouth = new BoundingBox(
    bb_battlefield.SE,
    TEAMFIELD_WIDTH,
    TEAMFIELD_LENGTH,
    Corner.SE
);

let bb_ditchWest = new BoundingBox(
    bb_battlefield.NW.add(0, (BATTLEFIELD_LENGTH - DITCH_LENGTH) / 2),
    DITCH_WIDTH,
    DITCH_LENGTH
);

bases[0].bb = new BoundingBox(
    origin = new XY(
        x = bb_basezoneNorth.NW.x,
        y = bb_basezoneNorth.NW.y
    ),
    width_t = bases[0].bb.width_t,
    length_t = bases[0].bb.length_t
);
bases[symp(0)].bb = new BoundingBox(
    origin = symbb(new XY(
        x = bb_basezoneNorth.NW.x,
        y = bb_basezoneNorth.NW.y
    ), bb_innerMap),
    width_t = bases[symp(0)].bb.width_t,
    length_t = bases[symp(0)].bb.length_t,
    corner = Corner.SE
);
for (let p = 1; p < CONST_PLAYERS_PER_TEAM; p++) {
    bases[p].bb = new BoundingBox(
        origin = new XY(
            x = bases[p - 1].bb.NE.x + DIVIDER_WIDTH + (DIVIDER_WIDTH == 0 ? 0 : 2) + 1,
            y = bases[p - 1].bb.NE.y
        ),
        width_t = bases[p].bb.width_t,
        length_t = bases[p].bb.length_t
    );
    bases[symp(p)].bb = new BoundingBox(
        origin = symbb(new XY(
            x = bases[p - 1].bb.NE.x + DIVIDER_WIDTH + (DIVIDER_WIDTH == 0 ? 0 : 2) + 1,
            y = bases[p - 1].bb.NE.y
        ), bb_innerMap),
        width_t = bases[p].bb.width_t,
        length_t = bases[p].bb.length_t,
        corner = Corner.SE
    );
}


//
// Basic data structures of the map
//
let texture = Array.from({length: CONST_MAP_AREA}, () => BORDER_TEXTURE | gameRand(4) * CONST_TILE_ROT);
let heightmap = BORDER_TEXTURE == Texture.WATER ? Array(CONST_MAP_AREA).fill(BORDER_HEIGHT) : Array.from({length: CONST_MAP_AREA}, () => roughen(BORDER_HEIGHT));
let structures = [];
let droids = [];
let features = [];


//
// Build the bounding boxes
//
for (const xy of bb_basezoneNorth) {
    setTexture(xy, BASEZONE_TEXTURE);
    setTileHeight(xy, BASEZONE_HEIGHT);
}
for (const xy of bb_basezoneSouth) {
    setTexture(xy, BASEZONE_TEXTURE);
    setTileHeight(xy, BASEZONE_HEIGHT);
}
for (const xy of bb_battlefield) {
    setTexture(xy, BATTLEFIELD_TEXTURE);
    setTileHeight(xy, BATTLEFIELD_HEIGHT);
}
for (let p = CONST_PLAYERS_PER_TEAM; p < CONST_NUM_PLAYERS; p++) { // Iterate over the SOUTHERN team, left to right
    let layout = bases[p].layout;
    let baseWidth_t = bases[p].bb.width_t;
    let baseLength_t = bases[p].bb.length_t;
    let origin = bases[p].bb.NW; // Get the North-West corner of the base

    let scatterIndex = 0; // What index of the scatter array are we currently on

    // Create the base
    for (let row = 0; row < baseLength_t; row++) {
        for (let col = 0; col < baseWidth_t; col++) {
            let char = BaseLayouts[layout][row][col];

            let xySouth = new XY(origin.x + col, origin.y + row);
            let xyNorth = symbb(xySouth, bb_innerMap);

            setTexture(xySouth, BASE_TEXTURE);
            setTexture(xyNorth, BASE_TEXTURE);
            setTileHeight(xySouth, BASE_HEIGHT);
            setTileHeight(xyNorth, BASE_HEIGHT);

            switch (char) {
                case "c":
                    xyNorth = symbb(xySouth.add(0,-1), bb_innerMap);
                    addStructure(xySouth, "A0CyborgFactory", /*rotation=*/2, /*modules=*/0, /*player=*/p); // South (Team B)
                    addStructure(xyNorth, "A0CyborgFactory", /*rotation=*/0, /*modules=*/0, /*player=*/symp(p)); // North (Team A)
                    break;
                case "f":
                    addStructure(xySouth, "A0LightFactory", /*rotation=*/2, /*modules=*/2, /*player=*/p); // South (Team B)
                    addStructure(xyNorth, "A0LightFactory", /*rotation=*/0, /*modules=*/2, /*player=*/symp(p)); // North (Team A)
                    break;
                case "h":
                    xyNorth = symbb(xySouth.add(-1,-1), bb_innerMap);
                    addStructure(xySouth, "A0CommandCentre", /*rotation=*/0, /*modules=*/0, /*player=*/p); // South (Team B)
                    addStructure(xyNorth, "A0CommandCentre", /*rotation=*/2, /*modules=*/0, /*player=*/symp(p)); // North (Team A)
                    break;
                case "p":
                    xyNorth = symbb(xySouth.add(-1,-1), bb_innerMap);
                    addStructure(xySouth, "A0PowerGenerator", /*rotation=*/0, /*modules=*/1, /*player=*/p); // South (Team B)
                    addStructure(xyNorth, "A0PowerGenerator", /*rotation=*/2, /*modules=*/1, /*player=*/symp(p)); // North (Team A)
                    break;
                case "r":
                    xyNorth = symbb(xySouth.add(-1,-1), bb_innerMap);
                    addStructure(xySouth, "A0ResearchFacility", /*rotation=*/0, /*modules=*/1, /*player=*/p); // South (Team B)
                    addStructure(xyNorth, "A0ResearchFacility", /*rotation=*/2, /*modules=*/1, /*player=*/symp(p)); // North (Team A)
                    break;
                case "o":
                    if (!scatter || (scatter && scatterArray[scatterIndex++])) {
                        addStructure(xySouth, "A0ResourceExtractor", /*rotation=*/0, /*modules=*/0, /*player=*/p); // South (Team B)
                        setTexture(xySouth, Texture.RED_CRATER);
                        addStructure(xyNorth, "A0ResourceExtractor", /*rotation=*/2, /*modules=*/0, /*player=*/symp(p)); // North (Team A)
                        setTexture(xyNorth, Texture.RED_CRATER);
                    }
                    break;
                case "t":
                    addDroid(xySouth, "ConstructionDroid", /*rotation=*/2, /*player=*/p); // South (Team B)
                    addDroid(xyNorth, "ConstructionDroid", /*rotation=*/0, /*player=*/symp(p)); // North (Team A)
                    break;
            }
        }
    }
}


//
// Build the dividers
//
if (DIVIDER_WIDTH > 0 && DIVIDER_LENGTH > 0) {
    for (let p = 0; p < CONST_PLAYERS_PER_TEAM - 1; p++) {
        let textureBB = new BoundingBox(
            bases[p].bb.NE.add(2,0),
            DIVIDER_WIDTH,
            DIVIDER_LENGTH
        );
        for (const xy of textureBB) {
            let t = DIVIDER_TEXTURE | gameRand(4) * CONST_TILE_ROT;
            setTexture(xy, t);
            setTexture(symbb(xy, bb_innerMap), t);
        }

        let heightBB = new BoundingBox(
            textureBB.NW,
            DIVIDER_WIDTH + 1,
            DIVIDER_LENGTH + 1
        );
        for (const xy of heightBB) {
            let h = DIVIDER_TEXTURE == Texture.WATER ? DIVIDER_HEIGHT : roughen(DIVIDER_HEIGHT);
            setHeight(xy, h);
            setHeight(symbb(xy, bb_innerMap), h, Corner.SE);
        }
    }
}


if (bridge) {
    for (const xy of bb_ditchWest) {
        setTexture(xy, DITCH_TEXTURE);
        setTexture(symbb(xy, bb_innerMap), DITCH_TEXTURE);
        setTileHeight(xy, DITCH_HEIGHT);
        setTileHeight(symbb(xy, bb_innerMap), DITCH_HEIGHT);
    }
}


if (scatter) {
    for (let p = 0; p < CONST_PLAYERS_PER_TEAM; p++) { // Iterate over the NORTHERN bases
        // Get bounding box of where oils can be placed
        let oilField = new BoundingBox(
            new XY(
                bases[p].bb.NW.x,
                bb_teamfieldNorth.NW.y
            ),
            bases[p].bb.width_t - 1,
            bb_teamfieldNorth.length_t - 1
        );

        let oilsPlaced = 0;
        let attempts = 0;
        while (oilsPlaced < numOilsToScatter && attempts < 100) {
            let xy = new XY(
                oilField.NW.x + gameRand(oilField.width_t - 1),
                oilField.NW.y + gameRand(oilField.length_t - 1)
            );

            attempts++;

            // Collision check, 4x4 square.
            let collision = false;
            for (let i = -1; i < 3; i++) {
                for (let j = -1; j < 3; j++) {
                    if (texture[xy.add(i,j).index()] == Texture.RED_CRATER || !xy.add(i,j).flat()) {
                        collision = true;
                        break;
                    }
                }
                if (collision)
                    break;
            }
            if (collision)
                continue;

            let cluster = [
                xy,
                xy.add(1, 0),
                xy.add(0, 1),
                xy.add(1, 1),
            ]

            for (const xy of cluster) {
                addStructure(xy, "A0ResourceExtractor", /*rotation=*/2, /*modules=*/0, /*player=*/p);
                setTexture(xy, Texture.RED_CRATER);
                addStructure(symbb(xy, bb_innerMap), "A0ResourceExtractor", /*rotation=*/0, /*modules=*/0, /*player=*/symp(p));
                setTexture(symbb(xy, bb_innerMap), Texture.RED_CRATER | 2 * CONST_TILE_ROT);
            }

            oilsPlaced += 4;
        }
    }
}


//
// Draw the battle line
//
{
    let a = new BoundingBox(
        bb_teamfieldNorth.SW.add(0,1),
        TEAMFIELD_WIDTH,
        1
    );
    for (const xy of a) {
        if (texture[xy.index()] != Texture.WATER) {
            setTexture(xy, Texture.ROAD);
            setTexture(symbb(xy, bb_innerMap), Texture.ROAD);
        }
    }
}


//
// Automatically set cliff tiles
//

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

let autoCliffZone = new BoundingBox(
    bb_innerMap.NW.add(-1,-1),
    bb_innerMap.width_t + 2,
    bb_innerMap.length_t + 2,
);

for (const xy of autoCliffZone) {
    if (xy.flat())
        continue;

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


if (perlin) {
    noise.seed(1 + gameRand(65536));

    let perlinMap = [];

    let noiseType = gameRand(2); // 0 = simplex, 1 = perlin

    let bb = new BoundingBox(
        bb_battlefield.NW,
        BATTLEFIELD_WIDTH + 1,
        BATTLEFIELD_LENGTH + 1,
    );

    for (const xy of bb) {
        if (noiseType) {
            perlinMap.push(Math.abs(noise.perlin2(xy.x / 25, xy.y / 25)));
        } else {
            perlinMap.push(Math.abs(noise.simplex2(xy.x / 25, xy.y / 25)));
        }
    }

    // Normalize the values to be between [0, 1]
    let min = Math.min.apply(null, perlinMap);
    let max = Math.max.apply(null, perlinMap);
    let range = max - min;
    let normalizationFactor = 1 / max;

    for (let i = 0; i < perlinMap.length; i++) {
        perlinMap[i] = (perlinMap[i] - min) * normalizationFactor;
    }

    // Select the height for the hills
    let hillHeight = (() => {
        switch (
            weightedRandom({
                a: 1,
                b: 3,
            })
        ) {
            case "a": return Math.floor(gameRand() / RMAX * (CONST_MAX_HEIGHT / 2) + (CONST_MAX_HEIGHT / 2));
            case "b": return CONST_MAX_HEIGHT;
        }

    })();

    // Apply the heightmap onto the battlefield
    let idx = 0;
    for (const xy of bb) {
        setHeight(
            xy,
            Math.max(0, Math.min(CONST_MAX_HEIGHT, BASE_HEIGHT - Math.floor(hillHeight / 2) + perlinMap[idx++] * hillHeight))
        );
    }

    // Smooth at the basezone edges
    for (let i = 0; i < 5; i++) { // Perform 5 passes
        {
            let bb_edge = new BoundingBox(
                bb_battlefield.NW,
                BATTLEFIELD_WIDTH + 1,
                5
            );

            for (const xy of bb_edge) {
                let a1 = xy.add(0,1).height(Corner.NW);
                let b1 = xy.height(Corner.NW);
                let c1 = xy.add(0,-1).height(Corner.NW);
                let average1 = Math.floor((a1 + b1 + c1) / 3);

                setHeight(xy, average1);
            }
        }
        {
            for (let i = 0; i < 5; i++) { // I did this ugly thing because I want to smooth starting from the base edge and towards the middle
                let bb_edge = new BoundingBox(
                    bb_basezoneSouth.NW.add(0,-i),
                    BATTLEFIELD_WIDTH + 1,
                    1,
                    Corner.SW
                );
                for (const xy of bb_edge) {
                    let a1 = xy.add(0,1).height(Corner.NW);
                    let b1 = xy.height(Corner.NW);
                    let c1 = xy.add(0,-1).height(Corner.NW);
                    let average1 = Math.floor((a1 + b1 + c1) / 3);

                    setHeight(xy, average1);
                }
            }
        }
    }
}


// Return the data.
setMapData(CONST_ABSOLUTE_MAP_WIDTH, CONST_ABSOLUTE_MAP_LENGTH, texture, heightmap, structures, droids, features);
