/**
 * Defines the tile types available in the 'casinofloor' tileset.
 * The indices are based on a 48x48 grid for the 'CasinoFloor.png' asset.
 */
export const CasinoFloorTypes = Object.freeze({
  // --- Basic Floors ---
  BROWN_CARPET: { id: 'brown_carpet', name: 'Brown Carpet', indices: [208,209], collidable: false },
  STONE_FLOOR: { id: 'stone_floor', name: 'Stone Floor', indices: [210], collidable: false },
  BRICK_FLOOR: { id: 'brick_floor', name: 'Brick Floor', indices: [212], collidable: false },
  WOOD_PANEL: { id: 'wood_panel', name: 'Wood Panel Floor', indices: [198,199,214,215], collidable: false },
  HEXAGON_NEON: { id: 'hexagon_neon', name: 'Hexagon Neon Floor', indices: [7, 23], collidable: false },
  HERRINGBONE: { id: 'herringbone', name: 'Herringbone Floor', indices: [310], collidable: false },
  BASKET_WEAVE: { id: 'basket_weave', name: 'Basket Weave Floor', indices: [308], collidable: false },
  DIAMOND_PATTERN_TEAL: { id: 'diamond_pattern', name: 'Diamond Pattern Floor Teal', indices: [352], collidable: false },
  DIAMOND_PATTERN_PURPLE: { id: 'diamond_pattern', name: 'Diamond Pattern Floor Purple', indices: [354], collidable: false },
  TECH_CRYSTAL_TEAL: { id: 'tech_crystal_teal', name: 'Tech Crystal Floor Teal', indices: [356], collidable: false },
  TECH_CRYSTAL_PURPLE: { id: 'tech_crystal_purple', name: 'Tech Crystal Floor Purple', indices: [358], collidable: false },
  
  // --- Neon & Water ---
  NEON_WATER_PINK: { id: 'neon_water_pink', name: 'Neon Water (Pink)', indices: [8,9,10,11,12,13], collidable: true },
  NEON_WATER_BLUE: { id: 'neon_water_blue', name: 'Neon Water (Blue)', indices: [0,1,2,3,4,5], collidable: true },
  NEON_WATER_PURPLE: { id: 'neon_water_purple', name: 'Neon Water (Purple)', indices: [104,105,106,107,108,109], collidable: true },
  NEON_STRIPE_FLOOR: { id: 'neon_stripe_floor', name: 'Neon Stripe Floor', indices: [12, 13, 14, 15], collidable: false },
  
  // --- Corridor Specific ---
  CORRIDOR_METAL_GRATE: { id: 'corridor_metal_grate', name: 'Corridor Metal Grate', indices: [242], collidable: false },
  // --- Default Fallback ---
  DEFAULT: { id: 'default', name: 'Default', indices: [208], collidable: false }
});
/**
 * Defines the tile types available in the 'casiowall' tileset.
 * The indices are based on a 48x48 grid for the 'CasinoWall.png' asset.
 */
export const CasinoWallTypes = Object.freeze({
  // --- Basic Walls ---
  PLAIN_STONE_WALL: { id: 'plain_stone', name: 'Plain Stone', indices: [8], collidable: true },
  ROUND_PATTERN_WALL: { id: 'round_pattern', name: 'Round Pattern', indices: [2], collidable: true },
  BRICK_WALL: { id: 'brick', name: 'Brick', indices: [4], collidable: true },
  HERRINGBONE_WALL: { id: 'herringbone', name: 'Herringbone', indices: [86], collidable: true },
  TILE_WALL: { id: 'tile', name: 'Tile', indices: [12], collidable: true },
  WOOD_PANEL_WALL: { id: 'wood_panel', name: 'Wood Panel', indices: [10], collidable: true },
  CHECKER_WALL: { id: 'checker', name: 'Checker', indices: [14], collidable: true },
  NEON_HEXAGON_WALL: { id: 'neon_hexagon', name: 'Neon Hexagon', indices: [88], collidable: true },
  LIT_STRIPS_WALL: { id: 'lit_strips', name: 'Lit Strips', indices: [164], collidable: true },
  CIRCULAR_EDGE_WITH_NEON_DOT_ROOF_WALL: { id: 'circular_edge_with_neon_dot_roof', name: 'Circular Edge With Neon Dot Roof', indices: [], collidable: false },
  TECH_CRYSTAL_WALLS_WALL: { id: 'tech_crystal_walls', name: 'Tech Crystal Walls', indices: [160], collidable: true },
  
  // --- Corridor Specific ---
  CORRIDOR_CONCRETE_WALL: { id: 'corridor_concrete', name: 'Corridor Concrete', indices: [6], collidable: true },
});
/**
 * Defines the tile types available in the 'casinoobjects' tileset.
 * The indices are based on a 48x48 grid for the 'CasinoObjects.png' asset.
 * These are in a 2 dimensional array to represent how wide something is and how tall it is
 */
export const CasinoObjectTypes = Object.freeze({
  // --- Slot Machines ---
  SLOT_MACHINE_LEFT: { id: 'slot_machine_left', name: 'Slot Machine (Left)', indices: [[6],[22],[38]], collidable: true },
    SLOT_MACHINE_RIGHT: { id: 'slot_machine_right', name: 'Slot Machine (Right)', indices: [[7],[23],[39]], collidable: true },
    SLOT_MACHINE_FRONT: { id: 'slot_machine_front', name: 'Slot Machine (Front)', indices: [[3],[19],[35]], collidable: true },
    CRAPS_TABLE: { id: 'craps_table', name: 'Craps Table', indices: [[48],[64],[80]], collidable: true },
    ROULETTE_WHEEL_BOTTOM_RIGHT_TABLE: { id: 'roulette_wheel_bottom_right_table', name: 'Roulette Wheel Bottom Right Table', indices: [[4,5],[20,21],[36,37]], collidable: true },
    ROULETTE_WHEEL_BOTTOM_LEFT_TABLE: { id: 'roulette_wheel_bottom_left_table', name: 'Roulette Wheel Bottom Left Table', indices: [[83,84,85],[99,100,101]], collidable: true },
    ROULETTE_WHEEL_TOP_RIGHT_TABLE: { id: 'roulette_wheel_top_right_table', name: 'Roulette Wheel Top Right Table', indices: [[51,52,53],[67,68,69]], collidable: true },
    ROULETTE_WHEEL_TOP_LEFT_TABLE: { id: 'roulette_wheel_top_left_table', name: 'Roulette Wheel Top Left Table', indices: [[49,50],[65,66],[81,82]], collidable: true },

    ATM_FRONT: { id: 'atm_front', name: 'ATM Front', indices: [[162],[178]], collidable: true },
    ATM_LEFT: { id: 'atm_left', name: 'ATM Left', indices: [[163],[179]], collidable: true },
    ATM_RIGHT: { id: 'atm_right', name: 'ATM Right', indices: [[164],[180]], collidable: true },

    POKER_TABLE: { id: 'poker_table', name: 'Poker Table', indices: [[181,182,183],[197,198,199]], collidable: true },
    
    BLACKJACK_DEALER_LEFT_TABLE: { id: 'blackjack_dealer_left_table', name: 'Blackjack Dealer Left Table', indices: [[128,129],[144,145]], collidable: true },
    BLACKJACK_DEALER_RIGHT_TABLE: { id: 'blackjack_dealer_right_table', name: 'Blackjack Dealer Right Table', indices: [[130,131],[146,147]], collidable: true },
    BLACKJACK_DEALER_TOP_TABLE: { id: 'blackjack_dealer_top_table', name: 'Blackjack Dealer Top Table', indices: [[117,118,119],[133,134,135]], collidable: true },
    BLACKJACK_DEALER_BOTTOM_TABLE: { id: 'blackjack_dealer_bottom_table', name: 'Blackjack Dealer Bottom Table', indices: [[120,121,122],[136,137,138]], collidable: true },
});
// --- Room Theme Definitions ---
/**
 * Defines themes for rooms and maps them to specific floor tile types.
 * This allows the level generator to create visually distinct areas.
 */
export const RoomThemes = Object.freeze({
    SLOTS: {
        id: 'slots',
        name: 'Slot Machine Zone',
        floorTypes: [CasinoFloorTypes.DIAMOND_PATTERN_TEAL, CasinoFloorTypes.DIAMOND_PATTERN_PURPLE, CasinoFloorTypes.NEON_STRIPE_FLOOR],
        wallTypes: [CasinoWallTypes.NEON_HEXAGON_WALL, CasinoWallTypes.LIT_STRIPS_WALL, CasinoWallTypes.CHECKER_WALL],
        objectTypes: [CasinoObjectTypes.SLOT_MACHINE_FRONT, CasinoObjectTypes.SLOT_MACHINE_LEFT, CasinoObjectTypes.SLOT_MACHINE_RIGHT, CasinoObjectTypes.ATM_FRONT]
    },
    VIP_LOUNGE: {
        id: 'vip',
        name: 'VIP Lounge',
        floorTypes: [CasinoFloorTypes.BROWN_CARPET, CasinoFloorTypes.WOOD_PANEL],
        wallTypes: [CasinoWallTypes.WOOD_PANEL_WALL, CasinoWallTypes.ROUND_PATTERN_WALL],
        objectTypes: [CasinoObjectTypes.POKER_TABLE]
    },
    TABLE_GAMES: {
        id: 'tables',
        name: 'Table Game Area',
        floorTypes: [CasinoFloorTypes.HERRINGBONE, CasinoFloorTypes.BASKET_WEAVE, CasinoFloorTypes.BROWN_CARPET],
        wallTypes: [CasinoWallTypes.HERRINGBONE_WALL, CasinoWallTypes.TILE_WALL, CasinoWallTypes.BRICK_WALL],
        objectTypes: [CasinoObjectTypes.ROULETTE_WHEEL_TOP_LEFT_TABLE, CasinoObjectTypes.CRAPS_TABLE, CasinoObjectTypes.BLACKJACK_DEALER_TOP_TABLE]
    },
    MAIN_HALL: {
        id: 'main_hall',
        name: 'Main Hall',
        floorTypes: [CasinoFloorTypes.STONE_FLOOR, CasinoObjectTypes.TECH_CRYSTAL_TEAL, CasinoObjectTypes.TECH_CRYSTAL_PURPLE],
        wallTypes: [CasinoWallTypes.PLAIN_STONE_WALL, CasinoWallTypes.TECH_CRYSTAL_WALLS_WALL],
        objectTypes: [CasinoObjectTypes.ATM_FRONT]
    },
    WATER_FEATURE: {
        id: 'water_feature',
        name: 'Water Feature',
        floorTypes: [CasinoFloorTypes.NEON_WATER_BLUE, CasinoFloorTypes.NEON_WATER_PINK, CasinoFloorTypes.NEON_WATER_PURPLE],
        wallTypes: [], // No walls, it's a water feature
        objectTypes: []
    },
});