import { BLOCK_COLORS, BLOCK_NAMES, INVENTORY_BLOCKS } from './blocks.js';

export function updateHotbar(hotbarElement, inventory, selectedBlockMaterial, setTool, updateHotbarCallback) {
    hotbarElement.innerHTML = '';
    INVENTORY_BLOCKS.forEach(materialType => {
        const slot = document.createElement('div');
        slot.classList.add('hotbar-slot', 'rounded');
        if (materialType === selectedBlockMaterial) slot.classList.add('selected');

        const icon = document.createElement('div');
        icon.classList.add('block-icon', 'rounded-sm');
        icon.style.backgroundColor = BLOCK_COLORS[materialType];
        slot.appendChild(icon);

        const count = document.createElement('span');
        count.classList.add('block-count');
        count.textContent = inventory[materialType] || 0;
        slot.appendChild(count);
        
        slot.title = BLOCK_NAMES[materialType] || 'Unknown Block';

        slot.addEventListener('click', () => {
            setTool('place', materialType);
            updateHotbarCallback();
        });
        hotbarElement.appendChild(slot);
    });
} 