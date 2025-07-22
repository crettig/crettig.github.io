export const GameConfig = {
    world: {
        width: 2048,
        height: 1536,
    },
    player: {
        spawn: { x: 512, y: 384 },
    },
    enemies: {
        positions: [
            { x: 800, y: 300 },
            { x: 300, y: 600 },
            { x: 1200, y: 500 },
            { x: 600, y: 800 },
            { x: 1500, y: 300 }
        ]
    },
    crates: {
        positions: [
            { x: 400, y: 200 },
            { x: 700, y: 450 },
            { x: 900, y: 600 },
            { x: 1300, y: 400 },
            { x: 200, y: 700 }
        ]
    },
    torches: {
        positions: [
            { x: 250, y: 250 },
            { x: 750, y: 200 },
            { x: 500, y: 600 },
            { x: 1100, y: 350 },
            { x: 1400, y: 700 },
            { x: 300, y: 900 }
        ]
    },
    upgraders: {
        positions: [
            { x: 1000, y: 800 }
        ]
    },
    physics: {
        debug: false
    }
};