// Game Configuration
export const BLOCK_SIZE = 32;       // Size of each block in pixels
export const VIEW_COLS = 20;        // Preferred number of columns visible (canvas width will adapt)
export const VIEW_ROWS = 15;        // Preferred number of rows visible (canvas height will adapt)
export const INTERACTION_RADIUS = 3; // Max distance (in blocks) player can interact

export const SURFACE_LEVEL = 50;    // Arbitrary 'world row index' for ground level, positive Y is downwards
export const DIRT_LAYER_DEPTH = 5;
export const STONE_START_DEPTH = SURFACE_LEVEL + DIRT_LAYER_DEPTH + 1;

// Physics Constants (Adjusted for slower speed)
export const GRAVITY = 0.35;         // Reduced gravity
export const JUMP_STRENGTH = -8.5;  // Reduced jump strength
export const PLAYER_MAX_SPEED_X = 5; // Reduced max horizontal speed
export const PLAYER_ACCEL_X = 0.65;   // Reduced horizontal acceleration
export const PLAYER_FRICTION = 0.88; // Slightly increased friction for quicker stops

// Target FPS for physics calculations if using deltaTime
export const TARGET_FPS = 60;
export const OPTIMAL_TIME = 1000 / TARGET_FPS; // Time per frame in ms

export const BLOCK_TYPES = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
    COAL: 6, IRON_ORE: 7, SAND: 8 
}; 