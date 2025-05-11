import { BLOCK_TYPES, SURFACE_LEVEL, DIRT_LAYER_DEPTH, VIEW_ROWS, VIEW_COLS, BLOCK_SIZE } from './config.js';
import { INVENTORY_BLOCKS } from './blocks.js';

export let worldData = {};

export function getKey(row, col) {
    return `${row}_${col}`;
}

export function generateBlockIfNeeded(row, col) {
    const key = getKey(row, col);
    if (worldData[key] !== undefined) return worldData[key];

    let blockType;
    if (row < SURFACE_LEVEL) blockType = BLOCK_TYPES.AIR;
    else if (row === SURFACE_LEVEL) blockType = BLOCK_TYPES.GRASS;
    else if (row <= SURFACE_LEVEL + DIRT_LAYER_DEPTH) {
        if (Math.random() < 0.03 && row > SURFACE_LEVEL + 1) blockType = BLOCK_TYPES.COAL;
        else if (Math.random() < 0.02 && row > SURFACE_LEVEL + 2) blockType = BLOCK_TYPES.IRON_ORE;
        else blockType = BLOCK_TYPES.DIRT;
    } else {
        if (Math.random() < 0.08) blockType = BLOCK_TYPES.COAL;
        else if (Math.random() < 0.05) blockType = BLOCK_TYPES.IRON_ORE;
        else blockType = BLOCK_TYPES.STONE;
    }
    worldData[key] = blockType;
    return blockType;
}

export function getBlock(row, col) {
    return generateBlockIfNeeded(row, col);
}

export function setBlock(row, col, type) {
    worldData[getKey(row, col)] = type;
}

export function pregenerateInitialArea(player) {
    const playerGridCol = Math.floor(player.x / BLOCK_SIZE);
    const playerGridRow = Math.floor(player.y / BLOCK_SIZE);
    for (let rOffset = -VIEW_ROWS; rOffset <= VIEW_ROWS; rOffset++) {
        for (let cOffset = -VIEW_COLS; cOffset <= VIEW_COLS; cOffset++) {
            generateBlockIfNeeded(playerGridRow + rOffset, playerGridCol + cOffset);
        }
    }
} 