import { BLOCK_COLORS, PASSABLE_BLOCKS } from './blocks.js';
import { BLOCK_TYPES } from './config.js';

export function draw(ctx, canvas, camera, getBlock, player, BLOCK_SIZE, worldData, getKey) {
    ctx.fillStyle = BLOCK_COLORS[BLOCK_TYPES.AIR];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    const firstColToRender = Math.floor(camera.x / BLOCK_SIZE);
    const lastColToRender = Math.ceil((camera.x + canvas.width) / BLOCK_SIZE);
    const firstRowToRender = Math.floor(camera.y / BLOCK_SIZE);
    const lastRowToRender = Math.ceil((camera.y + canvas.height) / BLOCK_SIZE);

    for (let r = firstRowToRender; r < lastRowToRender; r++) {
        for (let c = firstColToRender; c < lastColToRender; c++) {
            const blockType = getBlock(r, c);
            const blockX = c * BLOCK_SIZE;
            const blockY = r * BLOCK_SIZE;

            ctx.fillStyle = BLOCK_COLORS[blockType] || 'purple';
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);

            if (blockType !== BLOCK_TYPES.AIR) {
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(blockX + 0.5, blockY + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    ctx.restore();
} 