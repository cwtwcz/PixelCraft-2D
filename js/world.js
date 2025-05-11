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
    if (row < SURFACE_LEVEL) {
        blockType = BLOCK_TYPES.AIR;
    } else if (row === SURFACE_LEVEL) {
        blockType = BLOCK_TYPES.GRASS;
        if (Math.random() < 0.12 && canPlaceTree(row, col)) {
            generateTree(row, col);
        }
    } else if (row <= SURFACE_LEVEL + DIRT_LAYER_DEPTH) {
        if (Math.random() < 0.03 && row > SURFACE_LEVEL + 1) {
            blockType = BLOCK_TYPES.COAL;
        } else if (Math.random() < 0.02 && row > SURFACE_LEVEL + 2) {
            blockType = BLOCK_TYPES.IRON_ORE;
        } else {
            blockType = BLOCK_TYPES.DIRT;
        }
    } else {
        if (Math.random() < 0.08) {
            blockType = BLOCK_TYPES.COAL;
        } else if (Math.random() < 0.05) {
            blockType = BLOCK_TYPES.IRON_ORE;
        } else {
            blockType = BLOCK_TYPES.STONE;
        }
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

export function generateTree(baseRow, baseCol) {
    console.log('Generating tree at:', baseRow, baseCol);
    const trunkHeight = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < trunkHeight; i++) {
        setBlock(baseRow - i, baseCol, BLOCK_TYPES.WOOD);
    }
    for (let r = -2; r <= 0; r++) {
        for (let c = -1; c <= 1; c++) {
            if (!(r === 0 && c === 0)) {
                setBlock(baseRow - trunkHeight + r, baseCol + c, BLOCK_TYPES.LEAVES);
            }
        }
    }
}

function canPlaceTree(row, col) {
    if (getBlock(row, col) !== BLOCK_TYPES.GRASS) {
        console.log('Tree rejected: not on grass', row, col);
        return false;
    }
    for (let i = 1; i <= 5; i++) {
        if (getBlock(row - i, col) !== BLOCK_TYPES.AIR) {
            console.log('Tree rejected: no space above', row, col);
            return false;
        }
    }
    return true;
}

export function pregenerateInitialArea(player) {
    console.log('pregenerateInitialArea called');
    const playerGridCol = Math.floor(player.x / BLOCK_SIZE);
    const playerGridRow = Math.floor(player.y / BLOCK_SIZE);
    
    const viewRange = Math.max(VIEW_ROWS, VIEW_COLS);
    for (let rOffset = -viewRange; rOffset <= viewRange; rOffset++) {
        for (let cOffset = -viewRange; cOffset <= viewRange; cOffset++) {
            const row = playerGridRow + rOffset;
            const col = playerGridCol + cOffset;
            // Log each loop iteration for debugging
            if (rOffset === 0 && cOffset === 0) {
                console.log('Loop running at player position:', row, col);
            }
            generateBlockIfNeeded(row, col);
            if (row === SURFACE_LEVEL && Math.random() < 0.15 && Math.abs(rOffset) > 3 && Math.abs(cOffset) > 3) {
                console.log('Attempting tree at surface:', row, col);
                if (canPlaceTree(row, col)) {
                    generateTree(row, col);
                }
            }
        }
    }
} 