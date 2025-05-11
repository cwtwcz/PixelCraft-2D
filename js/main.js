import { BLOCK_SIZE, VIEW_COLS, VIEW_ROWS, INTERACTION_RADIUS, GRAVITY, JUMP_STRENGTH, PLAYER_MAX_SPEED_X, PLAYER_ACCEL_X, PLAYER_FRICTION, OPTIMAL_TIME, BLOCK_TYPES, SEEDLING_GROWTH_TIME } from './config.js';
import { BLOCK_COLORS, BLOCK_NAMES, INVENTORY_BLOCKS, PASSABLE_BLOCKS } from './blocks.js';
import { worldData, getKey, getBlock, setBlock, pregenerateInitialArea } from './world.js';
import { updateHotbar as updateHotbarUI } from './ui.js';
import { draw } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hotbarElement = document.getElementById('hotbar');
const mineButton = document.getElementById('mineButton');
const placeButton = document.getElementById('placeButton');
const currentToolText = document.getElementById('currentToolText');

let inventory = {};
let selectedBlockMaterial = INVENTORY_BLOCKS[0];
let currentTool = 'mine';

let player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: BLOCK_SIZE * 0.8,
    height: BLOCK_SIZE * 0.95,
    color: 'red',
    isOnGround: false,
    canJump: true
};

let camera = { x: 0, y: 0 };
let keysPressed = {};

let seedlings = [];

function setTool(toolName, blockMaterial) {
    currentTool = toolName;
    if (blockMaterial !== undefined) selectedBlockMaterial = blockMaterial;
    updateToolUI();
}

function updateToolUI() {
    if (currentTool === 'mine') {
        mineButton.classList.add('active');
        placeButton.classList.remove('active');
        currentToolText.textContent = "Tool: Mine. Arrows/AD to Move, Space/Up/W to Jump.";
    } else {
        placeButton.classList.add('active');
        mineButton.classList.remove('active');
        const blockName = BLOCK_NAMES[selectedBlockMaterial] || 'Unknown Block';
        currentToolText.textContent = `Tool: Place ${blockName}. Arrows/AD to Move, Space/Up/W to Jump.`;
    }
}

function updateCamera() {
    camera.x = player.x + player.width / 2 - canvas.width / 2;
    camera.y = player.y + player.height / 2 - canvas.height / 2;
}

function handleCanvasInteraction(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasClickX = (event.clientX - rect.left) * scaleX;
    const canvasClickY = (event.clientY - rect.top) * scaleY;
    const worldPixelX = canvasClickX + camera.x;
    const worldPixelY = canvasClickY + camera.y;
    const worldGridCol = Math.floor(worldPixelX / BLOCK_SIZE);
    const worldGridRow = Math.floor(worldPixelY / BLOCK_SIZE);
    const playerGridCol = Math.floor((player.x + player.width / 2) / BLOCK_SIZE);
    const playerGridRow = Math.floor((player.y + player.height / 2) / BLOCK_SIZE);
    const distCol = Math.abs(worldGridCol - playerGridCol);
    const distRow = Math.abs(worldGridRow - playerGridRow);
    if (distCol > INTERACTION_RADIUS || distRow > INTERACTION_RADIUS) {
        currentToolText.textContent = "Target out of reach!";
        setTimeout(() => {
            if (currentToolText.textContent === "Target out of reach!") updateToolUI();
        }, 1500);
        return;
    }
    if (currentTool === 'place') placeBlock(worldGridRow, worldGridCol);
    else mineBlock(worldGridRow, worldGridCol);
}

function updatePlayer(deltaTimeFactor) {
    if (keysPressed['arrowleft'] || keysPressed['a']) player.vx -= PLAYER_ACCEL_X * deltaTimeFactor;
    if (keysPressed['arrowright'] || keysPressed['d']) player.vx += PLAYER_ACCEL_X * deltaTimeFactor;
    player.vx *= Math.pow(PLAYER_FRICTION, deltaTimeFactor);
    if (Math.abs(player.vx) > PLAYER_MAX_SPEED_X) player.vx = Math.sign(player.vx) * PLAYER_MAX_SPEED_X;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    if ((keysPressed['arrowup'] || keysPressed['w'] || keysPressed['space']) && player.isOnGround && player.canJump) {
        player.vy = JUMP_STRENGTH;
        player.isOnGround = false;
        player.canJump = false;
    }
    if (!(keysPressed['arrowup'] || keysPressed['w'] || keysPressed['space'])) player.canJump = true;
    player.vy += GRAVITY * deltaTimeFactor;
    let prevX = player.x;
    let prevY = player.y;
    player.x += player.vx * deltaTimeFactor;
    handleCollisions('horizontal');
    player.y += player.vy * deltaTimeFactor;
    player.isOnGround = false;
    handleCollisions('vertical');
    const pGridCol = Math.floor((player.x + player.width/2) / BLOCK_SIZE);
    const pGridRow = Math.floor((player.y + player.height/2) / BLOCK_SIZE);
    if (!PASSABLE_BLOCKS.has(getBlock(pGridRow, pGridCol))) {
        const pPrevGridCol = Math.floor((prevX + player.width/2) / BLOCK_SIZE);
        const pPrevGridRow = Math.floor((prevY + player.height/2) / BLOCK_SIZE);
        if(PASSABLE_BLOCKS.has(getBlock(pPrevGridRow, pPrevGridCol))) {
            player.x = prevX;
            player.y = prevY;
            player.vx = 0;
            player.vy = 0;
        } else {
            player.y -= BLOCK_SIZE;
            player.vy = 0;
        }
    }
    const playerViewCol = Math.floor((player.x - camera.x) / BLOCK_SIZE);
    const playerViewRow = Math.floor((player.y - camera.y) / BLOCK_SIZE);
    if (playerViewCol < 5 || playerViewCol > VIEW_COLS - 5 || playerViewRow < 5 || playerViewRow > VIEW_ROWS - 5) {
        pregenerateInitialArea(player);
    }
}

function handleCollisions(axis) {
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const startCol = Math.floor(playerLeft / BLOCK_SIZE);
    const endCol = Math.floor(playerRight / BLOCK_SIZE);
    const startRow = Math.floor(playerTop / BLOCK_SIZE);
    const endRow = Math.floor(playerBottom / BLOCK_SIZE);
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const blockType = getBlock(r, c);
            if (!PASSABLE_BLOCKS.has(blockType)) {
                const blockLeft = c * BLOCK_SIZE;
                const blockRight = blockLeft + BLOCK_SIZE;
                const blockTop = r * BLOCK_SIZE;
                const blockBottom = blockTop + BLOCK_SIZE;
                if (playerRight > blockLeft && playerLeft < blockRight && playerBottom > blockTop && playerTop < blockBottom) {
                    if (axis === 'horizontal') {
                        if (player.vx > 0) player.x = blockLeft - player.width;
                        else if (player.vx < 0) player.x = blockRight;
                        player.vx = 0;
                    } else if (axis === 'vertical') {
                        if (player.vy > 0) {
                            player.y = blockTop - player.height;
                            player.isOnGround = true;
                            player.canJump = true;
                        } else if (player.vy < 0) {
                            player.y = blockBottom;
                        }
                        player.vy = 0;
                    }
                }
            }
        }
    }
}

function mineBlock(worldRow, worldCol) {
    const blockType = getBlock(worldRow, worldCol);
    // Mining a seedling or planted grass returns a seed and restores grass
    if (blockType === BLOCK_TYPES.SEEDLING) {
        setBlock(worldRow, worldCol, BLOCK_TYPES.AIR);
        if (getBlock(worldRow + 1, worldCol) === BLOCK_TYPES.PLANTED_GRASS) {
            setBlock(worldRow + 1, worldCol, BLOCK_TYPES.GRASS);
        }
        inventory[BLOCK_TYPES.SEED] = (inventory[BLOCK_TYPES.SEED] || 0) + 1;
        updateHotbar();
        return;
    }
    if (blockType === BLOCK_TYPES.PLANTED_GRASS) {
        setBlock(worldRow, worldCol, BLOCK_TYPES.GRASS);
        if (getBlock(worldRow - 1, worldCol) === BLOCK_TYPES.SEEDLING) {
            setBlock(worldRow - 1, worldCol, BLOCK_TYPES.AIR);
        }
        inventory[BLOCK_TYPES.SEED] = (inventory[BLOCK_TYPES.SEED] || 0) + 1;
        updateHotbar();
        return;
    }
    if (!PASSABLE_BLOCKS.has(blockType) && blockType !== BLOCK_TYPES.AIR) {
        // Wood always drops wood
        if (blockType === BLOCK_TYPES.WOOD) {
            inventory[BLOCK_TYPES.WOOD] = (inventory[BLOCK_TYPES.WOOD] || 0) + 1;
        }
        // Leaves sometimes drop a seed (avg 1.5 per tree, so ~0.2 chance per leaf)
        else if (blockType === BLOCK_TYPES.LEAVES) {
            if (Math.random() < 0.2) {
                inventory[BLOCK_TYPES.SEED] = (inventory[BLOCK_TYPES.SEED] || 0) + 1;
                currentToolText.textContent = 'You found a seed!';
                setTimeout(updateToolUI, 1200);
            }
        }
        // Other blocks: default drop
        else if (BLOCK_NAMES.hasOwnProperty(blockType)) {
            inventory[blockType] = (inventory[blockType] || 0) + 1;
        }
        setBlock(worldRow, worldCol, BLOCK_TYPES.AIR);
        updateHotbar();
    }
}

function placeBlock(worldRow, worldCol) {
    const currentBlockInPlace = getBlock(worldRow, worldCol);
    const blockAbove = getBlock(worldRow - 1, worldCol);
    const playerGridCol = Math.floor((player.x + player.width / 2) / BLOCK_SIZE);
    const playerGridRow = Math.floor((player.y + player.height / 2) / BLOCK_SIZE);
    // Planting a seed: only if block above is air
    if (
        selectedBlockMaterial === BLOCK_TYPES.SEED &&
        (currentBlockInPlace === BLOCK_TYPES.GRASS || currentBlockInPlace === BLOCK_TYPES.DIRT) &&
        blockAbove === BLOCK_TYPES.AIR
    ) {
        if (inventory[BLOCK_TYPES.SEED] && inventory[BLOCK_TYPES.SEED] > 0) {
            setBlock(worldRow, worldCol, BLOCK_TYPES.PLANTED_GRASS);
            setBlock(worldRow - 1, worldCol, BLOCK_TYPES.SEEDLING);
            inventory[BLOCK_TYPES.SEED]--;
            updateHotbar();
            growSeedling(worldRow - 1, worldCol);
        } else {
            currentToolText.textContent = `No seeds in inventory!`;
            setTimeout(updateToolUI, 1500);
        }
        return;
    }
    // Normal block placement
    if (PASSABLE_BLOCKS.has(currentBlockInPlace) && !(worldRow === playerGridRow && worldCol === playerGridCol)) {
        if (inventory[selectedBlockMaterial] && inventory[selectedBlockMaterial] > 0) {
            setBlock(worldRow, worldCol, selectedBlockMaterial);
            inventory[selectedBlockMaterial]--;
            updateHotbar();
        } else {
            currentToolText.textContent = `No ${BLOCK_NAMES[selectedBlockMaterial]} in inventory!`;
            setTimeout(() => {
                if (currentToolText.textContent === `No ${BLOCK_NAMES[selectedBlockMaterial]} in inventory!`) updateToolUI();
            }, 1500);
        }
    }
}

function growSeedling(row, col) {
    // First timer: grow to small tree
    const timer = setTimeout(() => {
        // Only grow if still a seedling and planted grass below
        if (getBlock(row, col) === BLOCK_TYPES.SEEDLING && getBlock(row + 1, col) === BLOCK_TYPES.PLANTED_GRASS) {
            setBlock(row, col, BLOCK_TYPES.AIR);
            setBlock(row + 1, col, BLOCK_TYPES.GRASS);
            growSmallTree(row + 1, col);
        }
    }, SEEDLING_GROWTH_TIME / 2); // Half the time for first phase
    seedlings.push({ row, col, timer });
}

function growSmallTree(baseRow, baseCol) {
    // Revert planted grass to normal grass
    setBlock(baseRow, baseCol, BLOCK_TYPES.GRASS);
    // Place 1-2 blocks of wood above the grass
    const trunkHeight = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < trunkHeight; i++) {
        setBlock(baseRow - 1 - i, baseCol, BLOCK_TYPES.WOOD);
    }
    // Place more leaves (3x2 cluster above trunk)
    const top = baseRow - 1 - (trunkHeight - 1);
    for (let dr = -1; dr <= 0; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (!(dr === 0 && dc === 0)) {
                setBlock(top + dr, baseCol + dc, BLOCK_TYPES.LEAVES);
            }
        }
    }
    setBlock(top - 1, baseCol, BLOCK_TYPES.LEAVES); // one leaf on top
    // Second timer: grow to big tree
    setTimeout(() => {
        // Only grow if trunk is still present
        if (getBlock(baseRow - 1, baseCol) === BLOCK_TYPES.WOOD) {
            import('./world.js').then(world => {
                world.generateTree(baseRow, baseCol);
            });
        }
    }, SEEDLING_GROWTH_TIME / 1.5);
}

function updateHotbar() {
    updateHotbarUI(hotbarElement, inventory, selectedBlockMaterial, setTool, updateHotbar);
}

function setupEventListeners() {
    canvas.addEventListener('click', handleCanvasInteraction);
    mineButton.addEventListener('click', () => setTool('mine'));
    placeButton.addEventListener('click', () => setTool('place'));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch controls
    const touchLeft = document.getElementById('touchLeft');
    const touchRight = document.getElementById('touchRight');
    const touchJump = document.getElementById('touchJump');

    // Touch start events
    touchLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keysPressed['arrowleft'] = true;
    });
    touchRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keysPressed['arrowright'] = true;
    });
    touchJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keysPressed['arrowup'] = true;
    });

    // Touch end events
    touchLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keysPressed['arrowleft'] = false;
    });
    touchRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keysPressed['arrowright'] = false;
    });
    touchJump.addEventListener('touchend', (e) => {
        e.preventDefault();
        keysPressed['arrowup'] = false;
    });

    // Touch cancel events (for when touch moves outside button)
    touchLeft.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keysPressed['arrowleft'] = false;
    });
    touchRight.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keysPressed['arrowright'] = false;
    });
    touchJump.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keysPressed['arrowup'] = false;
    });

    // Canvas touch interaction
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (event.touches.length > 0) handleCanvasInteraction(event.touches[0]);
    }, { passive: false });
}

function handleKeyDown(event) {
    keysPressed[event.key.toLowerCase()] = true;
    keysPressed[event.code.toLowerCase()] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "space"].includes(event.key.toLowerCase())) event.preventDefault();
}
function handleKeyUp(event) {
    keysPressed[event.key.toLowerCase()] = false;
    keysPressed[event.code.toLowerCase()] = false;
}

function init() {
    canvas.width = VIEW_COLS * BLOCK_SIZE;
    canvas.height = VIEW_ROWS * BLOCK_SIZE;
    INVENTORY_BLOCKS.forEach(type => { inventory[type] = 0; });
    inventory[BLOCK_TYPES.WOOD] = 20;
    inventory[BLOCK_TYPES.STONE] = 10;
    player.x = Math.floor(VIEW_COLS / 2) * BLOCK_SIZE;
    player.y = (50 - 2) * BLOCK_SIZE;
    pregenerateInitialArea(player);
    updateCamera();
    setupEventListeners();
    updateHotbar();
    updateToolUI();
    gameLoop();
}

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const cappedDeltaTime = Math.min(deltaTime, 50);
    const deltaTimeFactor = cappedDeltaTime / OPTIMAL_TIME;
    updatePlayer(deltaTimeFactor);
    updateCamera();
    draw(ctx, canvas, camera, getBlock, player, BLOCK_SIZE, worldData, getKey);
    requestAnimationFrame(gameLoop);
}

window.onload = function() {
    init();
}; 