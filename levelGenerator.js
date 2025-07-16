import Phaser from 'phaser';
import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';
import { CasinoFloorTypes, RoomThemes, CasinoWallTypes } from './casinoTileTypes.js';

/**
 * Improved procedural casino level generator using BSP partitioning,
 * rule-based room assignment, corridor carving, and theme decoration.
 * Builds on original LevelGenerator logic fileciteturn0file0 and tile definitions fileciteturn0file1.
 */
export class LevelGenerator {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed || Date.now().toString();
    this.random = this._createSeededRandom(this.seed);
    this.noise = createNoise2D(this.random);

    // Configuration
    this.config = {
      worldChunks: 11,
      chunkSize: 21,
      tileSize: 48,
      minRoomSize: 8,
      maxRoomSize: 18,
      floorNoiseScale: 0.1, // Smaller value = larger splotches
    };
    // Compute dimensions
    this.worldTiles = this.config.worldChunks * this.config.chunkSize;
    // Tilemap setup
    this.map = this.scene.make.tilemap({
      tileWidth: this.config.tileSize,
      tileHeight: this.config.tileSize,
      width: this.worldTiles,
      height: this.worldTiles
    });
    this.floorSet = this.map.addTilesetImage('casinofloor', 'casinofloor', this.config.tileSize, this.config.tileSize);
    this.groundLayer = this.map.createBlankLayer('Ground', [this.floorSet]);
    this.wallSet = this.map.addTilesetImage('casiowall', 'casiowall', this.config.tileSize, this.config.tileSize, 0, 0);
    this.wallLayer = this.map.createBlankLayer('Walls', [this.wallSet]);
    this.objectSet = this.map.addTilesetImage('casinoobjects', 'casinoobjects', this.config.tileSize, this.config.tileSize);
    this.objectLayer = this.map.createBlankLayer('Objects', [this.objectSet]);
    // Add a new layer for shadows, rendered on top of the ground but below walls
    this.shadowLayer = this.map.createBlankLayer('Shadows', [this.floorSet]);
    this.scene.physics.world.setBounds(0, 0, this.worldTiles * this.config.tileSize, this.worldTiles * this.config.tileSize);
  }

  /** Create a deterministic random function from seed string */
  _createSeededRandom(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13;
      h ^= h >>> 7;
      h += h << 3;
      h ^= h >>> 17;
      h += h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  /** Entry point to build map */
  generate(onComplete) {
    this.rooms = [];
    const root = { x: 0, y: 0, w: this.worldTiles, h: this.worldTiles };
    // A lower split depth creates fewer, larger partitions, spacing rooms out more.
    this._splitSpace(root, 6);
    this._createRooms(root); // This now populates this.rooms directly
    this._connectPartitions(root);
    this._assignRoomThemes();
    this._drawFloors();
    this._drawWalls();
    this._drawObjects();
    if (onComplete) onComplete();
  }

  /** Recursively split region with BSP */
  _splitSpace(node, depth) {
    if (depth <= 0) return;
    // Choose split axis by larger dimension
    const splitVertically = node.w > node.h;
    const max = (splitVertically ? node.w : node.h) - this.config.minRoomSize;
    if (max <= this.config.minRoomSize) return;
    const splitAt = this.config.minRoomSize + Math.floor(this.random() * (max - this.config.minRoomSize));
    let childA, childB;
    if (splitVertically) {
      childA = { x: node.x, y: node.y, w: splitAt, h: node.h };
      childB = { x: node.x + splitAt, y: node.y, w: node.w - splitAt, h: node.h };
    } else {
      childA = { x: node.x, y: node.y, w: node.w, h: splitAt };
      childB = { x: node.x, y: node.y + splitAt, w: node.w, h: node.h - splitAt };
    }
    node.left = childA;
    node.right = childB;
    this._splitSpace(childA, depth - 1);
    this._splitSpace(childB, depth - 1);
  }

  /** Create rooms in leaf nodes and attach them to the BSP tree */
  _createRooms(node) {
    if (node.left || node.right) {
      if (node.left) this._createRooms(node.left);
      if (node.right) this._createRooms(node.right);
      return;
    }
    // Leaf: create and attach room
    const choice = this.random();
    let room;
    // 40% chance for circle, 30% for octagon, 30% for rectangle
    if (choice < 0.4 && node.w >= this.config.minRoomSize && node.h >= this.config.minRoomSize) { // Circle
      const maxRadius = Math.min(Math.floor(node.w / 2), Math.floor(node.h / 2), Math.floor(this.config.maxRoomSize / 2));
      const minRadius = Math.floor(this.config.minRoomSize / 2);
      if (maxRadius > minRadius) {
          const radius = this._randRange(minRadius, maxRadius);
          const cx = node.x + Math.floor(node.w / 2);
          const cy = node.y + Math.floor(node.h / 2);
          room = {
              x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2, // Bounding box
              cx, cy, radius,
              shape: 'circle', type: null
          };
      } else {
          room = this._createRectangularRoom(node);
      }
    } else if (choice < 0.7 && node.w >= this.config.minRoomSize && node.h >= this.config.minRoomSize) { // Octagon
        room = this._createOctagonalRoom(node);
    } else { // Rectangle
        room = this._createRectangularRoom(node);
    }
    node.room = room;
    this.rooms.push(room);
  }
  _createOctagonalRoom(node) {
      const maxSize = Math.min(node.w, node.h, this.config.maxRoomSize);
      if (maxSize < this.config.minRoomSize) return this._createRectangularRoom(node); // Fallback
      const size = this._randRange(this.config.minRoomSize, maxSize);
      const cx = node.x + Math.floor(node.w / 2);
      const cy = node.y + Math.floor(node.h / 2);
      const radius = Math.floor(size / 2);
      const cut = Math.floor(radius / 3); // How much to cut from corners
      return {
          x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2,
          cx, cy, radius, cut,
          shape: 'octagon', type: null
      };
  }
  _createRectangularRoom(node) {
      const w = this._randRange(this.config.minRoomSize, Math.min(node.w, this.config.maxRoomSize));
      const h = this._randRange(this.config.minRoomSize, Math.min(node.h, this.config.maxRoomSize));
      const x = node.x + Math.floor((node.w - w) / 2);
      const y = node.y + Math.floor((node.h - h) / 2);
      return { x, y, w, h, shape: 'rectangle', type: null };
  }
  /** Recursively connect partitions to ensure full connectivity */
  _connectPartitions(node) {
    if (!node.left || !node.right) return; // Leaf node
    // Recurse down the tree first
    this._connectPartitions(node.left);
    this._connectPartitions(node.right);
    const roomA = this._getRandomRoomFromPartition(node.left);
    const roomB = this._getRandomRoomFromPartition(node.right);
    // Connect a random point on the edge of each room, not just the centers
    const point1 = this._getRoomConnectionPoint(roomA);
    const point2 = this._getRoomConnectionPoint(roomB);
    const corridorWidth = this._randRange(4, 6); // Keep corridors between 4 and 6 tiles wide
    // Introduce a "dog-leg" or "Z-bend" to corridors for more variation.
    const midX = this._randRange(Math.min(point1.x, point2.x), Math.max(point1.x, point2.x));
    const midY = this._randRange(Math.min(point1.y, point2.y), Math.max(point1.y, point2.y));
    if (this.random() < 0.5) {
      // Horizontal-first "Z"
      this._carveHorizontal(point1.x, midX, point1.y, corridorWidth);
      this._carveVertical(point1.y, point2.y, midX, corridorWidth);
      this._carveHorizontal(midX, point2.x, point2.y, corridorWidth);
    } else {
      // Vertical-first "Z"
      this._carveVertical(point1.y, midY, point1.x, corridorWidth);
      this._carveHorizontal(point1.x, point2.x, midY, corridorWidth);
      this._carveVertical(midY, point2.y, point2.x, corridorWidth);
    }
  }
  _getRoomConnectionPoint(room) {
    if (room.shape === 'circle') {
      // Pick a random point inside the circle, but not at the very edge, to start the corridor from.
      const angle = this.random() * 2 * Math.PI;
      const distance = this.random() * (room.radius - 2); // Ensure it's inside
      return {
        x: Math.floor(room.cx + Math.cos(angle) * distance),
        y: Math.floor(room.cy + Math.sin(angle) * distance)
      };
    } else if (room.shape === 'octagon') {
        const angle = this.random() * 2 * Math.PI;
        const distance = this.random() * (room.radius - room.cut - 1); // Stay away from edges
        return {
            x: Math.floor(room.cx + Math.cos(angle) * distance),
            y: Math.floor(room.cy + Math.sin(angle) * distance)
        };
    } else { // Rectangular room
      return {
        x: this._randRange(room.x + 1, room.x + room.w - 1),
        y: this._randRange(room.y + 1, room.y + room.h - 1)
      };
    }
  }
  _getRandomRoomFromPartition(node) {
    if (node.room) return node.room; // This is a leaf with a room
    // Not a leaf, so pick a side and recurse
    const nextNode = (this.random() < 0.5 && node.left) ? node.left : (node.right || node.left);
    return this._getRandomRoomFromPartition(nextNode);
  }
  _carveHorizontal(x1, x2, y, width) {
    const fromX = Math.min(x1, x2);
    const toX = Math.max(x1, x2);
    const halfWidth = Math.floor(width / 2);
    for (let x = fromX; x <= toX; x++) {
      for (let w = -halfWidth; w < width - halfWidth; w++) {
        this._setFloor(x, y + w, CasinoFloorTypes.CORRIDOR_METAL_GRATE);
      }
    }
  }
  _carveVertical(y1, y2, x, width) {
    const fromY = Math.min(y1, y2);
    const toY = Math.max(y1, y2);
    const halfWidth = Math.floor(width / 2);
    for (let y = fromY; y <= toY; y++) {
      for (let w = -halfWidth; w < width - halfWidth; w++) {
        this._setFloor(x + w, y, CasinoFloorTypes.CORRIDOR_METAL_GRATE);
      }
    }
  }
  /** Assigns a theme to each room from the available RoomThemes */
  _assignRoomThemes() {
    const themes = Object.values(RoomThemes);
    this.rooms.forEach(room => {
      // Filter out themes that are unsuitable for the room's size.
      const suitableThemes = themes.filter(theme => {
        if (theme.id === 'water_feature') {
          // Water features should only be in large, open rooms.
          return room.w > 12 && room.h > 12;
        }
        return true;
      });
      // Assign a random suitable theme
      room.type = Phaser.Utils.Array.GetRandom(suitableThemes);
      // Pre-select a wall type for consistency
      if (room.type.wallTypes && room.type.wallTypes.length > 0) {
          room.mainWallType = Phaser.Utils.Array.GetRandom(room.type.wallTypes);
          // Simple way to pick a corner tile - maybe a different one from the same set?
          room.cornerWallType = Phaser.Utils.Array.GetRandom(room.type.wallTypes.filter(w => w.id !== room.mainWallType.id)) || room.mainWallType;
      } else {
          room.mainWallType = CasinoWallTypes.PLAIN_STONE_WALL;
          room.cornerWallType = CasinoWallTypes.PLAIN_STONE_WALL;
      }
    });
  }
  /** Draw floors into the carved rooms based on their assigned theme */
  _drawFloors() {
    // Fill all rooms with floor tiles using noise for patterning
    this.rooms.forEach(room => {
      const floorTypes = room.type.floorTypes;
      if (!floorTypes || floorTypes.length === 0) return;
      if (room.shape === 'circle') {
          for (let ix = -room.radius; ix <= room.radius; ix++) {
              for (let iy = -room.radius; iy <= room.radius; iy++) {
                  if (ix * ix + iy * iy <= room.radius * room.radius) {
                      const tileX = room.cx + ix;
                      const tileY = room.cy + iy;
                      const noiseValue = this.noise(tileX * this.config.floorNoiseScale, tileY * this.config.floorNoiseScale);
                      const typeIndex = Math.floor(((noiseValue + 1) / 2) * floorTypes.length);
                      const chosenType = floorTypes[Phaser.Math.Clamp(typeIndex, 0, floorTypes.length - 1)];
                      this._setFloor(tileX, tileY, chosenType);
                  }
              }
          }
      } else if (room.shape === 'octagon') {
          for (let ix = -room.radius; ix <= room.radius; ix++) {
              for (let iy = -room.radius; iy <= room.radius; iy++) {
                  // Check if the tile is outside the corner cuts
                  if (Math.abs(ix) + Math.abs(iy) <= room.radius * 2 - room.cut) {
                      const tileX = room.cx + ix;
                      const tileY = room.cy + iy;
                      const noiseValue = this.noise(tileX * this.config.floorNoiseScale, tileY * this.config.floorNoiseScale);
                      const typeIndex = Math.floor(((noiseValue + 1) / 2) * floorTypes.length);
                      const chosenType = floorTypes[Phaser.Math.Clamp(typeIndex, 0, floorTypes.length - 1)];
                      this._setFloor(tileX, tileY, chosenType);
                  }
              }
          }
      } else { // Rectangular room
          for (let ix = 0; ix < room.w; ix++) {
              for (let iy = 0; iy < room.h; iy++) {
                  const tileX = room.x + ix;
                  const tileY = room.y + iy;
                  const noiseValue = this.noise(tileX * this.config.floorNoiseScale, tileY * this.config.floorNoiseScale);
                  const typeIndex = Math.floor(((noiseValue + 1) / 2) * floorTypes.length);
                  const chosenType = floorTypes[Phaser.Math.Clamp(typeIndex, 0, floorTypes.length - 1)];
                  this._setFloor(tileX, tileY, chosenType);
              }
          }
      }
    });
  }
  /** Scans the map and places wall tiles adjacent to floor tiles */
  _drawWalls() {
    for (let y = 0; y < this.worldTiles; y++) {
      for (let x = 0; x < this.worldTiles; x++) {
        // If there's already a floor tile here, we don't need a wall
        if (this.groundLayer.getTileAt(x, y)) continue;
        // Find the adjacent floor tile to determine the wall theme
        const north = this.groundLayer.getTileAt(x, y - 1);
        const south = this.groundLayer.getTileAt(x, y + 1);
        const west = this.groundLayer.getTileAt(x - 1, y);
        const east = this.groundLayer.getTileAt(x + 1, y);
        const isEdge = x === 0 || y === 0 || x === this.worldTiles - 1 || y === this.worldTiles - 1;
        const adjacentFloor = north || south || west || east;
        
        if (adjacentFloor) {
            let wallType;
            // Check if this wall tile is a corner of a room
            const isHorizontalWall = (north && north.index !== -1) || (south && south.index !== -1);
            const isVerticalWall = (west && west.index !== -1) || (east && east.index !== -1);
            const isCorner = isHorizontalWall && isVerticalWall;
            // Find which room this wall belongs to by checking adjacent floor tiles
            const adjacentRoom = this._getRoomFromTile(adjacentFloor);
            if (adjacentRoom) {
                wallType = isCorner ? adjacentRoom.cornerWallType : adjacentRoom.mainWallType;
            } else {
                // It's a corridor wall, so use the specific corridor wall type.
                wallType = CasinoWallTypes.CORRIDOR_CONCRETE_WALL;
            }
            if (wallType && wallType.indices.length > 0) {
                const wallTileIndex = this.wallSet.firstgid + Phaser.Utils.Array.GetRandom(wallType.indices);
                this.wallLayer.putTileAt(wallTileIndex, x, y);
            }
        }
      }
    }
    this._drawShadows();
  }
  /** Draws a shadow tile on the floor below a wall tile */
  _drawShadows() {
    // Using two shades for a more graded shadow effect.
    // Tile 211: Darkest part of the shadow, directly under the wall.
    // Tile 210: Lighter part of the shadow, for the fade effect.
    const darkShadowTile = this.floorSet.firstgid + 211;
    const lightShadowTile = this.floorSet.firstgid + 210;
    for (let y = 1; y < this.worldTiles; y++) {
      for (let x = 0; x < this.worldTiles; x++) {
        const wallAbove = this.wallLayer.getTileAt(x, y - 1);
        const floorCurrent = this.groundLayer.getTileAt(x, y);
        const floorBelow = this.groundLayer.getTileAt(x, y + 1);
        // If there's a wall tile directly above a floor tile, add a shadow.
        if (wallAbove && floorCurrent) {
          // Place the darkest shadow right under the wall.
          this.shadowLayer.putTileAt(darkShadowTile, x, y);
          // Place the lighter shadow one tile below that, if there's floor.
          if (floorBelow) {
            this.shadowLayer.putTileAt(lightShadowTile, x, y + 1);
          }
        }
      }
    }
  }
  _getNearestRoom(tileX, tileY) {
      let nearestRoom = null;
      let minDistance = Infinity;
      this.rooms.forEach(room => {
          const roomCenterX = room.x + room.w / 2;
          const roomCenterY = room.y + room.h / 2;
          const distance = Phaser.Math.Distance.Squared(tileX, tileY, roomCenterX, roomCenterY);
          if (distance < minDistance) {
              minDistance = distance;
              nearestRoom = room;
          }
      });
      return nearestRoom;
  }
  _getRoomFromTile(tile) {
      if (!tile) return null;
      if (!tile) return null;
      for (const room of this.rooms) {
          if (room.shape === 'circle') {
              const distSq = (tile.x - room.cx) ** 2 + (tile.y - room.cy) ** 2;
              if (distSq <= room.radius ** 2) {
                  return room;
              }
          } else if (room.shape === 'octagon') {
              const dx = Math.abs(tile.x - room.cx);
              const dy = Math.abs(tile.y - room.cy);
              if (dx + dy <= room.radius * 2 - room.cut) {
                  return room;
              }
          } else {
              if (tile.x >= room.x && tile.x < room.x + room.w &&
                  tile.y >= room.y && tile.y < room.y + room.h) {
                  return room;
              }
          }
      }
      return null;
  }
  /** Helpers for tile placement */
  _setFloor(x, y, type) {
    if (x < 0 || x >= this.worldTiles || y < 0 || y >= this.worldTiles || !type || !type.indices) return;
    
    // Corridors pass a single type, rooms pass a single type from noise.
    // No need to randomize from a list anymore.
    const tileDef = type.indices.length > 0 ? type : CasinoFloorTypes.DEFAULT;
    const idx = this.floorSet.firstgid + Phaser.Utils.Array.GetRandom(tileDef.indices);
    this.groundLayer.putTileAt(idx, x, y);
  }
  _randRange(min,max) {
    return min + Math.floor(this.random()*(max-min));
  }
  _drawObjects() {
    this.rooms.forEach(room => {
        const objectTypes = room.type.objectTypes;
        if (!objectTypes || objectTypes.length === 0) return;
        const roomArea = room.w * room.h;
        // Place 1 object per 64 tiles, with a random chance for one extra.
        let numObjects = Math.floor(roomArea / 64) + (this.random() < 0.5 ? 1 : 0);
        if (numObjects === 0) return;
        // Keep track of placed object areas to prevent overlaps
        const placedObjects = [];
        for (let i = 0; i < numObjects; i++) {
            // Try to place an object a few times before giving up
            for (let attempt = 0; attempt < 10; attempt++) {
                const objectType = Phaser.Utils.Array.GetRandom(objectTypes);
                // Check if the first element of indices is an array to determine if it's 2D
                const is2D = Array.isArray(objectType.indices[0]);
                const objHeight = is2D ? objectType.indices.length : 1;
                const objWidth = is2D ? objectType.indices[0].length : objectType.indices.length;
                
                // Attempt to find a valid position, leaving a margin
                let placeX, placeY;
                if (room.shape === 'circle') {
                    // Try to find a spot inside the circle
                    const angle = this.random() * 2 * Math.PI;
                    // Place away from the center, but not too close to the edge
                    const dist = this.random() * (room.radius - Math.max(objWidth, objHeight));
                    placeX = Math.floor(room.cx + Math.cos(angle) * dist);
                    placeY = Math.floor(room.cy + Math.sin(angle) * dist);
                } else if (room.shape === 'octagon') {
                    const angle = this.random() * 2 * Math.PI;
                    const dist = this.random() * (room.radius - room.cut - Math.max(objWidth, objHeight));
                    placeX = Math.floor(room.cx + Math.cos(angle) * dist);
                    placeY = Math.floor(room.cy + Math.sin(angle) * dist);
                } else {
                    placeX = this._randRange(room.x + 1, room.x + room.w - objWidth - 1);
                    placeY = this._randRange(room.y + 1, room.y + room.h - objHeight - 1);
                }
                if (placeX < 0 || placeY < 0) continue; // Invalid position
                const newObjectBounds = new Phaser.Geom.Rectangle(placeX, placeY, objWidth, objHeight);
                const overlaps = placedObjects.some(existing => Phaser.Geom.Intersects.RectangleToRectangle(newObjectBounds, existing));
                
                // Also check if object is on a floor tile
                const groundTile = this.groundLayer.getTileAt(placeX, placeY);
                if (!overlaps && groundTile) {
                    // Valid spot found, place the object tiles
                    if (is2D) {
                        objectType.indices.forEach((row, rowIndex) => {
                            row.forEach((tileIndex, colIndex) => {
                                const finalIndex = this.objectSet.firstgid + tileIndex;
                                const tile = this.objectLayer.putTileAt(finalIndex, placeX + colIndex, placeY + rowIndex);
                                if (tile && objectType.collidable) tile.setCollision(true);
                            });
                        });
                    } else {
                        // Handle 1D array for vertically stacked objects
                        objectType.indices.forEach((tileIndex, rowIndex) => {
                            const finalIndex = this.objectSet.firstgid + tileIndex;
                            const tile = this.objectLayer.putTileAt(finalIndex, placeX, placeY + rowIndex);
                            if (tile && objectType.collidable) tile.setCollision(true);
                        });
                    }
                    placedObjects.push(newObjectBounds);
                    break; // Move to the next object
                }
            }
        }
    });
  }
}