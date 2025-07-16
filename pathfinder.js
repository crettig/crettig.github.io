

import Phaser from 'phaser';

/**
 * A simple Priority Queue for the A* algorithm.
 */
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

/**
 * A* Pathfinding for a tile-based grid.
 * Analyzes the level layout to determine walkable tiles for navigation.
 */
export class Pathfinder {
    constructor(levelGenerator) {
        this.levelGenerator = levelGenerator;
        this.scene = levelGenerator.scene;
        this.grid = [];
        this.tileSize = levelGenerator.config.tileSize;
        this.debugGraphics = null;
        this._createGrid();
    }

    /**
     * Creates a simplified grid representation of the level, accounting for entity size.
     * '1' indicates a walkable tile, '0' represents a wall or obstacle.
     * This version checks for 1x2 tile clearance for enemies.
     */
    _createGrid() {
        const { worldTiles } = this.levelGenerator;
        const rawGrid = [];
        // Step 1: Create the initial grid based on raw tile properties (is a single tile walkable?)
        for (let y = 0; y < worldTiles; y++) {
            const row = [];
            for (let x = 0; x < worldTiles; x++) {
                const groundTile = this.levelGenerator.groundLayer.getTileAt(x, y);
                const wallTile = this.levelGenerator.wallLayer.getTileAt(x, y);
                const objectTile = this.levelGenerator.objectLayer.getTileAt(x, y);
                const isWalkable = !!groundTile && !wallTile && !(objectTile && objectTile.collides);
                row.push(isWalkable ? 1 : 0);
            }
            rawGrid.push(row);
        }
        // Step 2: Create the final navigation grid based on a 1x2 entity size.
        // A tile (x, y) is walkable if the 1x2 area starting at (x, y) is clear.
        for (let y = 0; y < worldTiles; y++) {
            const newRow = [];
            for (let x = 0; x < worldTiles; x++) {
                // Check if the tile under the enemy is also walkable.
                // We check one tile down and one tile to the right for a small buffer.
                const canFit =
                    rawGrid[y][x] === 1 && // Top-left is walkable
                    (y + 1 < worldTiles && rawGrid[y + 1][x] === 1); // Tile below is walkable
                newRow.push(canFit ? 1 : 0);
            }
            this.grid.push(newRow);
        }
    }

    /**
     * Converts world pixel coordinates to grid tile coordinates.
     * @param {number} worldX - The x-coordinate in the game world.
     * @param {number} worldY - The y-coordinate in the game world.
     * @returns {Phaser.Math.Vector2} The corresponding tile coordinates.
     */
    worldToGrid(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        return new Phaser.Math.Vector2(tileX, tileY);
    }
    /**
     * Creates a graphics object for rendering debug information.
     */
    enableDebugging() {
        this.debugGraphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff00ff, alpha: 0.7 } });
        this.debugGraphics.setDepth(99); // Render below player/enemies but above most of the level
    }
    /**
     * Draws a given path on the debug graphics layer.
     * @param {Array<Phaser.Math.Vector2>} path - The path to draw.
     */
    drawDebugPath(path) {
        if (!this.debugGraphics || !path || path.length < 2) {
            return;
        }
        this.debugGraphics.beginPath();
        
        const halfTile = this.tileSize / 2;
        
        // Move to the center of the first tile in the path
        this.debugGraphics.moveTo(path[0].x * this.tileSize + halfTile, path[0].y * this.tileSize + halfTile);
        // Draw lines to the center of each subsequent tile
        for (let i = 1; i < path.length; i++) {
            this.debugGraphics.lineTo(path[i].x * this.tileSize + halfTile, path[i].y * this.tileSize + halfTile);
        }
        this.debugGraphics.strokePath();
    }
    /**
     * Implements the A* pathfinding algorithm.
     * @param {Phaser.Math.Vector2} startVec - The starting tile coordinates.
     * @param {Phaser.Math.Vector2} endVec - The ending tile coordinates.
     * @returns {Array<Phaser.Math.Vector2>} An array of tile coordinates representing the path, or null if no path is found.
     */
    findPath(startVec, endVec) {
        const startKey = `${startVec.x},${startVec.y}`;
        const endKey = `${endVec.x},${endVec.y}`;
        // Basic validation
        if (!this._isValid(startVec.x, startVec.y) || !this._isValid(endVec.x, endVec.y)) {
            return null;
        }
        const openSet = new PriorityQueue();
        openSet.enqueue(startKey, 0);
        const cameFrom = {};
        const gScore = { [startKey]: 0 };
        const fScore = { [startKey]: this._heuristic(startVec, endVec) };
        const maxIterations = this.grid.length * this.grid[0].length; // Safety break
        let iterations = 0;
        while (!openSet.isEmpty() && iterations < maxIterations) {
            iterations++;
            const currentKey = openSet.dequeue();
            const currentVec = this._keyToVec(currentKey);
            if (currentKey === endKey) {
                const path = this._reconstructPath(cameFrom, currentKey);
                return this._smoothPath(path);
            }
            const neighbors = this._getNeighbors(currentVec);
            for (const neighborVec of neighbors) {
                const neighborKey = `${neighborVec.x},${neighborVec.y}`;
                const tentativeGScore = gScore[currentKey] + this._distance(currentVec, neighborVec);
                if (!gScore.hasOwnProperty(neighborKey) || tentativeGScore < gScore[neighborKey]) {
                    cameFrom[neighborKey] = currentKey;
                    gScore[neighborKey] = tentativeGScore;
                    fScore[neighborKey] = gScore[neighborKey] + this._heuristic(neighborVec, endVec);
                    
                    openSet.enqueue(neighborKey, fScore[neighborKey]);
                }
            }
        }
        return null; // No path found
    }
    /**
     * Checks if a given tile coordinate is within bounds and walkable.
     * @param {number} x - The tile x-coordinate.
     * @param {number} y - The tile y-coordinate.
     * @returns {boolean}
     */
    _isValid(x, y) {
        return y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length && this.grid[y][x] === 1;
    }
    /**
     * Manhattan distance heuristic.
     * @param {Phaser.Math.Vector2} a
     * @param {Phaser.Math.Vector2} b
     * @returns {number}
     */
    _heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    /**
     * Calculates the distance between two adjacent tiles (1 for cardinal, ~1.4 for diagonal).
     * @param {Phaser.Math.Vector2} a
     * @param {Phaser.Math.Vector2} b
     * @returns {number}
     */
    _distance(a, b) {
        return (Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1) ? 1.414 : 1;
    }
    /**
     * Converts a string key "x,y" back to a Vector2.
     * @param {string} key
     * @returns {Phaser.Math.Vector2}
     */
    _keyToVec(key) {
        const parts = key.split(',');
        return new Phaser.Math.Vector2(parseInt(parts[0], 10), parseInt(parts[1], 10));
    }
    /**
     * Gets all valid, walkable neighbors for a given tile.
     * @param {Phaser.Math.Vector2} vec - The tile coordinate.
     * @returns {Array<Phaser.Math.Vector2>}
     */
    _getNeighbors(vec) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const newX = vec.x + dx;
                const newY = vec.y + dy;
                if (this._isValid(newX, newY)) {
                    neighbors.push(new Phaser.Math.Vector2(newX, newY));
                }
            }
        }
        return neighbors;
    }
    /**
     * Reconstructs the path from the cameFrom map.
     * @param {object} cameFrom - Map of node connections.
     * @param {string} currentKey - The end node key.
     * @returns {Array<Phaser.Math.Vector2>} The reconstructed path.
     */
    _reconstructPath(cameFrom, currentKey) {
        const totalPath = [this._keyToVec(currentKey)];
        while (cameFrom[currentKey]) {
            currentKey = cameFrom[currentKey];
            totalPath.unshift(this._keyToVec(currentKey));
        }
        return totalPath;
    }
    /**
     * Simplifies a path by removing unnecessary nodes using line-of-sight checks.
     * @param {Array<Phaser.Math.Vector2>} path - The raw path from A*.
     * @returns {Array<Phaser.Math.Vector2>} The smoothed path.
     */
    _smoothPath(path) {
        if (!path || path.length < 3) {
            return path; // Not enough points to smooth
        }
        const newPath = [path[0]];
        let currentIndex = 0;
        while (currentIndex < path.length - 1) {
            let lastVisibleIndex = currentIndex + 1;
            for (let i = currentIndex + 2; i < path.length; i++) {
                if (this._hasLineOfSight(path[currentIndex], path[i])) {
                    lastVisibleIndex = i;
                } else {
                    break;
                }
            }
            newPath.push(path[lastVisibleIndex]);
            currentIndex = lastVisibleIndex;
        }
        return newPath;
    }
    /**
     * Checks if there is an unobstructed line of sight between two tile coordinates.
     * Uses a Bresenham-like grid traversal algorithm.
     * @param {Phaser.Math.Vector2} startVec - The starting tile coordinate.
     * @param {Phaser.Math.Vector2} endVec - The ending tile coordinate.
     * @returns {boolean} True if there is line of sight, false otherwise.
     */
    _hasLineOfSight(startVec, endVec) {
        let x0 = startVec.x;
        let y0 = startVec.y;
        const x1 = endVec.x;
        const y1 = endVec.y;
        const dx = Math.abs(x1 - x0);
        const dy = -Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        while (true) {
            if (!this._isValid(x0, y0)) {
                return false;
            }
            if (x0 === x1 && y0 === y1) {
                break;
            }
            const e2 = 2 * err;
            if (e2 >= dy) {
                err += dy;
                x0 += sx;
            }
            if (e2 <= dx) {
                err += dx;
                y0 += sy;
            }
        }
        return true;
    }
}